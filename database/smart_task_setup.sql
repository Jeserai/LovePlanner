-- 🎯 智能任务表创建脚本
-- 自动获取真实的用户和情侣ID

-- ==========================================
-- 步骤1: 清理现有表
-- ==========================================

-- 备份现有数据（如果需要）
-- CREATE TABLE tasks_backup AS SELECT * FROM tasks;

-- 删除现有表
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
  creator_id UUID NOT NULL,
  couple_id UUID NOT NULL,
  
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
-- 步骤3: 添加约束
-- ==========================================

ALTER TABLE tasks 
  ADD CONSTRAINT check_once_task_count 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency != 'never')
    ),
  
  ADD CONSTRAINT check_forever_task_constraints 
    CHECK (
      (repeat_frequency = 'forever' AND required_count IS NULL AND task_deadline IS NULL) OR
      (repeat_frequency != 'forever')
    ),
  
  ADD CONSTRAINT check_completed_count_positive 
    CHECK (completed_count >= 0),
  
  ADD CONSTRAINT check_streak_positive 
    CHECK (current_streak >= 0 AND longest_streak >= 0);

-- ==========================================
-- 步骤4: 创建索引
-- ==========================================

CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_creator_couple ON tasks(creator_id, couple_id);
CREATE INDEX idx_tasks_repeat_frequency ON tasks(repeat_frequency);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- ==========================================
-- 步骤5: 智能插入模拟数据
-- ==========================================

DO $$
DECLARE
  user1_id UUID := '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID;
  user2_id UUID := 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID;
  couple_id_var UUID;
  task_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- 尝试获取真实的情侣ID
  SELECT id INTO couple_id_var 
  FROM couples 
  WHERE is_active = true
    AND (
      (user1_id = user1_id AND user2_id = user2_id) OR
      (user1_id = user2_id AND user2_id = user1_id)
    )
  LIMIT 1;
  
  -- 如果没找到，使用第一个活跃的情侣关系
  IF couple_id_var IS NULL THEN
    SELECT id INTO couple_id_var 
    FROM couples 
    WHERE is_active = true
    LIMIT 1;
  END IF;
  
  -- 如果还是没找到，创建一个模拟的情侣ID
  IF couple_id_var IS NULL THEN
    couple_id_var := '22222222-2222-2222-2222-222222222222'::UUID;
    RAISE NOTICE '⚠️  未找到真实的情侣关系，使用模拟ID: %', couple_id_var;
  ELSE
    RAISE NOTICE '✅ 找到真实的情侣关系ID: %', couple_id_var;
  END IF;
  
  RAISE NOTICE '📝 开始插入模拟任务数据...';
  RAISE NOTICE '   用户1 ID: %', user1_id;
  RAISE NOTICE '   用户2 ID: %', user2_id;
  RAISE NOTICE '   情侣 ID: %', couple_id_var;
  
  -- 🎯 插入一次性任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, status, assignee_id
  ) VALUES 
  (
    '修理厨房水龙头', 
    '水龙头滴水需要更换垫圈', 
    50, 
    user1_id, 
    couple_id_var, 
    'daily', 
    'never',
    NOW() - INTERVAL '1 day',
    1,
    NOW() + INTERVAL '7 days',
    'assigned',
    user2_id
  ),
  (
    '购买生日礼物', 
    '为对方准备一份特别的生日礼物', 
    100, 
    user2_id, 
    couple_id_var, 
    'special', 
    'never',
    NOW(),
    1,
    NOW() + INTERVAL '30 days',
    'recruiting',
    NULL
  ),
  (
    '整理书房', 
    '把书房的书籍重新整理分类', 
    30, 
    user1_id, 
    couple_id_var, 
    'daily', 
    'never',
    NOW() - INTERVAL '5 days',
    1,
    NOW() - INTERVAL '1 day',
    'completed',
    user2_id
  );
  
  task_count := task_count + 3;
  
  -- 🎯 插入有限重复任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    status, assignee_id, completed_count, current_streak, completion_record
  ) VALUES 
  (
    '21天早起挑战', 
    '每天早上6:30前起床并拍照打卡', 
    10, 
    user1_id, 
    couple_id_var, 
    'habit', 
    'daily',
    NOW() - INTERVAL '5 days',
    21,
    NOW() + INTERVAL '16 days',
    '06:00'::TIME,
    '06:30'::TIME,
    'in_progress',
    user2_id,
    5,  -- 已完成5天
    3,  -- 当前连续3天
    '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": false, "2024-01-04": true, "2024-01-05": true}'::JSONB
  ),
  (
    '一个月内健身10次', 
    '可以选择任意时间，但一个月内必须完成10次健身', 
    15, 
    user2_id, 
    couple_id_var, 
    'habit', 
    'daily',
    NOW() - INTERVAL '10 days',
    10,
    NOW() + INTERVAL '20 days',
    NULL,
    NULL,
    'in_progress',
    user1_id,
    3,  -- 已完成3次
    1,  -- 当前连续1次
    '{"2024-01-01": true, "2024-01-05": true, "2024-01-08": true}'::JSONB
  ),
  (
    '每周读书3次，持续4周', 
    '培养阅读习惯，每周至少读书3次', 
    8, 
    user1_id, 
    couple_id_var, 
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
  
  task_count := task_count + 3;
  
  -- 🎯 插入永远重复任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    repeat_weekdays, status, assignee_id, completed_count, current_streak, longest_streak,
    completion_record
  ) VALUES 
  (
    '每日洗碗', 
    '晚饭后负责洗碗和清理厨房', 
    5, 
    user1_id, 
    couple_id_var, 
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
  (
    '每周一三五跑步', 
    '保持身体健康，每周固定三天跑步', 
    10, 
    user2_id, 
    couple_id_var, 
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
  (
    '每日互道晚安', 
    '睡前互相说晚安，增进感情', 
    2, 
    user1_id, 
    couple_id_var, 
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
  
  task_count := task_count + 3;
  
  -- 统计和验证
  RAISE NOTICE '✅ 智能任务表创建完成！';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📊 总共插入了 % 个任务', task_count;
  RAISE NOTICE '   - 一次性任务: 3 个';
  RAISE NOTICE '   - 有限重复任务: 3 个';
  RAISE NOTICE '   - 永远重复任务: 3 个';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🎯 任务类型分布:';
  
  -- 显示任务分布统计
  FOR rec IN 
    SELECT 
      repeat_frequency,
      COUNT(*) as count,
      ROUND(AVG(completed_count), 1) as avg_completed
    FROM tasks 
    GROUP BY repeat_frequency
    ORDER BY repeat_frequency
  LOOP
    RAISE NOTICE '   % 任务: % 个 (平均完成: % 次)', rec.repeat_frequency, rec.count, rec.avg_completed;
  END LOOP;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🚀 数据库重建成功！可以开始测试新的任务系统了！';
  
END $$;

-- ==========================================
-- 验证数据
-- ==========================================

-- 显示插入的任务概览
SELECT 
  title,
  repeat_frequency,
  CASE 
    WHEN required_count IS NULL THEN '无限制'
    ELSE required_count::TEXT
  END as required_count,
  CASE 
    WHEN task_deadline IS NULL THEN '无截止'
    ELSE TO_CHAR(task_deadline, 'YYYY-MM-DD HH24:MI')
  END as deadline,
  status,
  completed_count
FROM tasks
ORDER BY 
  CASE repeat_frequency
    WHEN 'never' THEN 1
    WHEN 'daily' THEN 2
    WHEN 'weekly' THEN 3
    WHEN 'forever' THEN 4
    ELSE 5
  END,
  created_at;
