-- 修复版数据迁移脚本：处理数据类型转换问题
-- 从旧表结构迁移到新表结构，处理跨天事件、时区统一、重复事件规则转换

-- 0. 检查旧表结构和数据类型
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1. 备份现有数据
DROP TABLE IF EXISTS events_backup;
CREATE TABLE events_backup AS SELECT * FROM events;

-- 2. 检查现有数据中的excluded_dates格式
SELECT 
    '排除日期格式检查' as check_type,
    COUNT(*) as total_events,
    COUNT(excluded_dates) as has_excluded_dates,
    COUNT(CASE WHEN array_length(excluded_dates, 1) > 0 THEN 1 END) as non_empty_excluded
FROM events;

-- 查看excluded_dates的示例数据
SELECT 
    id, title, excluded_dates,
    array_length(excluded_dates, 1) as array_length
FROM events 
WHERE excluded_dates IS NOT NULL 
  AND array_length(excluded_dates, 1) > 0
LIMIT 5;

-- 3. 安全的数据迁移逻辑
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
    
    -- 🎯 时间字段转换（更安全的处理）
    CASE 
        WHEN start_time IS NOT NULL THEN 
            -- 组合日期和时间，转换为UTC时间戳
            timezone('UTC', event_date + start_time)
        ELSE 
            -- 全天事件：从日期开始
            timezone('UTC', event_date::timestamp)
    END as start_datetime,
    
    CASE 
        WHEN end_time IS NOT NULL THEN
            -- 处理跨天情况：如果结束时间小于开始时间，说明跨天了
            CASE 
                WHEN start_time IS NOT NULL AND end_time < start_time THEN
                    -- 跨天：结束时间在第二天
                    timezone('UTC', (event_date + INTERVAL '1 day')::date + end_time)
                ELSE
                    -- 同一天：正常处理
                    timezone('UTC', event_date + end_time)
            END
        WHEN start_time IS NOT NULL THEN
            -- 有开始时间但没结束时间：默认1小时
            timezone('UTC', event_date + start_time + INTERVAL '1 hour')
        ELSE 
            -- 全天事件：到第二天开始
            timezone('UTC', (event_date + INTERVAL '1 day')::timestamp)
    END as end_datetime,
    
    -- 📅 派生字段（触发器会重新计算，这里给合理初值）
    event_date,
    
    -- 计算持续时间（分钟）
    COALESCE(
        CASE 
            WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
                EXTRACT(EPOCH FROM (
                    CASE 
                        WHEN end_time < start_time THEN
                            -- 跨天情况
                            (end_time + INTERVAL '1 day' - start_time)
                        ELSE
                            -- 同一天
                            (end_time - start_time)
                    END
                )) / 60
            WHEN start_time IS NOT NULL AND end_time IS NULL THEN
                60  -- 默认1小时
            ELSE 
                1440  -- 全天24小时
        END, 
        1440
    )::integer as duration_minutes,
    
    -- 跨天判断
    CASE 
        WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
            end_time < start_time
        ELSE 
            false
    END as is_multi_day,
    
    COALESCE(is_all_day, false) as is_all_day,
    
    -- 🔄 重复事件转换
    COALESCE(is_recurring, false) as is_recurring,
    
    -- 重复规则转换（更完整的处理）
    CASE 
        WHEN COALESCE(is_recurring, false) = true AND recurrence_type IS NOT NULL THEN
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
    
    recurrence_end as recurrence_end_date,
    
    -- 👥 用户字段
    created_by, 
    COALESCE(includes_user1, false) as includes_user1, 
    COALESCE(includes_user2, false) as includes_user2,
    
    -- 🕒 时间戳
    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at, 
    COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at,
    
    -- 🚫 例外处理（安全的类型转换）
    CASE 
        WHEN excluded_dates IS NOT NULL AND array_length(excluded_dates, 1) > 0 THEN
            -- 尝试将text[]转换为date[]
            (
                SELECT ARRAY(
                    SELECT 
                        CASE 
                            WHEN date_text ~ '^\d{4}-\d{2}-\d{2}$' THEN 
                                date_text::date
                            ELSE NULL
                        END
                    FROM unnest(excluded_dates) AS date_text
                    WHERE date_text ~ '^\d{4}-\d{2}-\d{2}$'
                )
            )
        ELSE 
            '{}'::date[]  -- 空数组
    END as excluded_dates,
    
    -- modified_instances保持jsonb格式
    COALESCE(modified_instances, '{}'::jsonb) as modified_instances
    
FROM events
WHERE 1=1;  -- 迁移所有数据

-- 4. 详细的数据验证
SELECT 
    '🔍 迁移结果总览' as check_type,
    COUNT(*) as 总事件数,
    COUNT(CASE WHEN is_multi_day THEN 1 END) as 跨天事件数,
    COUNT(CASE WHEN is_recurring THEN 1 END) as 重复事件数,
    COUNT(CASE WHEN duration_minutes > 1440 THEN 1 END) as 超过24小时事件数,
    COUNT(CASE WHEN is_all_day THEN 1 END) as 全天事件数,
    AVG(duration_minutes)::integer as 平均持续时间分钟
FROM events_new;

-- 5. 数据质量检查
SELECT 
    '⚠️ 数据质量问题' as check_type,
    COUNT(CASE WHEN start_datetime >= end_datetime THEN 1 END) as 时间顺序错误,
    COUNT(CASE WHEN duration_minutes < 0 THEN 1 END) as 负持续时间,
    COUNT(CASE WHEN is_all_day AND duration_minutes < 1440 THEN 1 END) as 全天事件时间异常,
    COUNT(CASE WHEN event_date != start_datetime::date THEN 1 END) as 日期不一致
FROM events_new;

-- 6. 问题数据详情（如果有的话）
SELECT 
    '🚨 问题数据详情' as check_type,
    id, title, event_date, 
    start_datetime, end_datetime, 
    is_multi_day, duration_minutes,
    '原因: ' || 
    CASE 
        WHEN start_datetime >= end_datetime THEN '结束时间早于开始时间'
        WHEN duration_minutes < 0 THEN '负持续时间'
        WHEN is_all_day AND duration_minutes < 1440 THEN '全天事件少于24小时'
        WHEN event_date != start_datetime::date THEN '日期字段不一致'
        ELSE '未知问题'
    END as 问题原因
FROM events_new 
WHERE start_datetime >= end_datetime
   OR duration_minutes < 0
   OR (is_all_day AND duration_minutes < 1440)
   OR event_date != start_datetime::date
LIMIT 10;

-- 7. 跨天事件详细验证
SELECT 
    '🌅 跨天事件详情' as check_type,
    id, title, 
    start_datetime::date as 开始日期,
    start_datetime::time as 开始时间,
    end_datetime::date as 结束日期,
    end_datetime::time as 结束时间,
    is_multi_day as 标记为跨天,
    duration_minutes as 持续分钟,
    ROUND(duration_minutes / 60.0, 1) as 持续小时
FROM events_new 
WHERE is_multi_day = true
ORDER BY start_datetime
LIMIT 10;

-- 8. 重复事件规则验证
SELECT 
    '🔄 重复事件详情' as check_type,
    id, title, 
    is_recurring,
    recurrence_rule,
    recurrence_end_date,
    start_datetime,
    end_datetime
FROM events_new 
WHERE is_recurring = true
ORDER BY start_datetime
LIMIT 10;

-- 9. excluded_dates转换验证
SELECT 
    '📅 排除日期转换验证' as check_type,
    COUNT(CASE WHEN excluded_dates IS NOT NULL AND array_length(excluded_dates, 1) > 0 THEN 1 END) as 有排除日期的事件,
    MAX(array_length(excluded_dates, 1)) as 最多排除日期数
FROM events_new;

-- 显示一些转换后的排除日期示例
SELECT 
    '📅 排除日期示例' as check_type,
    id, title, excluded_dates, array_length(excluded_dates, 1) as 排除数量
FROM events_new 
WHERE excluded_dates IS NOT NULL 
  AND array_length(excluded_dates, 1) > 0
LIMIT 5;

-- 10. 创建兼容视图（用于现有代码）
CREATE OR REPLACE VIEW events_legacy_view AS
SELECT 
    id, couple_id, title, description, location,
    start_datetime::date as event_date,
    start_datetime::time as start_time,
    CASE 
        WHEN is_multi_day THEN 
            end_datetime::time  -- 跨天事件显示原始结束时间
        ELSE 
            end_datetime::time
    END as end_time,
    is_all_day, is_recurring,
    recurrence_rule->>'freq' as recurrence_type,
    recurrence_end_date as recurrence_end,
    start_datetime::date as original_date,  -- 兼容字段
    created_by, includes_user1, includes_user2,
    created_at, updated_at,
    -- 将date[]转回text[]以保持兼容
    ARRAY(SELECT excluded_date::text FROM unnest(excluded_dates) AS excluded_date) as excluded_dates,
    modified_instances
FROM events_new;

-- 11. 完整性检查
SELECT 
    '✅ 迁移完整性检查' as check_type,
    (SELECT COUNT(*) FROM events) as 原表数据量,
    (SELECT COUNT(*) FROM events_new) as 新表数据量,
    CASE 
        WHEN (SELECT COUNT(*) FROM events) = (SELECT COUNT(*) FROM events_new) THEN
            '✅ 数据量一致'
        ELSE 
            '❌ 数据量不一致，请检查'
    END as 数据量检查;

-- 添加注释
COMMENT ON TABLE events_new IS '新的事件表：支持跨天事件、完整时区信息、RFC 5545重复规则';
COMMENT ON VIEW events_legacy_view IS '兼容视图：为现有代码提供向后兼容性';

-- 12. 下一步操作建议
SELECT 
    '📋 下一步操作建议' as info,
    '1. 检查上面的验证结果，确保没有数据质量问题' as 步骤1,
    '2. 更新应用代码以使用新的时间字段结构' as 步骤2,
    '3. 测试新的跨天事件和重复事件功能' as 步骤3,
    '4. 确认无误后执行：ALTER TABLE events RENAME TO events_old; ALTER TABLE events_new RENAME TO events;' as 步骤4;
