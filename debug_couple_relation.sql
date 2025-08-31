-- 🔍 调试情侣关系和任务数据

-- 1. 检查现有用户
SELECT 
  id,
  email,
  display_name,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 2. 检查用户资料
SELECT 
  id,
  email,
  display_name,
  created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查情侣关系
SELECT 
  id,
  user1_id,
  user2_id,
  is_active,
  created_at
FROM couples
WHERE is_active = true
ORDER BY created_at DESC;

-- 4. 检查任务数据
SELECT 
  id,
  title,
  creator_id,
  couple_id,
  repeat_frequency,
  status,
  created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- 5. 如果没有情侣关系，创建一个
-- 使用我们知道的用户ID
INSERT INTO couples (user1_id, user2_id, is_active)
VALUES (
  '6ec5465b-05c7-4f1e-8efd-ed487d785364',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2',
  true
)
ON CONFLICT DO NOTHING;

-- 6. 验证情侣关系创建
SELECT 
  id,
  user1_id,
  user2_id,
  is_active
FROM couples
WHERE user1_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364' 
   OR user2_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364'
   OR user1_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'
   OR user2_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2';
