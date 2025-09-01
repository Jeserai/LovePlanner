-- 备选方案：改变表结构以支持完整时区信息
-- 警告：这会改变表结构，需要数据迁移

-- 方案1：添加新的timestamp字段
DO $$ 
BEGIN
    -- 检查是否已有新字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'start_datetime'
    ) THEN
        -- 添加新的时间戳字段
        ALTER TABLE events ADD COLUMN start_datetime timestamptz NULL;
        ALTER TABLE events ADD COLUMN end_datetime timestamptz NULL;
        
        -- 添加注释
        COMMENT ON COLUMN events.start_datetime IS '开始时间（含时区），UTC存储';
        COMMENT ON COLUMN events.end_datetime IS '结束时间（含时区），UTC存储';
    END IF;
END $$;

-- 数据迁移脚本（将现有time数据转换为timestamptz）
-- 注意：这假设现有数据是UTC时间
UPDATE events 
SET 
    start_datetime = (event_date + start_time)::timestamptz,
    end_datetime = (event_date + end_time)::timestamptz
WHERE start_time IS NOT NULL AND start_datetime IS NULL;

-- 方案2：修改现有字段为timestamptz（更激进的改动）
-- 警告：这会破坏现有应用的兼容性
/*
ALTER TABLE events 
    ALTER COLUMN start_time TYPE timestamptz USING (event_date + start_time)::timestamptz,
    ALTER COLUMN end_time TYPE timestamptz USING (event_date + end_time)::timestamptz;
*/

-- 检查迁移结果
SELECT 
    '迁移结果检查' as info,
    COUNT(*) as 总事件数,
    COUNT(start_datetime) as 新格式开始时间,
    COUNT(end_datetime) as 新格式结束时间,
    COUNT(start_time) as 旧格式开始时间,
    COUNT(end_time) as 旧格式结束时间
FROM events;
