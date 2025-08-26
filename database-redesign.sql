-- ============================================================================
-- LovePlanner 数据库重新设计脚本
-- 彻底移除cat/cow概念，设计通用的情侣关系系统
-- ============================================================================

BEGIN;

-- 1. 重新设计couples表，移除cat/cow概念
DROP TABLE IF EXISTS public.couples_new;
CREATE TABLE public.couples_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    relationship_started DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- 确保两个用户不同，且组合唯一
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id != user2_id),
    -- 确保 user1_id < user2_id，避免重复关系 (A,B) 和 (B,A)
    CHECK (user1_id < user2_id)
);

-- 2. 迁移现有couples数据到新表
INSERT INTO public.couples_new (id, user1_id, user2_id, relationship_started, created_at, is_active)
SELECT 
    id,
    LEAST(cat_user_id, cow_user_id) as user1_id,  -- 较小的UUID作为user1
    GREATEST(cat_user_id, cow_user_id) as user2_id, -- 较大的UUID作为user2
    relationship_started,
    created_at,
    is_active
FROM public.couples
WHERE is_active = true;

-- 3. 替换couples表
DROP TABLE IF EXISTS public.couples;
ALTER TABLE public.couples_new RENAME TO couples;

-- 4. 重新创建索引
CREATE INDEX idx_couples_user1 ON public.couples(user1_id);
CREATE INDEX idx_couples_user2 ON public.couples(user2_id);
CREATE INDEX idx_couples_active ON public.couples(is_active);

-- 5. 创建情侣关系查询函数
CREATE OR REPLACE FUNCTION public.get_couple_relation(user_id UUID)
RETURNS TABLE(
    couple_id UUID,
    partner_id UUID,
    partner_username VARCHAR(50),
    partner_display_name VARCHAR(100),
    relationship_started DATE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        CASE 
            WHEN c.user1_id = user_id THEN c.user2_id
            ELSE c.user1_id
        END as partner_id,
        p.username,
        p.display_name,
        c.relationship_started,
        c.is_active
    FROM public.couples c
    JOIN public.user_profiles p ON (
        p.id = CASE 
            WHEN c.user1_id = user_id THEN c.user2_id
            ELSE c.user1_id
        END
    )
    WHERE (c.user1_id = user_id OR c.user2_id = user_id)
    AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建情侣用户查询函数
CREATE OR REPLACE FUNCTION public.get_couple_users(couple_id UUID)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    email VARCHAR(255),
    birthday DATE,
    avatar_url TEXT,
    points INTEGER,
    timezone VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.display_name,
        up.email,
        up.birthday,
        up.avatar_url,
        up.points,
        up.timezone
    FROM public.couples c
    JOIN public.user_profiles up ON (up.id = c.user1_id OR up.id = c.user2_id)
    WHERE c.id = couple_id
    AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 7. 更新tasks表相关逻辑（移除role依赖）
-- 如果tasks表有role相关字段，这里可以添加相应的更新逻辑

-- 8. 创建通用的用户配对视图
CREATE OR REPLACE VIEW public.couple_relationships AS
SELECT 
    c.id as couple_id,
    c.user1_id,
    u1.username as user1_username,
    u1.display_name as user1_display_name,
    u1.email as user1_email,
    c.user2_id,
    u2.username as user2_username,
    u2.display_name as user2_display_name,
    u2.email as user2_email,
    c.relationship_started,
    c.created_at,
    c.is_active
FROM public.couples c
JOIN public.user_profiles u1 ON c.user1_id = u1.id
JOIN public.user_profiles u2 ON c.user2_id = u2.id;

-- 9. 删除之前的get_user_type函数（不再需要）
DROP FUNCTION IF EXISTS public.get_user_type(public.user_profiles);

-- 10. 更新用户统计视图（移除用户类型概念）
DROP VIEW IF EXISTS public.user_stats_with_type;
CREATE VIEW public.user_statistics AS
SELECT 
    up.id as user_id,
    up.username,
    up.display_name,
    up.email,
    up.birthday,
    up.points,
    up.timezone,
    up.created_at,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'abandoned' THEN 1 END) as abandoned_tasks,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points END), 0) as total_points_earned,
    -- 情侣关系信息
    c.couple_id,
    c.partner_id,
    c.partner_username,
    c.partner_display_name
FROM public.user_profiles up
LEFT JOIN public.tasks t ON (up.id = t.assignee_id)
LEFT JOIN (
    SELECT 
        CASE WHEN c.user1_id = up.id THEN c.user1_id ELSE c.user2_id END as user_id,
        c.id as couple_id,
        CASE WHEN c.user1_id = up.id THEN c.user2_id ELSE c.user1_id END as partner_id,
        CASE WHEN c.user1_id = up.id THEN u2.username ELSE u1.username END as partner_username,
        CASE WHEN c.user1_id = up.id THEN u2.display_name ELSE u1.display_name END as partner_display_name
    FROM public.couples c
    JOIN public.user_profiles u1 ON c.user1_id = u1.id
    JOIN public.user_profiles u2 ON c.user2_id = u2.id
    JOIN public.user_profiles up ON (c.user1_id = up.id OR c.user2_id = up.id)
    WHERE c.is_active = true
) c ON c.user_id = up.id
GROUP BY up.id, up.username, up.display_name, up.email, up.birthday, up.points, 
         up.timezone, up.created_at, c.couple_id, c.partner_id, c.partner_username, c.partner_display_name;

-- 11. 更新触发器函数（移除role概念）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, username, display_name, birthday)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'birthday')::DATE, '1990-01-01')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 12. 创建情侣关系管理函数
CREATE OR REPLACE FUNCTION public.create_couple_relationship(
    user1_id UUID, 
    user2_id UUID
) RETURNS UUID AS $$
DECLARE
    couple_id UUID;
    smaller_id UUID;
    larger_id UUID;
BEGIN
    -- 确保user1_id < user2_id
    IF user1_id < user2_id THEN
        smaller_id := user1_id;
        larger_id := user2_id;
    ELSE
        smaller_id := user2_id;
        larger_id := user1_id;
    END IF;
    
    -- 检查是否已存在关系
    SELECT id INTO couple_id 
    FROM public.couples 
    WHERE user1_id = smaller_id AND user2_id = larger_id;
    
    IF couple_id IS NOT NULL THEN
        -- 如果关系存在但不活跃，重新激活
        UPDATE public.couples 
        SET is_active = true, updated_at = NOW()
        WHERE id = couple_id;
        RETURN couple_id;
    ELSE
        -- 创建新的情侣关系
        INSERT INTO public.couples (user1_id, user2_id)
        VALUES (smaller_id, larger_id)
        RETURNING id INTO couple_id;
        RETURN couple_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 13. 添加注释
COMMENT ON TABLE public.couples IS '情侣关系表，支持任意两个用户建立关系';
COMMENT ON COLUMN public.couples.user1_id IS '用户1 ID（较小的UUID）';
COMMENT ON COLUMN public.couples.user2_id IS '用户2 ID（较大的UUID）';
COMMENT ON FUNCTION public.get_couple_relation(UUID) IS '获取指定用户的情侣关系信息';
COMMENT ON FUNCTION public.get_couple_users(UUID) IS '获取指定情侣关系中的两个用户信息';
COMMENT ON FUNCTION public.create_couple_relationship(UUID, UUID) IS '创建或激活情侣关系';

COMMIT;

-- ============================================================================
-- 验证查询
-- ============================================================================

-- 查看新的couples表结构
\d public.couples

-- 查看情侣关系
SELECT * FROM public.couple_relationships;

-- 测试函数
SELECT * FROM public.get_couple_relation('cat-user-id-fixed');
SELECT * FROM public.get_couple_users((SELECT id FROM public.couples LIMIT 1));

-- ============================================================================
-- 示例：为当前的Cat和Cow用户创建关系
-- ============================================================================

-- 如果还没有关系，创建一个
DO $$
DECLARE
    cat_id UUID := 'cat-user-id-fixed';
    cow_id UUID := 'cow-user-id-fixed';
    couple_id UUID;
BEGIN
    SELECT public.create_couple_relationship(cat_id, cow_id) INTO couple_id;
    RAISE NOTICE '创建情侣关系，ID: %', couple_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '用户可能不存在，跳过关系创建';
END $$;
