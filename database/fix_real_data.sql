-- 🔧 修复真实用户数据脚本
-- 基于实际的用户ID和情侣ID

-- 使用实际的ID
-- 用户ID: f58b5791-c5f8-4d47-97eb-68f32d0e21f2
-- 情侣ID: 5dbf159b-41fa-4f0f-b72f-c209dcb35442

-- ==========================================
-- 步骤1: 检查当前任务状态
-- ==========================================

-- 查看现有任务
SELECT 
  id,
  title,
  creator_id,
  couple_id,
  repeat_frequency,
  status,
  created_at
FROM tasks
WHERE couple_id = '5dbf159b-41fa-4f0f-b72f-c209dcb35442'
ORDER BY created_at DESC;

-- 查看所有任务（不限情侣ID）
SELECT 
  id,
  title,
  creator_id,
  couple_id,
  repeat_frequency,
  status
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- 步骤2: 清理并重新插入任务数据
-- ==========================================

-- 清除现有任务（使用实际的情侣ID）
DELETE FROM tasks WHERE couple_id = '5dbf159b-41fa-4f0f-b72f-c209dcb35442';

-- 插入新的任务数据
DO $$
DECLARE
  user1_id UUID := '6ec5465b-05c7-4f1e-8efd-ed487d785364'::UUID;  -- 用户1
  user2_id UUID := 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'::UUID;  -- 用户2（当前登录用户）
  couple_id_var UUID := '5dbf159b-41fa-4f0f-b72f-c209dcb35442'::UUID;  -- 实际的情侣ID
BEGIN
  RAISE NOTICE '🎯 开始插入任务数据...';
  RAISE NOTICE '   用户1 ID: %', user1_id;
  RAISE NOTICE '   用户2 ID: %', user2_id;
  RAISE NOTICE '   情侣 ID: %', couple_id_var;
  
  -- 🎯 插入一次性任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, status, assignee_id
  ) VALUES 
  -- 用户2创建的任务（会在"我发布的"中显示）
  (
    '修理厨房水龙头', 
    '水龙头滴水需要更换垫圈', 
    50, 
    user2_id,  -- 用户2创建
    couple_id_var, 
    'daily', 
    'never',
    NOW() - INTERVAL '1 day',
    1,
    NOW() + INTERVAL '7 days',
    'assigned',
    user1_id   -- 分配给用户1
  ),
  (
    '购买生日礼物', 
    '为对方准备一份特别的生日礼物', 
    100, 
    user2_id,  -- 用户2创建
    couple_id_var, 
    'special', 
    'never',
    NOW(),
    1,
    NOW() + INTERVAL '30 days',
    'recruiting',
    NULL
  ),
  -- 用户1创建的任务（会在"可领取的"中显示）
  (
    '整理书房', 
    '把书房的书籍重新整理分类', 
    30, 
    user1_id,  -- 用户1创建
    couple_id_var, 
    'daily', 
    'never',
    NOW(),
    1,
    NOW() + INTERVAL '3 days',
    'recruiting',
    NULL
  );
  
  -- 🎯 插入有限重复任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    status, assignee_id, completed_count, current_streak, completion_record
  ) VALUES 
  -- 用户2创建的重复任务
  (
    '21天早起挑战', 
    '每天早上6:30前起床并拍照打卡', 
    10, 
    user2_id,  -- 用户2创建
    couple_id_var, 
    'habit', 
    'daily',
    NOW() - INTERVAL '5 days',
    21,
    NOW() + INTERVAL '16 days',
    '06:00'::TIME,
    '06:30'::TIME,
    'in_progress',
    user1_id,  -- 分配给用户1
    5,  -- 已完成5天
    3,  -- 当前连续3天
    '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": false, "2024-01-04": true, "2024-01-05": true}'::JSONB
  ),
  -- 用户1创建的重复任务
  (
    '一个月内健身10次', 
    '可以选择任意时间，但一个月内必须完成10次健身', 
    15, 
    user1_id,  -- 用户1创建
    couple_id_var, 
    'habit', 
    'daily',
    NOW() - INTERVAL '10 days',
    10,
    NOW() + INTERVAL '20 days',
    NULL,
    NULL,
    'assigned',
    user2_id,  -- 分配给用户2
    3,  -- 已完成3次
    1,  -- 当前连续1次
    '{"2024-01-01": true, "2024-01-05": true, "2024-01-08": true}'::JSONB
  );
  
  -- 🎯 插入永远重复任务
  INSERT INTO tasks (
    title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, daily_time_start, daily_time_end,
    repeat_weekdays, status, assignee_id, completed_count, current_streak, longest_streak,
    completion_record
  ) VALUES 
  -- 用户2创建的永远重复任务
  (
    '每日洗碗', 
    '晚饭后负责洗碗和清理厨房', 
    5, 
    user2_id,  -- 用户2创建
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
    user1_id,  -- 分配给用户1
    25,  -- 已完成25次
    7,   -- 当前连续7天
    15,  -- 历史最长连续15天
    '{"2024-01-01": true, "2024-01-02": true, "2024-01-03": true, "2024-01-04": true, "2024-01-05": true, "2024-01-06": true, "2024-01-07": true}'::JSONB
  ),
  -- 用户1创建的永远重复任务
  (
    '每周一三五跑步', 
    '保持身体健康，每周固定三天跑步', 
    10, 
    user1_id,  -- 用户1创建
    couple_id_var, 
    'habit', 
    'forever',
    NOW() - INTERVAL '14 days',
    NULL,
    NULL,
    '18:00'::TIME,
    '20:00'::TIME,
    ARRAY[1, 3, 5],  -- 周一、三、五
    'recruiting',
    NULL,  -- 招募中
    0,   -- 还没有人完成
    0,   -- 当前连续0次
    0,   -- 历史最长连续0次
    '{}'::JSONB
  );
  
  RAISE NOTICE '✅ 任务数据插入完成！';
END $$;

-- ==========================================
-- 步骤3: 验证插入结果
-- ==========================================

-- 按创建者分组查看任务
SELECT 
  creator_id,
  CASE 
    WHEN creator_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364' THEN '用户1创建'
    WHEN creator_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2' THEN '用户2创建(当前用户)'
    ELSE '其他用户'
  END as creator_name,
  COUNT(*) as task_count
FROM tasks
WHERE couple_id = '5dbf159b-41fa-4f0f-b72f-c209dcb35442'
GROUP BY creator_id
ORDER BY creator_id;

-- 查看所有任务详情
SELECT 
  title,
  CASE 
    WHEN creator_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2' THEN '我发布的'
    ELSE '对方发布的'
  END as view_category,
  repeat_frequency,
  status,
  CASE 
    WHEN assignee_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2' THEN '我领取的'
    WHEN assignee_id IS NULL THEN '可领取的'
    ELSE '对方领取的'
  END as assignment_status
FROM tasks
WHERE couple_id = '5dbf159b-41fa-4f0f-b72f-c209dcb35442'
ORDER BY created_at;

-- 最终状态报告
DO $$
BEGIN
  RAISE NOTICE '🎉 数据修复完成！';
  RAISE NOTICE '现在应该可以在TaskBoard中看到任务了：';
  RAISE NOTICE '- "我发布的"视图：应该显示4个任务';
  RAISE NOTICE '- "我领取的"视图：应该显示1个任务';
  RAISE NOTICE '- "可领取的"视图：应该显示2个任务';
  RAISE NOTICE '请刷新TaskBoard页面查看结果！';
END $$;
