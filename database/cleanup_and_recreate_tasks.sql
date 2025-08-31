-- 🧹 清理原有数据库并重新创建优化的task表
-- 基于优化后的单表设计

-- ==========================================
-- 阶段1: 备份和清理
-- ==========================================

-- 备份现有数据（如果需要的话）
DROP TABLE IF EXISTS tasks_backup_final;
CREATE TABLE tasks_backup_final AS SELECT * FROM tasks;

-- 删除现有的tasks表和相关对象
DROP VIEW IF EXISTS task_details CASCADE;
DROP VIEW IF EXISTS today_tasks CASCADE;
DROP VIEW IF EXISTS forever_tasks CASCADE;
DROP VIEW IF EXISTS repeat_task_details CASCADE;
DROP VIEW IF EXISTS today_available_tasks CASCADE;

-- 删除相关函数
DROP FUNCTION IF EXISTS calculate_theoretical_end_time(TIMESTAMPTZ, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_task_type(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_task_time_type(TIMESTAMPTZ, INTEGER, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS can_complete_task_today(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_task_completion(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS calculate_current_streak(JSONB, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_tasks_updated_at() CASCADE;

-- 删除触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at_trigger ON tasks;

-- 删除现有的tasks表
DROP TABLE IF EXISTS tasks CASCADE;

-- ==========================================
-- 阶段2: 创建新的优化tasks表
-- ==========================================

CREATE TABLE tasks (
  -- 🎯 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  
  -- 🎯 任务分类
  task_type TEXT NOT NULL DEFAULT 'daily' CHECK (task_type IN ('daily', 'habit', 'special')),
  repeat_frequency TEXT NOT NULL DEFAULT 'never' CHECK (
    repeat_frequency IN ('never', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'forever')
  ),
  
  -- 🎯 核心时间配置
  earliest_start_time TIMESTAMPTZ,              -- 最早开始时间
  required_count INTEGER,                       -- 需要完成的次数（forever任务为null）
  task_deadline TIMESTAMPTZ,                    -- 任务截止时间（forever任务为null）
  
  -- 🎯 重复细节配置
  repeat_weekdays INTEGER[],                    -- [1,2,5] 周一、周二、周五
  daily_time_start TIME,                        -- 每日任务时间窗口开始
  daily_time_end TIME,                          -- 每日任务时间窗口结束
  
  -- 🎯 任务状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned')
  ),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 🎯 完成跟踪
  completed_count INTEGER NOT NULL DEFAULT 0,   -- 已完成次数
  current_streak INTEGER NOT NULL DEFAULT 0,    -- 当前连续次数
  longest_streak INTEGER NOT NULL DEFAULT 0,    -- 历史最长连续次数
  completion_record JSONB NOT NULL DEFAULT '{}', -- 完成记录 {"2024-01-01": true, ...}
  
  -- 🎯 其他字段
  requires_proof BOOLEAN NOT NULL DEFAULT FALSE,
  proof_url TEXT,
  review_comment TEXT,
  
  -- 🎯 系统字段
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ==========================================
-- 阶段3: 添加约束
-- ==========================================

ALTER TABLE tasks 
  -- 一次性任务必须有required_count = 1
  ADD CONSTRAINT check_once_task_count 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency != 'never')
    ),
  
  -- 有限重复任务必须有required_count > 0
  ADD CONSTRAINT check_limited_repeat_count 
    CHECK (
      (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly') AND required_count > 0) OR
      (repeat_frequency NOT IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly'))
    ),
  
  -- 永远重复任务不能有required_count和task_deadline
  ADD CONSTRAINT check_forever_task_constraints 
    CHECK (
      (repeat_frequency = 'forever' AND required_count IS NULL AND task_deadline IS NULL) OR
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
    CHECK (daily_time_start IS NULL OR daily_time_end IS NULL OR daily_time_start < daily_time_end),
  
  -- 重复日期检查（1-7代表周一到周日）
  ADD CONSTRAINT check_repeat_weekdays
    CHECK (
      repeat_weekdays IS NULL OR 
      (array_length(repeat_weekdays, 1) > 0 AND 
       NOT EXISTS (SELECT 1 FROM unnest(repeat_weekdays) AS day WHERE day < 1 OR day > 7))
    );

-- ==========================================
-- 阶段4: 创建索引
-- ==========================================

-- 基础查询索引
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_creator_couple ON tasks(creator_id, couple_id);
CREATE INDEX idx_tasks_couple_status ON tasks(couple_id, status);

-- 重复频率索引
CREATE INDEX idx_tasks_repeat_frequency ON tasks(repeat_frequency);

-- 时间相关索引
CREATE INDEX idx_tasks_time_range ON tasks(earliest_start_time, task_deadline) 
  WHERE repeat_frequency != 'never';

CREATE INDEX idx_tasks_deadline ON tasks(task_deadline) 
  WHERE task_deadline IS NOT NULL;

-- 完成进度索引
CREATE INDEX idx_tasks_completion_progress ON tasks(completed_count, required_count) 
  WHERE repeat_frequency != 'forever';

-- 永远重复任务索引
CREATE INDEX idx_tasks_forever_active ON tasks(assignee_id, status) 
  WHERE repeat_frequency = 'forever' AND status IN ('assigned', 'in_progress');

-- 创建时间索引
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- ==========================================
-- 阶段5: 创建辅助函数
-- ==========================================

-- 计算理论完成时间
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

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- ==========================================
-- 阶段6: 创建视图
-- ==========================================

-- 任务详情视图
CREATE VIEW task_details AS
SELECT 
  t.*,
  get_task_type(t.repeat_frequency) as task_type_category,
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

-- 今日可完成任务视图
CREATE VIEW today_tasks AS
SELECT 
  td.*
FROM task_details td
WHERE td.assignee_id IS NOT NULL 
  AND td.status IN ('assigned', 'in_progress')
  AND td.can_complete_today = TRUE;

-- ==========================================
-- 阶段7: 插入模拟数据
-- ==========================================

-- 首先需要获取现有的用户和情侣ID
-- 假设我们有两个用户和一个情侣关系

DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  couple_id UUID;
  task_id UUID;
BEGIN
  -- 获取现有用户ID（假设已存在）
  SELECT id INTO user1_id FROM auth.users LIMIT 1;
  SELECT id INTO user2_id FROM auth.users OFFSET 1 LIMIT 1;
  
  -- 获取情侣关系ID
  SELECT id INTO couple_id FROM couples LIMIT 1;
  
  -- 如果没有找到用户或情侣关系，创建模拟数据
  IF user1_id IS NULL OR user2_id IS NULL OR couple_id IS NULL THEN
    RAISE NOTICE '⚠️  未找到现有用户或情侣关系，请先创建用户数据';
    RETURN;
  END IF;
  
  RAISE NOTICE '📝 开始插入模拟任务数据...';
  RAISE NOTICE '   用户1 ID: %', user1_id;
  RAISE NOTICE '   用户2 ID: %', user2_id;
  RAISE NOTICE '   情侣 ID: %', couple_id;
  
  -- 🎯 插入一次性任务示例
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, status, assignee_id
  ) VALUES 
  -- 一次性任务1：修理水龙头
  (
    '修理厨房水龙头', 
    '水龙头滴水需要更换垫圈', 
    50, 
    user1_id, 
    couple_id, 
    'daily', 
    'never',
    NOW() - INTERVAL '1 day',
    1,
    NOW() + INTERVAL '7 days',
    'assigned',
    user2_id
  ),
  -- 一次性任务2：购买生日礼物
  (
    '为对方准备生日礼物', 
    '下个月生日，需要提前准备一份特别的礼物', 
    100, 
    user2_id, 
    couple_id, 
    'special', 
    'never',
    NOW(),
    1,
    NOW() + INTERVAL '30 days',
    'recruiting',
    NULL
  ),
  -- 一次性任务3：已完成的任务
  (
    '整理书房', 
    '把书房的书籍重新整理分类', 
    30, 
    user1_id, 
    couple_id, 
    'daily', 
    'never',
    NOW() - INTERVAL '5 days',
    1,
    NOW() - INTERVAL '1 day',
    'completed',
    user2_id
  );
  
  -- 🎯 插入有限重复任务示例
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    status, assignee_id, completed_count, current_streak, completion_record
  ) VALUES 
  -- 21天早起挑战（固定时间）
  (
    '21天早起挑战', 
    '每天早上6:30前起床并拍照打卡', 
    10, 
    user1_id, 
    couple_id, 
    'habit', 
    'daily',
    NOW() - INTERVAL '5 days',
    21,
    NOW() + INTERVAL '16 days',  -- 总共21天
    '06:00'::TIME,
    '06:30'::TIME,
    'in_progress',
    user2_id,
    5,  -- 已完成5天
    3,  -- 当前连续3天
    '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": false, "2024-01-04": true, "2024-01-05": true}'::JSONB
  ),
  -- 一个月内健身10次（灵活时间）
  (
    '一个月内健身10次', 
    '可以选择任意时间，但一个月内必须完成10次健身', 
    15, 
    user2_id, 
    couple_id, 
    'habit', 
    'daily',
    NOW() - INTERVAL '10 days',
    10,
    NOW() + INTERVAL '20 days',  -- 30天内完成10次
    NULL,
    NULL,
    'in_progress',
    user1_id,
    3,  -- 已完成3次
    1,  -- 当前连续1次
    '{"2024-01-01": true, "2024-01-05": true, "2024-01-08": true}'::JSONB
  ),
  -- 每周读书3次，持续4周
  (
    '每周读书3次，持续4周', 
    '培养阅读习惯，每周至少读书3次', 
    8, 
    user1_id, 
    couple_id, 
    'habit', 
    'weekly',
    NOW() - INTERVAL '1 week',
    12,  -- 4周 × 3次 = 12次
    NOW() + INTERVAL '3 weeks',
    '19:00'::TIME,
    '21:00'::TIME,
    'assigned',
    user2_id,
    0,
    0,
    '{}'::JSONB
  );
  
  -- 🎯 插入永远重复任务示例
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    repeat_weekdays, status, assignee_id, completed_count, current_streak, longest_streak,
    completion_record
  ) VALUES 
  -- 每日洗碗
  (
    '每日洗碗', 
    '晚饭后负责洗碗和清理厨房', 
    5, 
    user1_id, 
    couple_id, 
    'daily', 
    'forever',
    NOW() - INTERVAL '30 days',
    NULL,  -- 永远重复任务没有完成次数限制
    NULL,  -- 永远重复任务没有截止时间
    '19:00'::TIME,
    '21:00'::TIME,
    NULL,
    'in_progress',
    user2_id,
    25,  -- 已完成25次
    7,   -- 当前连续7天
    15,  -- 历史最长连续15天
    '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": true, "2024-01-04": true, "2024-01-05": true, "2024-01-06": true, "2024-01-07": true}'::JSONB
  ),
  -- 每周一三五跑步
  (
    '每周一三五跑步', 
    '保持身体健康，每周固定三天跑步', 
    10, 
    user2_id, 
    couple_id, 
    'habit', 
    'forever',
    NOW() - INTERVAL '14 days',
    NULL,
    NULL,
    '18:00'::TIME,
    '20:00'::TIME,
    ARRAY[1, 3, 5],  -- 周一、三、五
    'assigned',
    user1_id,
    6,   -- 已完成6次
    2,   -- 当前连续2次
    4,   -- 历史最长连续4次
    '{"2024-01-01": true, "2024-01-03": true, "2024-01-05": true, "2024-01-08": true, "2024-01-10": true, "2024-01-12": true}'::JSONB
  ),
  -- 每日互道晚安
  (
    '每日互道晚安', 
    '睡前互相说晚安，增进感情', 
    2, 
    user1_id, 
    couple_id, 
    'special', 
    'forever',
    NOW() - INTERVAL '60 days',
    NULL,
    NULL,
    '21:00'::TIME,
    '23:59'::TIME,
    NULL,
    'in_progress',
    user2_id,
    50,  -- 已完成50次
    10,  -- 当前连续10天
    30,  -- 历史最长连续30天
    '{}'::JSONB  -- 简化，不列出所有日期
  );
  
  RAISE NOTICE '✅ 模拟数据插入完成！';
  
END $$;

-- ==========================================
-- 阶段8: 数据验证
-- ==========================================

DO $$
DECLARE
  total_tasks INTEGER;
  once_tasks INTEGER;
  limited_repeat_tasks INTEGER;
  forever_tasks INTEGER;
  assigned_tasks INTEGER;
  in_progress_tasks INTEGER;
BEGIN
  -- 统计任务数量
  SELECT COUNT(*) INTO total_tasks FROM tasks;
  SELECT COUNT(*) INTO once_tasks FROM tasks WHERE repeat_frequency = 'never';
  SELECT COUNT(*) INTO limited_repeat_tasks FROM tasks WHERE repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly');
  SELECT COUNT(*) INTO forever_tasks FROM tasks WHERE repeat_frequency = 'forever';
  SELECT COUNT(*) INTO assigned_tasks FROM tasks WHERE status = 'assigned';
  SELECT COUNT(*) INTO in_progress_tasks FROM tasks WHERE status = 'in_progress';
  
  RAISE NOTICE '📊 数据库重建完成统计：';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '   总任务数: %', total_tasks;
  RAISE NOTICE '   一次性任务: %', once_tasks;
  RAISE NOTICE '   有限重复任务: %', limited_repeat_tasks;
  RAISE NOTICE '   永远重复任务: %', forever_tasks;
  RAISE NOTICE '   已分配任务: %', assigned_tasks;
  RAISE NOTICE '   进行中任务: %', in_progress_tasks;
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ 数据库清理和重建成功完成！';
  RAISE NOTICE '🎯 新的task表已创建，包含优化的单表结构';
  RAISE NOTICE '📝 已插入多种类型的模拟任务数据';
  RAISE NOTICE '🔧 所有约束、索引、函数和视图已创建';
END $$;
