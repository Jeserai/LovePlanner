-- 检查用户在couples表中的位置
SELECT 
  c.id as couple_id,
  c.user1_id,
  c.user2_id,
  u1.display_name as user1_name,
  u1.email as user1_email,
  u2.display_name as user2_name,
  u2.email as user2_email
FROM couples c
LEFT JOIN user_profiles u1 ON c.user1_id = u1.id
LEFT JOIN user_profiles u2 ON c.user2_id = u2.id
WHERE c.is_active = true;

-- 检查cat用户的具体信息
SELECT 
  id,
  username,
  display_name,
  email,
  created_at
FROM user_profiles 
WHERE email LIKE '%cat%' OR display_name LIKE '%Cat%' OR username LIKE '%cat%';

-- 检查cow用户的具体信息
SELECT 
  id,
  username,
  display_name,
  email,
  created_at
FROM user_profiles 
WHERE email LIKE '%cow%' OR display_name LIKE '%Cow%' OR username LIKE '%cow%';
