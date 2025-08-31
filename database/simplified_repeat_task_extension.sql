-- 🔄 简化的重复任务扩展脚本（情侣应用专用）
-- 只需要在现有tasks表基础上添加几个关键字段

-- ==========================================
-- 阶段1: 扩展现有tasks表
-- ==========================================

-- 添加重复任务的核心时间字段
ALTER TABLE tasks 
  -- 🎯 核心时间配置
  ADD COLUMN IF NOT EXISTS earliest_start_time TIMESTAMPTZ,      -- 最早开始时间
  ADD COLUMN IF NOT EXISTS required_count INTEGER,               -- 需要完成的次数
  ADD COLUMN IF NOT EXISTS task_deadline TIMESTAMPTZ,            -- 任务截止时间（替代原deadline概念）
  
  -- 🎯 每日时间窗口配置
  ADD COLUMN IF NOT EXISTS daily_time_start TIME,                -- 每日任务时间窗口开始
  ADD COLUMN IF NOT EXISTS daily_time_end TIME,                  -- 每日任务时间窗口结束
  
  -- 🎯 完成跟踪字段
  ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0,    -- 已完成次数
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,     -- 当前连续次数
  ADD COLUMN IF NOT EXISTS completion_record JSONB DEFAULT '{}'; -- 完成记录 {"2024-01-01": true, ...}

-- 添加约束
ALTER TABLE tasks 
  ADD CONSTRAINT IF NOT EXISTS check_required_count 
    CHECK (required_count IS NULL OR required_count > 0),
  ADD CONSTRAINT IF NOT EXISTS check_completed_count 
    CHECK (completed_count >= 0),
  ADD CONSTRAINT IF NOT EXISTS check_current_streak 
    CHECK (current_streak >= 0),
  ADD CONSTRAINT IF NOT EXISTS check_time_window
    CHECK (daily_time_start IS NULL OR daily_time_end IS NULL OR daily_time_start < daily_time_end);

-- ==========================================
-- 阶段2: 创建索引
-- ==========================================

-- 重复任务相关索引
CREATE INDEX IF NOT EXISTS idx_tasks_repeat_time_range 
  ON tasks(earliest_start_time, task_deadline) 
  WHERE repeat_type = 'repeat';

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status 
  ON tasks(assignee_id, status) 
  WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_completion_progress 
  ON tasks(completed_count, required_count) 
  WHERE repeat_type = 'repeat';

-- ==========================================
-- 阶段3: 创建辅助函数
-- ==========================================

-- 计算理论完成时间
CREATE OR REPLACE FUNCTION calculate_theoretical_end_time(
  start_time TIMESTAMPTZ,
  required_count INTEGER,
  frequency TEXT
) RETURNS TIMESTAMPTZ AS $$
BEGIN
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

-- 判断任务时间类型
CREATE OR REPLACE FUNCTION get_task_time_type(
  start_time TIMESTAMPTZ,
  required_count INTEGER,
  frequency TEXT,
  deadline TIMESTAMPTZ
) RETURNS TEXT AS $$
DECLARE
  theoretical_end TIMESTAMPTZ;
BEGIN
  theoretical_end := calculate_theoretical_end_time(start_time, required_count, frequency);
  
  -- 如果理论完成时间接近截止时间（1天内），认为是固定时间
  IF ABS(EXTRACT(EPOCH FROM (theoretical_end - deadline))) < 86400 THEN
    RETURN 'fixed_schedule';
  ELSE
    RETURN 'flexible_range';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 检查今天是否可以完成任务
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
  
  -- 检查是否在任务期间内
  IF NOW() < task_record.earliest_start_time OR NOW() > task_record.task_deadline THEN
    RETURN FALSE;
  END IF;
  
  -- 检查今天是否已经完成
  today_str := TO_CHAR(NOW(), 'YYYY-MM-DD');
  IF (task_record.completion_record->today_str)::BOOLEAN = TRUE THEN
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

-- 更新任务完成进度
CREATE OR REPLACE FUNCTION update_task_completion(
  task_id_param UUID,
  completion_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  updated_record JSONB;
  new_completed_count INTEGER;
  new_streak INTEGER;
  completion_date_str TEXT;
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
  
  -- 计算当前连续天数（简化版本，只检查最近的连续性）
  new_streak := calculate_current_streak(updated_record, completion_date_str, task_record.repeat_frequency);
  
  -- 更新任务
  UPDATE tasks 
  SET completion_record = updated_record,
      completed_count = new_completed_count,
      current_streak = new_streak,
      status = CASE 
        WHEN new_completed_count >= required_count THEN 'completed'
        WHEN new_completed_count > 0 THEN 'in_progress'
        ELSE status
      END,
      completed_at = CASE 
        WHEN new_completed_count >= required_count AND completed_at IS NULL THEN NOW()
        ELSE completed_at
      END,
      updated_at = NOW()
  WHERE id = task_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 计算当前连续天数（辅助函数）
CREATE OR REPLACE FUNCTION calculate_current_streak(
  completion_record JSONB,
  latest_date TEXT,
  frequency TEXT
) RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
  date_str TEXT;
  interval_step INTERVAL;
BEGIN
  -- 根据频率确定检查间隔
  CASE frequency
    WHEN 'daily' THEN interval_step := INTERVAL '1 day';
    WHEN 'weekly' THEN interval_step := INTERVAL '1 week';
    ELSE interval_step := INTERVAL '1 day';
  END CASE;
  
  check_date := latest_date::DATE;
  
  -- 从最新日期往前检查连续性
  LOOP
    date_str := TO_CHAR(check_date, 'YYYY-MM-DD');
    
    IF (completion_record->date_str)::BOOLEAN = TRUE THEN
      streak_count := streak_count + 1;
      check_date := check_date - interval_step;
    ELSE
      EXIT;
    END IF;
    
    -- 防止无限循环
    IF streak_count > 1000 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- 阶段4: 创建视图
-- ==========================================

-- 重复任务详情视图
CREATE OR REPLACE VIEW repeat_task_details AS
SELECT 
  t.*,
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
  EXTRACT(DAYS FROM (t.task_deadline - t.earliest_start_time)) as available_days,
  EXTRACT(DAYS FROM (
    calculate_theoretical_end_time(t.earliest_start_time, t.required_count, t.repeat_frequency) 
    - t.earliest_start_time
  )) as theoretical_days,
  CASE 
    WHEN t.completed_count >= t.required_count THEN 100.0
    ELSE (t.completed_count::DECIMAL / t.required_count * 100)
  END as completion_percentage
FROM tasks t
WHERE t.repeat_type = 'repeat';

-- 今日可完成任务视图
CREATE OR REPLACE VIEW today_available_tasks AS
SELECT 
  t.*,
  can_complete_task_today(t.id) as can_complete_today
FROM tasks t
WHERE t.repeat_type = 'repeat' 
  AND t.status IN ('assigned', 'in_progress')
  AND t.assignee_id IS NOT NULL;

-- ==========================================
-- 阶段5: 数据迁移
-- ==========================================

-- 为现有重复任务设置默认值
UPDATE tasks 
SET earliest_start_time = COALESCE(start_date::TIMESTAMPTZ, created_at),
    required_count = CASE 
      WHEN duration = '21days' THEN 21
      WHEN duration = '1month' THEN 30
      WHEN duration = '6months' THEN 180
      WHEN duration = '1year' THEN 365
      ELSE 1
    END,
    task_deadline = COALESCE(
      end_date::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes',
      deadline,
      created_at + INTERVAL '30 days'
    )
WHERE repeat_type = 'repeat' 
  AND earliest_start_time IS NULL;

-- ==========================================
-- 阶段6: 触发器
-- ==========================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- ==========================================
-- 完成信息
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 简化重复任务系统扩展完成！';
  RAISE NOTICE '📊 扩展内容：';
  RAISE NOTICE '   - tasks表新增核心时间字段';
  RAISE NOTICE '   - earliest_start_time: 最早开始时间';
  RAISE NOTICE '   - required_count: 需要完成的次数';
  RAISE NOTICE '   - task_deadline: 任务截止时间';
  RAISE NOTICE '   - completion_record: JSON格式完成记录';
  RAISE NOTICE '🎯 支持功能：';
  RAISE NOTICE '   - 固定时间重复任务（连续完成）';
  RAISE NOTICE '   - 灵活时间重复任务（时间范围内完成）';
  RAISE NOTICE '   - 自动进度跟踪和连续天数计算';
  RAISE NOTICE '   - 每日时间窗口限制';
  RAISE NOTICE '   - 每周指定日期重复';
  RAISE NOTICE '🔧 核心逻辑：';
  RAISE NOTICE '   - 理论完成时间 = 开始时间 + (次数-1) × 频率间隔';
  RAISE NOTICE '   - 理论时间 = 截止时间 → 固定时间完成';
  RAISE NOTICE '   - 理论时间 < 截止时间 → 灵活时间范围';
END $$;
