-- 添加 excluded_dates 字段到 events 表
-- 用于存储被排除的重复事件日期

ALTER TABLE events 
ADD COLUMN excluded_dates TEXT[] DEFAULT '{}';

-- 添加注释说明字段用途
COMMENT ON COLUMN events.excluded_dates IS '被排除的重复事件日期列表，格式为 YYYY-MM-DD';

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'excluded_dates';
