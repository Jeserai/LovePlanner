-- 简化的数据迁移脚本：将现有事件转换为新的布尔字段格式
-- 这个脚本会将'cat'/'cow'参与者转换为includes_user1/includes_user2布尔字段

DO $$
DECLARE
    couple_record RECORD;
    event_record RECORD;
    cat_user_id UUID;
    cow_user_id UUID;
    includes_user1 BOOLEAN;
    includes_user2 BOOLEAN;
    migration_count INTEGER := 0;
BEGIN
    RAISE NOTICE '开始迁移现有事件到简化格式...';
    
    -- 检查是否有旧的events表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        RAISE NOTICE '发现现有events表，开始迁移...';
        
        -- 创建备份表
        EXECUTE 'CREATE TABLE events_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS') || ' AS SELECT * FROM events';
        RAISE NOTICE '已创建备份表';
        
        -- 遍历所有活跃的情侣关系
        FOR couple_record IN 
            SELECT id, user1_id, user2_id FROM couples WHERE is_active = true
        LOOP
            RAISE NOTICE '处理情侣关系: %', couple_record.id;
            
            -- 确定哪个用户是cat，哪个是cow
            SELECT 
                CASE 
                    WHEN u1.display_name ILIKE '%cat%' OR u1.email ILIKE '%cat%' THEN couple_record.user1_id
                    WHEN u2.display_name ILIKE '%cat%' OR u2.email ILIKE '%cat%' THEN couple_record.user2_id
                    ELSE couple_record.user1_id -- 默认user1为cat
                END,
                CASE 
                    WHEN u1.display_name ILIKE '%cow%' OR u1.email ILIKE '%cow%' THEN couple_record.user1_id
                    WHEN u2.display_name ILIKE '%cow%' OR u2.email ILIKE '%cow%' THEN couple_record.user2_id
                    ELSE couple_record.user2_id -- 默认user2为cow
                END
            INTO cat_user_id, cow_user_id
            FROM user_profiles u1, user_profiles u2
            WHERE u1.id = couple_record.user1_id AND u2.id = couple_record.user2_id;
            
            RAISE NOTICE 'Cat用户ID: %, Cow用户ID: %', cat_user_id, cow_user_id;
            
            -- 迁移该情侣的事件
            FOR event_record IN 
                SELECT * FROM events 
                WHERE couple_id = couple_record.id
            LOOP
                -- 解析参与者并设置布尔值
                includes_user1 := false;
                includes_user2 := false;
                
                -- 检查participants字段（根据实际数据结构调整）
                IF event_record.participants IS NOT NULL THEN
                    -- 如果participants包含'cat'
                    IF event_record.participants::text ILIKE '%cat%' THEN
                        -- 确定cat对应的是user1还是user2
                        IF cat_user_id = couple_record.user1_id THEN
                            includes_user1 := true;
                        ELSE
                            includes_user2 := true;
                        END IF;
                    END IF;
                    
                    -- 如果participants包含'cow'
                    IF event_record.participants::text ILIKE '%cow%' THEN
                        -- 确定cow对应的是user1还是user2
                        IF cow_user_id = couple_record.user1_id THEN
                            includes_user1 := true;
                        ELSE
                            includes_user2 := true;
                        END IF;
                    END IF;
                END IF;
                
                -- 如果没有找到参与者，默认为创建者
                IF NOT includes_user1 AND NOT includes_user2 THEN
                    IF COALESCE(event_record.created_by, couple_record.user1_id) = couple_record.user1_id THEN
                        includes_user1 := true;
                    ELSE
                        includes_user2 := true;
                    END IF;
                END IF;
                
                -- 使用简化的事件创建函数
                PERFORM create_simple_event(
                    couple_record.id,
                    event_record.title,
                    event_record.event_date,
                    COALESCE(event_record.created_by, couple_record.user1_id),
                    includes_user1,
                    includes_user2,
                    event_record.start_time,
                    event_record.end_time,
                    event_record.description,
                    COALESCE(event_record.is_all_day, false),
                    event_record.location,
                    COALESCE(event_record.is_recurring, false),
                    event_record.recurrence_type,
                    event_record.recurrence_end
                );
                
                migration_count := migration_count + 1;
                
                IF migration_count % 10 = 0 THEN
                    RAISE NOTICE '已迁移 % 个事件...', migration_count;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE '事件迁移完成，共迁移 % 个事件', migration_count;
    ELSE
        RAISE NOTICE '未发现现有events表，跳过迁移';
    END IF;
END $$;

-- 验证迁移结果
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_events,
    SUM(CASE WHEN includes_user1 AND includes_user2 THEN 1 ELSE 0 END) as shared_events,
    SUM(CASE WHEN includes_user1 AND NOT includes_user2 THEN 1 ELSE 0 END) as user1_events,
    SUM(CASE WHEN includes_user2 AND NOT includes_user1 THEN 1 ELSE 0 END) as user2_events
FROM events;

-- 查看迁移后的事件详情示例
SELECT 
    title,
    event_date,
    event_type,
    includes_user1,
    includes_user2,
    creator_name
FROM events_with_details
ORDER BY event_date
LIMIT 10;
