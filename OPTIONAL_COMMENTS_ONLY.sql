-- 可选：仅添加时区说明注释（不改变数据结构）
-- 这些注释纯粹是为了文档目的，不执行也不影响功能

-- 为events表添加时区说明注释
COMMENT ON COLUMN events.start_time IS 'UTC时间，格式HH:MM:SS';
COMMENT ON COLUMN events.end_time IS 'UTC时间，格式HH:MM:SS';
COMMENT ON TABLE events IS '所有时间字段统一存储UTC时间，前端根据用户时区转换显示';

-- 为tasks表添加时区说明注释  
COMMENT ON COLUMN tasks.earliest_start_time IS 'UTC时间戳，ISO 8601格式';
COMMENT ON COLUMN tasks.task_deadline IS 'UTC时间戳，ISO 8601格式';
COMMENT ON COLUMN tasks.daily_time_start IS 'UTC时间，格式HH:MM:SS';
COMMENT ON COLUMN tasks.daily_time_end IS 'UTC时间，格式HH:MM:SS';
COMMENT ON TABLE tasks IS '所有时间字段统一存储UTC时间，前端根据用户时区转换显示';
