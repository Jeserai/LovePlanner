-- 时区数据约定迁移脚本
-- 策略：保持表结构不变，但明确时区存储约定

-- 1. 添加注释明确时区约定
COMMENT ON COLUMN events.start_time IS 'UTC时间，格式HH:MM:SS。所有新数据按UTC存储，现有数据逐步转换。';
COMMENT ON COLUMN events.end_time IS 'UTC时间，格式HH:MM:SS。所有新数据按UTC存储，现有数据逐步转换。';
COMMENT ON TABLE events IS '时区策略：start_time和end_time统一按UTC时间存储，前端根据用户时区转换显示。';

-- 2. 检查现有数据，了解当前状况
SELECT 
    '事件时间数据统计' as info,
    COUNT(*) as 总事件数,
    COUNT(start_time) as 有开始时间,
    COUNT(end_time) as 有结束时间,
    COUNT(CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN 1 END) as 完整时间事件
FROM events;

-- 3. 查看一些示例数据（了解现有格式）
SELECT 
    id,
    title,
    event_date,
    start_time,
    end_time,
    created_at,
    includes_user1,
    includes_user2
FROM events 
WHERE start_time IS NOT NULL 
LIMIT 5;

-- 4. 检查是否有明显的时区问题（比如时间超出24小时）
SELECT 
    '数据质量检查' as info,
    COUNT(CASE WHEN start_time > '23:59:59' THEN 1 END) as 异常开始时间,
    COUNT(CASE WHEN end_time > '23:59:59' THEN 1 END) as 异常结束时间
FROM events;

-- 注意：这个脚本只是分析和添加注释，不会修改任何现有数据
