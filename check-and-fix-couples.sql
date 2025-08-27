-- 检查当前数据库状态并修复couples表

-- 1. 查看当前所有真实用户
SELECT 'Current users in user_profiles:' as info;
SELECT id, email, display_name, created_at 
FROM user_profiles 
ORDER BY created_at;

-- 2. 查看当前couples表数据
SELECT 'Current couples table data:' as info;
SELECT 
    id as couple_id,
    user1_id,
    user2_id,
    is_active,
    created_at,
    updated_at
FROM couples;

-- 3. 检查couples表中引用的用户是否存在
SELECT 'Checking if couple users exist:' as info;
SELECT 
    c.id as couple_id,
    c.user1_id,
    CASE WHEN up1.id IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND' END as user1_status,
    up1.display_name as user1_name,
    c.user2_id,
    CASE WHEN up2.id IS NOT NULL THEN 'EXISTS' ELSE 'NOT FOUND' END as user2_status,
    up2.display_name as user2_name
FROM couples c
LEFT JOIN user_profiles up1 ON c.user1_id = up1.id
LEFT JOIN user_profiles up2 ON c.user2_id = up2.id;

-- 4. 如果需要，创建缺失的用户或修复couples表
-- 方案A: 如果只有一个用户，创建第二个用户
DO $$
DECLARE
    user_count INTEGER;
    existing_user RECORD;
    new_user_id UUID;
    couple_id UUID;
BEGIN
    -- 检查用户数量
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    RAISE NOTICE '数据库中用户数量: %', user_count;
    
    IF user_count = 1 THEN
        -- 获取现有用户
        SELECT * INTO existing_user FROM user_profiles LIMIT 1;
        RAISE NOTICE '现有用户: % (% - %)', existing_user.display_name, existing_user.email, existing_user.id;
        
        -- 生成新用户ID
        new_user_id := gen_random_uuid();
        
        -- 根据现有用户创建伴侣
        IF existing_user.email = 'cat@loveplanner.com' THEN
            -- 现有是Cat，创建Cow
            INSERT INTO user_profiles (id, email, display_name, birthday, created_at, updated_at)
            VALUES (
                new_user_id,
                'cow@loveplanner.com', 
                'Whimsical Cow',
                '1990-02-01',
                NOW(),
                NOW()
            );
            RAISE NOTICE '✅ 创建了Cow用户: %', new_user_id;
            
            -- 更新couples表：Cat是user2, Cow是user1
            UPDATE couples 
            SET 
                user1_id = new_user_id,  -- Cow
                user2_id = existing_user.id,  -- Cat
                updated_at = NOW()
            WHERE is_active = true;
            
        ELSE
            -- 现有是Cow，创建Cat  
            INSERT INTO user_profiles (id, email, display_name, birthday, created_at, updated_at)
            VALUES (
                new_user_id,
                'cat@loveplanner.com',
                'Whimsical Cat', 
                '1990-01-01',
                NOW(),
                NOW()
            );
            RAISE NOTICE '✅ 创建了Cat用户: %', new_user_id;
            
            -- 更新couples表：Cat是user2, Cow是user1
            UPDATE couples 
            SET 
                user1_id = existing_user.id,  -- Cow
                user2_id = new_user_id,  -- Cat
                updated_at = NOW()
            WHERE is_active = true;
        END IF;
        
        RAISE NOTICE '✅ Couples表已更新';
        
    ELSIF user_count = 2 THEN
        -- 如果有两个用户，修复couples表引用
        DECLARE
            cat_user_id UUID;
            cow_user_id UUID;
        BEGIN
            -- 查找Cat和Cow的ID
            SELECT id INTO cat_user_id FROM user_profiles WHERE email = 'cat@loveplanner.com';
            SELECT id INTO cow_user_id FROM user_profiles WHERE email = 'cow@loveplanner.com';
            
            IF cat_user_id IS NOT NULL AND cow_user_id IS NOT NULL THEN
                -- 更新couples表：Cow是user1, Cat是user2
                UPDATE couples 
                SET 
                    user1_id = cow_user_id,  -- Cow
                    user2_id = cat_user_id,  -- Cat
                    updated_at = NOW()
                WHERE is_active = true;
                
                RAISE NOTICE '✅ 修复了couples表引用';
                RAISE NOTICE 'User1 (Cow): %', cow_user_id;
                RAISE NOTICE 'User2 (Cat): %', cat_user_id;
            END IF;
        END;
    END IF;
END $$;

-- 5. 验证修复结果
SELECT 'Final verification:' as info;
SELECT 
    c.id as couple_id,
    c.user1_id,
    up1.display_name as user1_name,
    up1.email as user1_email,
    c.user2_id, 
    up2.display_name as user2_name,
    up2.email as user2_email,
    c.is_active,
    c.updated_at
FROM couples c
LEFT JOIN user_profiles up1 ON c.user1_id = up1.id
LEFT JOIN user_profiles up2 ON c.user2_id = up2.id
WHERE c.is_active = true;
