-- 快速验证当前数据库状态

-- 1. 查看所有用户
SELECT 'All users in user_profiles:' as section;
SELECT 
    id, 
    email, 
    display_name, 
    created_at 
FROM user_profiles 
ORDER BY created_at;

-- 2. 查看couples表
SELECT 'Couples table data:' as section;
SELECT 
    id as couple_id,
    user1_id,
    user2_id,
    is_active,
    created_at,
    updated_at
FROM couples;

-- 3. 连接查询验证用户引用
SELECT 'Couples with user details:' as section;
SELECT 
    c.id as couple_id,
    c.user1_id,
    up1.display_name as user1_name,
    up1.email as user1_email,
    c.user2_id,
    up2.display_name as user2_name,
    up2.email as user2_email,
    c.is_active
FROM couples c
LEFT JOIN user_profiles up1 ON c.user1_id = up1.id
LEFT JOIN user_profiles up2 ON c.user2_id = up2.id;
