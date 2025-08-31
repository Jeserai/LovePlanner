-- 🔧 快速修复数据脚本
-- 确保有正确的用户关系和任务数据

-- ==========================================
-- 步骤1: 检查当前状态
-- ==========================================

DO $$
DECLARE
  user1_exists BOOLEAN;
  user2_exists BOOLEAN;
  couple_exists BOOLEAN;
  tasks_count INTEGER;
BEGIN
  -- 检查用户是否存在于user_profiles表
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = '6ec5465b-05c7-4f1e-8efd-ed487d785364') INTO user1_exists;
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2') INTO user2_exists;
  
  -- 检查情侣关系
  SELECT EXISTS(
    SELECT 1 FROM couples 
    WHERE is_active = true 
    AND (
      (user1_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364' AND user2_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2') OR
      (user1_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2' AND user2_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364')
    )
  ) INTO couple_exists;
  
  -- 检查任务数量
  SELECT COUNT(*) FROM tasks INTO tasks_count;
  
  RAISE NOTICE '🔍 当前状态检查:';
  RAISE NOTICE '   用户1存在: %', user1_exists;
  RAISE NOTICE '   用户2存在: %', user2_exists;
  RAISE NOTICE '   情侣关系存在: %', couple_exists;
  RAISE NOTICE '   任务数量: %', tasks_count;
END $$;

-- ==========================================
-- 步骤2: 创建用户资料（如果不存在）
-- ==========================================

-- 插入用户1资料
INSERT INTO user_profiles (
  id, email, username, display_name, points, timezone, is_active
) VALUES (
  '6ec5465b-05c7-4f1e-8efd-ed487d785364',
  'user1@example.com',
  'user1',
  '用户1',
  0,
  'Asia/Shanghai',
  true
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = true;

-- 插入用户2资料
INSERT INTO user_profiles (
  id, email, username, display_name, points, timezone, is_active
) VALUES (
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2',
  'user2@example.com',
  'user2',
  '用户2',
  0,
  'Asia/Shanghai',
  true
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = true;

-- ==========================================
-- 步骤3: 创建情侣关系
-- ==========================================

INSERT INTO couples (user1_id, user2_id, is_active)
VALUES (
  '6ec5465b-05c7-4f1e-8efd-ed487d785364',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2',
  true
) ON CONFLICT DO NOTHING;

-- ==========================================
-- 步骤4: 获取情侣ID并重新创建任务
-- ==========================================

DO $$
DECLARE
  couple_id_var UUID;
  user1_id UUID := '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID;
  user2_id UUID := 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID;
BEGIN
  -- 获取情侣ID
  SELECT id INTO couple_id_var 
  FROM couples 
  WHERE is_active = true
    AND (
      (user1_id = user1_id AND user2_id = user2_id) OR
      (user1_id = user2_id AND user2_id = user1_id)
    )
  LIMIT 1;
  
  IF couple_id_var IS NULL THEN
    RAISE EXCEPTION '未找到情侣关系';
  END IF;
  
  RAISE NOTICE '✅ 找到情侣关系ID: %', couple_id_var;
  
  -- 清除现有任务（可选）
  -- DELETE FROM tasks WHERE couple_id = couple_id_var;
  
  -- 重新插入任务数据
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, status, assignee_id
  ) VALUES 
  -- 一次性任务
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
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 有限重复任务
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
    5,
    3,
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
    3,
    1,
    '{"2024-01-01": true, "2024-01-05": true, "2024-01-08": true}'::JSONB
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 永远重复任务
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
    NULL,
    NULL,
    '19:00'::TIME,
    '21:00'::TIME,
    NULL,
    'in_progress',
    user2_id,
    25,
    7,
    15,
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
    ARRAY[1, 3, 5],
    'assigned',
    user1_id,
    6,
    2,
    4,
    '{"2024-01-01": true, "2024-01-03": true, "2024-01-05": true, "2024-01-08": true, "2024-01-10": true, "2024-01-12": true}'::JSONB
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ 任务数据插入完成';
END $$;

-- ==========================================
-- 步骤5: 验证结果
-- ==========================================

-- 显示最终状态
SELECT 
  'couples' as table_name,
  COUNT(*) as count
FROM couples
WHERE is_active = true

UNION ALL

SELECT 
  'tasks' as table_name,
  COUNT(*) as count
FROM tasks

UNION ALL

SELECT 
  'user_profiles' as table_name,
  COUNT(*) as count
FROM user_profiles;

-- 显示任务分布
SELECT 
  repeat_frequency,
  status,
  COUNT(*) as count
FROM tasks
GROUP BY repeat_frequency, status
ORDER BY repeat_frequency, status;

RAISE NOTICE '🎉 快速修复完成！现在应该可以看到任务数据了。';
