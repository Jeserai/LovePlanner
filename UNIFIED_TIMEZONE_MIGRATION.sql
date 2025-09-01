-- 统一时区架构迁移脚本
-- 核心原则：数据库统一存储UTC时间，前端按用户时区渲染

-- 1. 不需要添加复杂的时区字段，保持表结构简单
-- 2. 确保所有时间字段都按UTC存储
-- 3. 添加注释说明时区策略

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

-- 检查当前数据的时区一致性
SELECT 
    'Events时间数据检查' as table_name,
    COUNT(*) as total_events,
    COUNT(start_time) as has_start_time,
    COUNT(end_time) as has_end_time
FROM events;

SELECT 
    'Tasks时间数据检查' as table_name,
    COUNT(*) as total_tasks,
    COUNT(earliest_start_time) as has_start_time,
    COUNT(task_deadline) as has_deadline
FROM tasks;
