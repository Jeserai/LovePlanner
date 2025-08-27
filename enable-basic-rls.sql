-- 为Love Planner启用基本RLS策略（可选）

-- 1. 重新启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- 2. 创建简单的"允许所有已认证用户"策略
-- 这样既有RLS保护，又允许Cat和Cow访问所有数据

-- user_profiles表策略
CREATE POLICY "authenticated_users_all_access" ON user_profiles
FOR ALL USING (auth.role() = 'authenticated');

-- couples表策略  
CREATE POLICY "authenticated_couples_all_access" ON couples
FOR ALL USING (auth.role() = 'authenticated');

-- 3. 验证策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'couples');
