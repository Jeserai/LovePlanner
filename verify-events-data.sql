-- 验证插入的事件数据

-- 1. 检查事件总数
SELECT 
    '📊 事件统计' as 类型,
    COUNT(*) as 总数
FROM events;

-- 2. 按参与者类型统计
SELECT 
    '👥 参与者统计' as 类型,
    COUNT(CASE WHEN includes_user1 AND includes_user2 THEN 1 END) as 共同事件,
    COUNT(CASE WHEN includes_user1 AND NOT includes_user2 THEN 1 END) as 用户1事件,
    COUNT(CASE WHEN includes_user2 AND NOT includes_user1 THEN 1 END) as 用户2事件
FROM events;

-- 3. 按特性统计
SELECT 
    '🔧 事件特性' as 类型,
    COUNT(CASE WHEN is_recurring THEN 1 END) as 重复事件,
    COUNT(CASE WHEN is_all_day THEN 1 END) as 全天事件,
    COUNT(CASE WHEN start_time IS NOT NULL THEN 1 END) as 定时事件
FROM events;

-- 4. 查看所有事件列表
SELECT 
    title as 标题,
    event_date as 日期,
    start_time as 开始时间,
    CASE 
        WHEN includes_user1 AND includes_user2 THEN '👫 共同'
        WHEN includes_user1 THEN '👤 用户1'
        WHEN includes_user2 THEN '👤 用户2'
        ELSE '❓ 未知'
    END as 参与者,
    CASE WHEN is_recurring THEN '🔄 重复' ELSE '📍 单次' END as 类型,
    location as 地点
FROM events 
ORDER BY event_date, start_time;

-- 5. 按日期分组显示
SELECT 
    event_date as 日期,
    COUNT(*) as 事件数量,
    STRING_AGG(title, ', ') as 事件列表
FROM events 
GROUP BY event_date 
ORDER BY event_date;
