-- 🔄 优化的任务数据结构脚本
-- 1. 简化repeat_type和repeat_frequency为单一字段
-- 2. 支持永远重复的任务

-- ==========================================
-- 阶段1: 修改现有tasks表结构
-- ==========================================

-- 首先备份现有数据
CREATE TABLE IF NOT EXISTS tasks_backup_before_optimization AS SELECT * FROM tasks;

-- 添加新的优化字段
ALTER TABLE tasks 
  -- 🎯 添加优化后的重复频率字段
  ADD COLUMN IF NOT EXISTS repeat_frequency_new TEXT CHECK (
    repeat_frequency_new IN ('never', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'forever')
  ),
  
  -- 🎯 添加核心时间字段（如果还没有）
  ADD COLUMN IF NOT EXISTS earliest_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS required_count INTEGER,
  ADD COLUMN IF NOT EXISTS task_deadline TIMESTAMPTZ,
  
  -- 🎯 添加每日时间窗口字段
  ADD COLUMN IF NOT EXISTS daily_time_start TIME,
  ADD COLUMN IF NOT EXISTS daily_time_end TIME,
  
  -- 🎯 添加完成跟踪字段
  ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_record JSONB DEFAULT '{}';

-- ==========================================
-- 阶段2: 数据迁移
-- ==========================================

-- 迁移repeat_frequency_new字段
UPDATE tasks 
SET repeat_frequency_new = CASE 
  WHEN repeat_type = 'once' THEN 'never'
  WHEN repeat_type = 'repeat' AND repeat_frequency IS NULL THEN 'daily'
  WHEN repeat_type = 'repeat' THEN repeat_frequency
  ELSE 'never'
END
WHERE repeat_frequency_new IS NULL;

-- 迁移时间字段
UPDATE tasks 
SET earliest_start_time = COALESCE(
    task_start_time,
    start_date::TIMESTAMPTZ,
    created_at
  ),
  required_count = CASE 
    WHEN repeat_frequency_new = 'never' THEN 1
    WHEN duration = '21days' THEN 21
    WHEN duration = '1month' THEN 30
    WHEN duration = '6months' THEN 180
    WHEN duration = '1year' THEN 365
    ELSE 1
  END,
  task_deadline = CASE 
    WHEN repeat_frequency_new = 'forever' THEN NULL
    ELSE COALESCE(
      deadline,
      task_end_time,
      end_date::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes',
      created_at + INTERVAL '30 days'
    )
  END
WHERE earliest_start_time IS NULL;

-- 迁移每日时间窗口
UPDATE tasks 
SET daily_time_start = CASE 
    WHEN repeat_time IS NOT NULL THEN repeat_time
    WHEN task_start_time IS NOT NULL THEN task_start_time::TIME
    ELSE NULL
  END,
  daily_time_end = CASE 
    WHEN task_end_time IS NOT NULL THEN task_end_time::TIME
    ELSE NULL
  END
WHERE daily_time_start IS NULL AND daily_time_end IS NULL;

-- ==========================================
-- 阶段3: 删除旧字段并重命名新字段
-- ==========================================

-- 删除旧的重复相关字段
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS repeat_type,
  DROP COLUMN IF EXISTS repeat_frequency,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date,
  DROP COLUMN IF EXISTS repeat_time,
  DROP COLUMN IF EXISTS task_start_time,
  DROP COLUMN IF EXISTS task_end_time,
  DROP COLUMN IF EXISTS has_specific_time;

-- 重命名新字段
ALTER TABLE tasks 
  RENAME COLUMN repeat_frequency_new TO repeat_frequency;

-- 设置新字段为NOT NULL并添加默认值
ALTER TABLE tasks 
  ALTER COLUMN repeat_frequency SET NOT NULL,
  ALTER COLUMN repeat_frequency SET DEFAULT 'never';

-- ==========================================
-- 阶段4: 添加数据约束
-- ==========================================

-- 添加数据一致性约束
ALTER TABLE tasks 
  -- 一次性任务和有限重复任务必须有required_count
  ADD CONSTRAINT check_required_count_consistency 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly') AND required_count > 0) OR
      (repeat_frequency = 'forever' AND required_count IS NULL)
    ),
  
  -- 永远重复任务不能有截止时间
  ADD CONSTRAINT check_forever_task_deadline 
    CHECK (
      (repeat_frequency = 'forever' AND task_deadline IS NULL) OR
      (repeat_frequency != 'forever')
    ),
  
  -- 完成次数不能为负数
  ADD CONSTRAINT check_completed_count_positive 
    CHECK (completed_count >= 0),
  
  -- 连续次数不能为负数
  ADD CONSTRAINT check_streak_positive 
    CHECK (current_streak >= 0 AND longest_streak >= 0),
  
  -- 时间窗口逻辑检查
  ADD CONSTRAINT check_daily_time_window
    CHECK (daily_time_start IS NULL OR daily_time_end IS NULL OR daily_time_start < daily_time_end);

-- ==========================================
-- 阶段5: 创建优化的索引
-- ==========================================

-- 删除旧索引（如果存在）
DROP INDEX IF EXISTS idx_tasks_repeat_type;
DROP INDEX IF EXISTS idx_tasks_repeat_frequency;

-- 创建新的优化索引
CREATE INDEX IF NOT EXISTS idx_tasks_repeat_frequency_new 
  ON tasks(repeat_frequency);

CREATE INDEX IF NOT EXISTS idx_tasks_time_range 
  ON tasks(earliest_start_time, task_deadline) 
  WHERE repeat_frequency != 'never';

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_active 
  ON tasks(assignee_id, status) 
  WHERE assignee_id IS NOT NULL AND status IN ('assigned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_tasks_completion_progress 
  ON tasks(completed_count, required_count) 
  WHERE repeat_frequency != 'forever';

CREATE INDEX IF NOT EXISTS idx_tasks_forever_active 
  ON tasks(assignee_id, status) 
  WHERE repeat_frequency = 'forever' AND status IN ('assigned', 'in_progress');

-- ==========================================
-- 阶段6: 更新函数
-- ==========================================

-- 计算理论完成时间（更新版）
CREATE OR REPLACE FUNCTION calculate_theoretical_end_time(
  start_time TIMESTAMPTZ,
  required_count INTEGER,
  frequency TEXT
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- 永远重复的任务没有理论完成时间
  IF frequency = 'forever' OR required_count IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 一次性任务
  IF frequency = 'never' THEN
    RETURN start_time;
  END IF;
  
  -- 重复任务
  CASE frequency
    WHEN 'daily' THEN
      RETURN start_time + (required_count - 1) * INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN start_time + (required_count - 1) * INTERVAL '1 week';
    WHEN 'biweekly' THEN
      RETURN start_time + (required_count - 1) * INTERVAL '2 weeks';
    WHEN 'monthly' THEN
      RETURN start_time + (required_count - 1) * INTERVAL '1 month';
    WHEN 'yearly' THEN
      RETURN start_time + (required_count - 1) * INTERVAL '1 year';
    ELSE
      RETURN start_time;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 获取任务类型
CREATE OR REPLACE FUNCTION get_task_type(frequency TEXT) 
RETURNS TEXT AS $$
BEGIN
  CASE frequency
    WHEN 'never' THEN RETURN 'once';
    WHEN 'forever' THEN RETURN 'forever_repeat';
    ELSE RETURN 'limited_repeat';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 判断任务时间类型（更新版）
CREATE OR REPLACE FUNCTION get_task_time_type(
  start_time TIMESTAMPTZ,
  required_count INTEGER,
  frequency TEXT,
  deadline TIMESTAMPTZ
) RETURNS TEXT AS $$
DECLARE
  theoretical_end TIMESTAMPTZ;
BEGIN
  -- 永远重复任务没有时间类型概念
  IF frequency = 'forever' THEN
    RETURN 'forever';
  END IF;
  
  -- 一次性任务
  IF frequency = 'never' THEN
    RETURN 'once';
  END IF;
  
  theoretical_end := calculate_theoretical_end_time(start_time, required_count, frequency);
  
  -- 如果理论完成时间接近截止时间（1天内），认为是固定时间
  IF theoretical_end IS NOT NULL AND deadline IS NOT NULL AND 
     ABS(EXTRACT(EPOCH FROM (theoretical_end - deadline))) < 86400 THEN
    RETURN 'fixed_schedule';
  ELSE
    RETURN 'flexible_range';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 检查今天是否可以完成任务（更新版）
CREATE OR REPLACE FUNCTION can_complete_task_today(
  task_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  today_str TEXT;
  current_time TIME;
  day_of_week INTEGER;
BEGIN
  -- 获取任务信息
  SELECT * INTO task_record FROM tasks WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否已经开始
  IF task_record.earliest_start_time IS NOT NULL AND NOW() < task_record.earliest_start_time THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否已过期（永远重复的任务不会过期）
  IF task_record.repeat_frequency != 'forever' AND 
     task_record.task_deadline IS NOT NULL AND 
     NOW() > task_record.task_deadline THEN
    RETURN FALSE;
  END IF;
  
  -- 检查今天是否已经完成
  today_str := TO_CHAR(NOW(), 'YYYY-MM-DD');
  IF (task_record.completion_record->today_str)::BOOLEAN = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否已经达到完成次数（永远重复的任务没有限制）
  IF task_record.repeat_frequency != 'forever' AND 
     task_record.required_count IS NOT NULL AND 
     task_record.completed_count >= task_record.required_count THEN
    RETURN FALSE;
  END IF;
  
  -- 检查每日时间窗口
  IF task_record.daily_time_start IS NOT NULL AND task_record.daily_time_end IS NOT NULL THEN
    current_time := NOW()::TIME;
    IF current_time < task_record.daily_time_start OR current_time > task_record.daily_time_end THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- 检查重复日期限制
  IF task_record.repeat_weekdays IS NOT NULL AND array_length(task_record.repeat_weekdays, 1) > 0 THEN
    day_of_week := CASE WHEN EXTRACT(DOW FROM NOW()) = 0 THEN 7 ELSE EXTRACT(DOW FROM NOW())::INTEGER END;
    IF NOT (day_of_week = ANY(task_record.repeat_weekdays)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 更新任务完成进度（更新版）
CREATE OR REPLACE FUNCTION update_task_completion(
  task_id_param UUID,
  completion_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  updated_record JSONB;
  new_completed_count INTEGER;
  new_current_streak INTEGER;
  new_longest_streak INTEGER;
  completion_date_str TEXT;
  new_status TEXT;
BEGIN
  -- 获取任务信息
  SELECT * INTO task_record FROM tasks WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '任务不存在';
  END IF;
  
  completion_date_str := TO_CHAR(completion_date_param, 'YYYY-MM-DD');
  
  -- 检查是否已经完成过这一天
  IF (task_record.completion_record->completion_date_str)::BOOLEAN = TRUE THEN
    RAISE EXCEPTION '今天已经完成过了';
  END IF;
  
  -- 更新完成记录
  updated_record := task_record.completion_record || jsonb_build_object(completion_date_str, true);
  
  -- 计算新的完成次数
  SELECT COUNT(*) INTO new_completed_count
  FROM jsonb_each_text(updated_record)
  WHERE value::BOOLEAN = TRUE;
  
  -- 计算当前连续天数
  new_current_streak := calculate_current_streak(updated_record, completion_date_str, task_record.repeat_frequency);
  
  -- 更新最长连续天数
  new_longest_streak := GREATEST(task_record.longest_streak, new_current_streak);
  
  -- 确定新状态
  CASE task_record.repeat_frequency
    WHEN 'never' THEN
      new_status := CASE WHEN new_completed_count >= 1 THEN 'completed' ELSE 'in_progress' END;
    WHEN 'forever' THEN
      new_status := 'in_progress';  -- 永远重复任务永远不会完成
    ELSE
      new_status := CASE 
        WHEN new_completed_count >= task_record.required_count THEN 'completed'
        WHEN new_completed_count > 0 THEN 'in_progress'
        ELSE task_record.status
      END;
  END CASE;
  
  -- 更新任务
  UPDATE tasks 
  SET completion_record = updated_record,
      completed_count = new_completed_count,
      current_streak = new_current_streak,
      longest_streak = new_longest_streak,
      status = new_status,
      completed_at = CASE 
        WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW()
        ELSE completed_at
      END,
      updated_at = NOW()
  WHERE id = task_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 阶段7: 创建优化的视图
-- ==========================================

-- 任务详情视图（更新版）
CREATE OR REPLACE VIEW task_details AS
SELECT 
  t.*,
  get_task_type(t.repeat_frequency) as task_type_category,
  get_task_time_type(
    t.earliest_start_time, 
    t.required_count, 
    t.repeat_frequency, 
    t.task_deadline
  ) as time_type,
  calculate_theoretical_end_time(
    t.earliest_start_time, 
    t.required_count, 
    t.repeat_frequency
  ) as theoretical_end_time,
  CASE 
    WHEN t.repeat_frequency = 'forever' THEN NULL
    WHEN t.task_deadline IS NOT NULL AND t.earliest_start_time IS NOT NULL THEN
      EXTRACT(DAYS FROM (t.task_deadline - t.earliest_start_time))::INTEGER
    ELSE NULL
  END as available_days,
  CASE 
    WHEN t.repeat_frequency = 'never' THEN 
      CASE WHEN t.completed_count >= 1 THEN 100.0 ELSE 0.0 END
    WHEN t.repeat_frequency = 'forever' THEN NULL  -- 永远重复任务没有完成百分比
    WHEN t.required_count > 0 THEN 
      (t.completed_count::DECIMAL / t.required_count * 100)
    ELSE 0.0
  END as completion_percentage,
  can_complete_task_today(t.id) as can_complete_today
FROM tasks t;

-- 今日任务视图（更新版）
CREATE OR REPLACE VIEW today_tasks AS
SELECT 
  td.*
FROM task_details td
WHERE td.assignee_id IS NOT NULL 
  AND td.status IN ('assigned', 'in_progress')
  AND td.can_complete_today = TRUE;

-- 永远重复任务视图
CREATE OR REPLACE VIEW forever_tasks AS
SELECT 
  td.*
FROM task_details td
WHERE td.repeat_frequency = 'forever'
  AND td.assignee_id IS NOT NULL 
  AND td.status IN ('assigned', 'in_progress');

-- ==========================================
-- 阶段8: 数据验证
-- ==========================================

DO $$
DECLARE
  total_tasks INTEGER;
  once_tasks INTEGER;
  limited_repeat_tasks INTEGER;
  forever_tasks INTEGER;
  invalid_tasks INTEGER;
BEGIN
  -- 统计任务数量
  SELECT COUNT(*) INTO total_tasks FROM tasks;
  SELECT COUNT(*) INTO once_tasks FROM tasks WHERE repeat_frequency = 'never';
  SELECT COUNT(*) INTO limited_repeat_tasks FROM tasks WHERE repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly');
  SELECT COUNT(*) INTO forever_tasks FROM tasks WHERE repeat_frequency = 'forever';
  
  -- 检查无效数据
  SELECT COUNT(*) INTO invalid_tasks FROM tasks WHERE repeat_frequency IS NULL;
  
  RAISE NOTICE '✅ 数据迁移验证结果：';
  RAISE NOTICE '   总任务数: %', total_tasks;
  RAISE NOTICE '   一次性任务: %', once_tasks;
  RAISE NOTICE '   有限重复任务: %', limited_repeat_tasks;
  RAISE NOTICE '   永远重复任务: %', forever_tasks;
  RAISE NOTICE '   无效任务: %', invalid_tasks;
  
  IF invalid_tasks > 0 THEN
    RAISE EXCEPTION '发现 % 个无效任务，请检查数据', invalid_tasks;
  END IF;
END $$;

-- ==========================================
-- 完成信息
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '🎉 任务结构优化完成！';
  RAISE NOTICE '📊 优化内容：';
  RAISE NOTICE '   ✅ 合并repeat_type和repeat_frequency为单一字段';
  RAISE NOTICE '   ✅ 新增forever重复频率支持永远重复任务';
  RAISE NOTICE '   ✅ 优化时间字段和约束';
  RAISE NOTICE '   ✅ 更新所有相关函数和视图';
  RAISE NOTICE '🎯 支持的任务类型：';
  RAISE NOTICE '   - never: 一次性任务';
  RAISE NOTICE '   - daily/weekly/monthly/yearly: 有限重复任务';
  RAISE NOTICE '   - forever: 永远重复任务';
  RAISE NOTICE '🔧 核心逻辑：';
  RAISE NOTICE '   - 一次性任务: required_count = 1';
  RAISE NOTICE '   - 有限重复: required_count > 0, 有task_deadline';
  RAISE NOTICE '   - 永远重复: required_count = null, task_deadline = null';
END $$;
