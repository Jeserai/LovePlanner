-- 简化版事件表设计
-- 移除复杂的参与状态机制，专为情侣日历优化

-- 删除现有的events表（注意：这会删除所有现有事件数据）
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;

-- 创建简化的events表
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,
    location VARCHAR(255),
    
    -- 重复相关字段
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    recurrence_end DATE,
    original_date DATE, -- 用于重复事件的原始日期
    
    -- 创建者
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    
    -- 简化的参与者字段（只需要知道谁参与，不需要状态）
    -- 使用简单的布尔字段表示情侣中的每个人是否参与
    includes_user1 BOOLEAN DEFAULT false,  -- 是否包含user1
    includes_user2 BOOLEAN DEFAULT false,  -- 是否包含user2
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 确保至少有一个参与者
    CONSTRAINT at_least_one_participant CHECK (includes_user1 = true OR includes_user2 = true),
    
    -- 重复事件验证
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false) OR 
        (is_recurring = true AND recurrence_type IS NOT NULL)
    )
);

-- 创建索引优化查询性能
CREATE INDEX idx_events_couple_id ON events(couple_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_user1_participation ON events(includes_user1) WHERE includes_user1 = true;
CREATE INDEX idx_events_user2_participation ON events(includes_user2) WHERE includes_user2 = true;

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- 创建简化的查询视图
CREATE OR REPLACE VIEW events_with_details AS
SELECT 
    e.id,
    e.couple_id,
    e.title,
    e.description,
    e.event_date,
    e.start_time,
    e.end_time,
    e.is_all_day,
    e.location,
    e.is_recurring,
    e.recurrence_type,
    e.recurrence_end,
    e.original_date,
    e.created_by,
    e.includes_user1,
    e.includes_user2,
    e.created_at,
    e.updated_at,
    -- 创建者信息
    creator.display_name as creator_name,
    creator.email as creator_email,
    -- 情侣信息
    c.user1_id,
    c.user2_id,
    u1.display_name as user1_name,
    u2.display_name as user2_name,
    -- 事件类型（个人/共同）
    CASE 
        WHEN e.includes_user1 AND e.includes_user2 THEN 'shared'
        WHEN e.includes_user1 THEN 'user1'
        WHEN e.includes_user2 THEN 'user2'
        ELSE 'unknown'
    END as event_type
FROM events e
LEFT JOIN user_profiles creator ON e.created_by = creator.id
LEFT JOIN couples c ON e.couple_id = c.id
LEFT JOIN user_profiles u1 ON c.user1_id = u1.id
LEFT JOIN user_profiles u2 ON c.user2_id = u2.id;

-- 简化的事件创建函数
CREATE OR REPLACE FUNCTION create_simple_event(
    p_couple_id UUID,
    p_title VARCHAR(255),
    p_event_date DATE,
    p_created_by UUID,
    p_includes_user1 BOOLEAN DEFAULT false,
    p_includes_user2 BOOLEAN DEFAULT false,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_is_all_day BOOLEAN DEFAULT false,
    p_location VARCHAR(255) DEFAULT NULL,
    p_is_recurring BOOLEAN DEFAULT false,
    p_recurrence_type VARCHAR(20) DEFAULT NULL,
    p_recurrence_end DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_event_id UUID;
BEGIN
    -- 验证至少有一个参与者
    IF NOT (p_includes_user1 OR p_includes_user2) THEN
        RAISE EXCEPTION '事件必须至少有一个参与者';
    END IF;
    
    -- 创建事件
    INSERT INTO events (
        couple_id, title, event_date, created_by, 
        includes_user1, includes_user2,
        start_time, end_time, description, is_all_day, location,
        is_recurring, recurrence_type, recurrence_end
    ) VALUES (
        p_couple_id, p_title, p_event_date, p_created_by,
        p_includes_user1, p_includes_user2,
        p_start_time, p_end_time, p_description, p_is_all_day, p_location,
        p_is_recurring, p_recurrence_type, p_recurrence_end
    ) RETURNING id INTO new_event_id;
    
    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- 便捷函数：获取用户的事件
CREATE OR REPLACE FUNCTION get_user_events_simple(
    p_user_id UUID,
    p_is_user1 BOOLEAN,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR(255),
    event_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN,
    event_type TEXT,
    creator_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.event_date,
        e.start_time,
        e.end_time,
        e.is_all_day,
        e.event_type,
        e.creator_name
    FROM events_with_details e
    WHERE e.couple_id IN (
        SELECT c.id FROM couples c 
        WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id) 
        AND c.is_active = true
    )
    AND (
        (p_is_user1 = true AND e.includes_user1 = true) OR
        (p_is_user1 = false AND e.includes_user2 = true)
    )
    AND (p_start_date IS NULL OR e.event_date >= p_start_date)
    AND (p_end_date IS NULL OR e.event_date <= p_end_date)
    ORDER BY e.event_date, e.start_time;
END;
$$ LANGUAGE plpgsql;

-- 便捷函数：获取情侣的所有事件
CREATE OR REPLACE FUNCTION get_couple_events_simple(
    p_couple_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR(255),
    event_date DATE,
    start_time TIME,
    event_type TEXT,
    includes_user1 BOOLEAN,
    includes_user2 BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.event_date,
        e.start_time,
        e.event_type,
        e.includes_user1,
        e.includes_user2
    FROM events_with_details e
    WHERE e.couple_id = p_couple_id
    AND (p_start_date IS NULL OR e.event_date >= p_start_date)
    AND (p_end_date IS NULL OR e.event_date <= p_end_date)
    ORDER BY e.event_date, e.start_time;
END;
$$ LANGUAGE plpgsql;

-- 示例：插入一些测试数据
-- 注意：需要替换为实际的用户ID
-- 
-- DO $$
-- DECLARE
--     couple_record RECORD;
--     couple_id UUID;
-- BEGIN
--     -- 获取第一个活跃的情侣关系
--     SELECT c.id INTO couple_id
--     FROM couples c WHERE c.is_active = true LIMIT 1;
--     
--     IF couple_id IS NOT NULL THEN
--         -- 创建共同事件（两人都参与）
--         PERFORM create_simple_event(
--             couple_id,
--             '约会晚餐',
--             CURRENT_DATE + INTERVAL '1 day',
--             (SELECT user1_id FROM couples WHERE id = couple_id),
--             true,  -- 包含user1
--             true,  -- 包含user2
--             '19:00'::TIME,
--             NULL,
--             '浪漫的晚餐约会'
--         );
--         
--         -- 创建个人事件（只有user1参与）
--         PERFORM create_simple_event(
--             couple_id,
--             '瑜伽练习',
--             CURRENT_DATE,
--             (SELECT user1_id FROM couples WHERE id = couple_id),
--             true,  -- 包含user1
--             false, -- 不包含user2
--             '08:00'::TIME,
--             NULL,
--             '晨间瑜伽'
--         );
--         
--         -- 创建个人事件（只有user2参与）
--         PERFORM create_simple_event(
--             couple_id,
--             '健身训练',
--             CURRENT_DATE,
--             (SELECT user2_id FROM couples WHERE id = couple_id),
--             false, -- 不包含user1
--             true,  -- 包含user2
--             '20:00'::TIME,
--             NULL,
--             '晚间健身'
--         );
--         
--         RAISE NOTICE '已创建简化的示例事件数据';
--     END IF;
-- END $$;
