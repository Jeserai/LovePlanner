-- 🎯 修复版简化任务表创建脚本
-- 使用真实用户ID，修复了语法错误

-- ==========================================
-- 步骤1: 清理现有表（谨慎操作）
-- ==========================================

-- 备份现有数据
-- CREATE TABLE tasks_backup AS SELECT * FROM tasks;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS tasks CASCADE;

-- ==========================================
-- 步骤2: 创建新的tasks表
-- ==========================================

CREATE TABLE tasks (
  -- 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  creator_id UUID NOT NULL,  -- 暂时不添加外键约束
  couple_id UUID NOT NULL,   -- 暂时不添加外键约束
  
  -- 任务分类
  task_type TEXT NOT NULL DEFAULT 'daily' CHECK (task_type IN ('daily', 'habit', 'special')),
  repeat_frequency TEXT NOT NULL DEFAULT 'never' CHECK (
    repeat_frequency IN ('never', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'forever')
  ),
  
  -- 核心时间配置
  earliest_start_time TIMESTAMPTZ,
  required_count INTEGER,
  task_deadline TIMESTAMPTZ,
  
  -- 重复细节配置
  repeat_weekdays INTEGER[],
  daily_time_start TIME,
  daily_time_end TIME,
  
  -- 任务状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned')
  ),
  assignee_id UUID,
  
  -- 完成跟踪
  completed_count INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  completion_record JSONB NOT NULL DEFAULT '{}',
  
  -- 其他字段
  requires_proof BOOLEAN NOT NULL DEFAULT FALSE,
  proof_url TEXT,
  review_comment TEXT,
  
  -- 系统字段
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ==========================================
-- 步骤3: 添加基本约束
-- ==========================================

ALTER TABLE tasks 
  -- 一次性任务约束
  ADD CONSTRAINT check_once_task_count 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency != 'never')
    ),
  
  -- 永远重复任务约束
  ADD CONSTRAINT check_forever_task_constraints 
    CHECK (
      (repeat_frequency = 'forever' AND required_count IS NULL AND task_deadline IS NULL) OR
      (repeat_frequency != 'forever')
    ),
  
  -- 完成次数约束
  ADD CONSTRAINT check_completed_count_positive 
    CHECK (completed_count >= 0),
  
  -- 连续次数约束
  ADD CONSTRAINT check_streak_positive 
    CHECK (current_streak >= 0 AND longest_streak >= 0);

-- ==========================================
-- 步骤4: 创建基本索引
-- ==========================================

CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_creator_couple ON tasks(creator_id, couple_id);
CREATE INDEX idx_tasks_repeat_frequency ON tasks(repeat_frequency);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- ==========================================
-- 步骤5: 插入模拟数据
-- ==========================================

-- 使用真实的用户UUID
INSERT INTO tasks (
  id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
  earliest_start_time, required_count, task_deadline, status, assignee_id
) VALUES 
-- 一次性任务示例
(
  gen_random_uuid(),
  '修理厨房水龙头', 
  '水龙头滴水需要更换垫圈', 
  50, 
  '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID,  -- 用户1
  '22222222-2222-2222-2222-222222222222'::UUID,  -- 模拟情侣ID
  'daily', 
  'never',
  NOW() - INTERVAL '1 day',
  1,
  NOW() + INTERVAL '7 days',
  'assigned',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID   -- 用户2
),
(
  gen_random_uuid(),
  '购买生日礼物', 
  '为对方准备一份特别的生日礼物', 
  100, 
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID,
  'special', 
  'never',
  NOW(),
  1,
  NOW() + INTERVAL '30 days',
  'recruiting',
  NULL
);

-- 有限重复任务示例
INSERT INTO tasks (
  id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
  earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
  status, assignee_id, completed_count, current_streak, completion_record
) VALUES 
(
  gen_random_uuid(),
  '21天早起挑战', 
  '每天早上6:30前起床并拍照打卡', 
  10, 
  '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID,
  'habit', 
  'daily',
  NOW() - INTERVAL '5 days',
  21,
  NOW() + INTERVAL '16 days',
  '06:00'::TIME,
  '06:30'::TIME,
  'in_progress',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID,
  5,  -- 已完成5天
  3,  -- 当前连续3天
  '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": false, "2024-01-04": true, "2024-01-05": true}'::JSONB
),
(
  gen_random_uuid(),
  '一个月内健身10次', 
  '可以选择任意时间，但一个月内必须完成10次健身', 
  15, 
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID,
  'habit', 
  'daily',
  NOW() - INTERVAL '10 days',
  10,
  NOW() + INTERVAL '20 days',
  NULL,
  NULL,
  'in_progress',
  '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID,
  3,  -- 已完成3次
  1,  -- 当前连续1次
  '{"2024-01-01": true, "2024-01-05": true, "2024-01-08": true}'::JSONB
);

-- 永远重复任务示例
INSERT INTO tasks (
  id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
  earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
  repeat_weekdays, status, assignee_id, completed_count, current_streak, longest_streak,
  completion_record
) VALUES 
(
  gen_random_uuid(),
  '每日洗碗', 
  '晚饭后负责洗碗和清理厨房', 
  5, 
  '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID,
  'daily', 
  'forever',
  NOW() - INTERVAL '30 days',
  NULL,  -- 永远重复任务没有完成次数限制
  NULL,  -- 永远重复任务没有截止时间
  '19:00'::TIME,
  '21:00'::TIME,
  NULL,
  'in_progress',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID,
  25,  -- 已完成25次
  7,   -- 当前连续7天
  15,  -- 历史最长连续15天
  '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": true, "2024-01-04": true, "2024-01-05": true, "2024-01-06": true, "2024-01-07": true}'::JSONB
),
(
  gen_random_uuid(),
  '每周一三五跑步', 
  '保持身体健康，每周固定三天跑步', 
  10, 
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID,
  'habit', 
  'forever',
  NOW() - INTERVAL '14 days',
  NULL,
  NULL,
  '18:00'::TIME,
  '20:00'::TIME,
  ARRAY[1, 3, 5],  -- 周一、三、五
  'assigned',
  '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID,
  6,   -- 已完成6次
  2,   -- 当前连续2次
  4,   -- 历史最长连续4次
  '{"2024-01-01": true, "2024-01-03": true, "2024-01-05": true, "2024-01-08": true, "2024-01-10": true, "2024-01-12": true}'::JSONB
);

-- ==========================================
-- 验证数据
-- ==========================================

-- 查看插入的数据
SELECT 
  title,
  repeat_frequency,
  required_count,
  task_deadline IS NOT NULL as has_deadline,
  status,
  completed_count
FROM tasks
ORDER BY created_at;

-- 统计信息
SELECT 
  repeat_frequency,
  COUNT(*) as count,
  AVG(completed_count) as avg_completed
FROM tasks 
GROUP BY repeat_frequency
ORDER BY repeat_frequency;

-- 显示完成信息
DO $$
DECLARE
  total_tasks INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks FROM tasks;
  
  RAISE NOTICE '✅ 修复版任务表创建完成！';
  RAISE NOTICE '📊 已插入 % 个模拟任务', total_tasks;
  RAISE NOTICE '🎯 包含一次性、有限重复、永远重复三种类型任务';
  RAISE NOTICE '📝 可以开始测试新的任务系统了！';
END $$;
