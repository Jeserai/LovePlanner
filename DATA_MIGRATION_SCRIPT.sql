-- 数据迁移脚本：从旧表结构迁移到新表结构
-- 处理跨天事件、时区统一、重复事件规则转换

-- 1. 备份现有数据
CREATE TABLE events_backup AS SELECT * FROM events;

-- 2. 数据迁移逻辑
INSERT INTO events_new (
    id, couple_id, title, description, location,
    start_datetime, end_datetime, 
    event_date, duration_minutes, is_multi_day, is_all_day,
    is_recurring, recurrence_rule, recurrence_end_date,
    created_by, includes_user1, includes_user2,
    created_at, updated_at,
    excluded_dates, modified_instances
)
SELECT 
    id, couple_id, title, description, location,
    
    -- 🎯 时间字段转换
    CASE 
        WHEN start_time IS NOT NULL THEN 
            (event_date + start_time)::timestamptz
        ELSE 
            event_date::timestamptz
    END as start_datetime,
    
    CASE 
        WHEN end_time IS NOT NULL THEN
            -- 处理跨天情况：如果结束时间小于开始时间，说明跨天了
            CASE 
                WHEN end_time < start_time THEN
                    (event_date + INTERVAL '1 day' + end_time)::timestamptz
                ELSE
                    (event_date + end_time)::timestamptz
            END
        ELSE 
            -- 默认全天事件
            (event_date + INTERVAL '1 day')::timestamptz
    END as end_datetime,
    
    -- 📅 派生字段（触发器会自动计算，这里先给初值）
    event_date,
    COALESCE(
        EXTRACT(EPOCH FROM (
            CASE 
                WHEN end_time IS NOT NULL AND start_time IS NOT NULL THEN
                    CASE 
                        WHEN end_time < start_time THEN
                            (end_time + INTERVAL '1 day' - start_time)
                        ELSE
                            (end_time - start_time)
                    END
                ELSE INTERVAL '1 day'
            END
        )) / 60, 
        1440
    )::integer as duration_minutes,
    
    CASE 
        WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
            end_time < start_time  -- 跨天判断
        ELSE false
    END as is_multi_day,
    
    is_all_day,
    
    -- 🔄 重复事件转换
    is_recurring,
    CASE 
        WHEN is_recurring AND recurrence_type IS NOT NULL THEN
            jsonb_build_object(
                'freq', 
                CASE recurrence_type
                    WHEN 'daily' THEN 'daily'
                    WHEN 'weekly' THEN 'weekly' 
                    WHEN 'biweekly' THEN 'weekly'
                    WHEN 'monthly' THEN 'monthly'
                    WHEN 'yearly' THEN 'yearly'
                    ELSE 'weekly'
                END,
                'interval',
                CASE recurrence_type
                    WHEN 'biweekly' THEN 2
                    ELSE 1
                END
            )
        ELSE NULL
    END as recurrence_rule,
    
    recurrence_end,
    
    -- 👥 用户字段
    created_by, includes_user1, includes_user2,
    
    -- 🕒 时间戳
    created_at, updated_at,
    
    -- 🚫 例外处理（类型转换）
    CASE 
        WHEN excluded_dates IS NOT NULL THEN
            ARRAY(
                SELECT date_val::date 
                FROM unnest(excluded_dates) AS date_val
                WHERE date_val ~ '^\d{4}-\d{2}-\d{2}$'  -- 验证日期格式
            )
        ELSE NULL
    END as excluded_dates,
    modified_instances
    
FROM events
WHERE 1=1;  -- 迁移所有数据

-- 3. 数据验证
SELECT 
    '迁移结果验证' as check_type,
    COUNT(*) as 总数量,
    COUNT(CASE WHEN is_multi_day THEN 1 END) as 跨天事件数,
    COUNT(CASE WHEN is_recurring THEN 1 END) as 重复事件数,
    COUNT(CASE WHEN duration_minutes > 1440 THEN 1 END) as 超过24小时事件数
FROM events_new;

-- 4. 问题数据检查
SELECT 
    '数据质量检查' as check_type,
    id, title, event_date, start_datetime, end_datetime, is_multi_day
FROM events_new 
WHERE start_datetime >= end_datetime  -- 开始时间晚于结束时间
   OR duration_minutes < 0            -- 负持续时间
   OR (is_all_day AND duration_minutes < 1440)  -- 全天事件少于24小时
LIMIT 10;

-- 5. 跨天事件验证
SELECT 
    '跨天事件验证' as check_type,
    id, title, 
    start_datetime::date as start_date,
    end_datetime::date as end_date,
    is_multi_day,
    duration_minutes / 60.0 as duration_hours
FROM events_new 
WHERE is_multi_day = true
ORDER BY start_datetime
LIMIT 10;

-- 6. 重复事件验证
SELECT 
    '重复事件验证' as check_type,
    id, title, recurrence_rule, is_recurring
FROM events_new 
WHERE is_recurring = true
LIMIT 10;

-- 7. 创建视图用于兼容旧的查询
CREATE OR REPLACE VIEW events_legacy_view AS
SELECT 
    id, couple_id, title, description, 
    start_datetime::date as event_date,
    start_datetime::time as start_time,
    end_datetime::time as end_time,
    is_all_day, location, is_recurring,
    recurrence_rule->>'freq' as recurrence_type,
    recurrence_end_date as recurrence_end,
    start_datetime::date as original_date,  -- 兼容字段
    created_by, includes_user1, includes_user2,
    created_at, updated_at,
    excluded_dates, modified_instances
FROM events_new;

-- 8. 重命名表（谨慎操作，建议先测试）
-- ALTER TABLE events RENAME TO events_old;
-- ALTER TABLE events_new RENAME TO events;

COMMENT ON TABLE events_new IS '新的事件表：支持跨天事件、完整时区信息、RFC 5545重复规则';
COMMENT ON VIEW events_legacy_view IS '兼容视图：为了保持现有代码兼容性而创建的视图';
