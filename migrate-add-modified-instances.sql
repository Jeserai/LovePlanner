-- 添加 modified_instances 字段到 events 表
-- 用于存储重复事件的单个实例修改

ALTER TABLE events 
ADD COLUMN modified_instances JSONB DEFAULT '{}';

-- 添加注释说明字段用途
COMMENT ON COLUMN events.modified_instances IS '重复事件的修改实例，键为日期(YYYY-MM-DD)，值为修改的字段';

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('excluded_dates', 'modified_instances');
