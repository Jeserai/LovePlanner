-- 🕐 解决时间限制的测试方案
-- 方便测试重复打卡任务的各种方法

-- 📊 方案1: 创建历史时间的测试任务
-- 这些任务的时间设置在过去，可以立即测试

-- 1.1 每日任务 - 设置在昨天开始，今天可以打卡
INSERT INTO tasks (
    id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, status, assignee_id,
    completed_count, current_streak, longest_streak, completion_record,
    requires_proof, created_at, updated_at
) VALUES 
(gen_random_uuid(), '测试每日打卡', '用于测试每日打卡功能', 10,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', 
 CURRENT_DATE - INTERVAL '1 day', -- 昨天开始
 7, 
 CURRENT_DATE + INTERVAL '10 days', -- 10天后截止
 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 3, 2, 3, 
 -- 前天、昨天、前天的记录，今天可以继续打卡
 FORMAT('["%s", "%s", "%s"]', 
        TO_CHAR(CURRENT_DATE - INTERVAL '3 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD')
 )::jsonb,
 false, NOW(), NOW()),

-- 1.2 每周任务 - 设置为本周可以打卡
(gen_random_uuid(), '测试每周打卡', '用于测试每周打卡功能', 20,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'weekly', 
 CURRENT_DATE - INTERVAL '7 days', -- 一周前开始
 4, NULL, 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 2, 2, 2,
 -- 前两周的记录，本周可以继续
 '["2025-W01", "2025-W02"]'::jsonb,
 false, NOW(), NOW()),

-- 1.3 即将完成的任务 - 只差1次就完成
(gen_random_uuid(), '即将完成任务', '测试任务完成逻辑', 30,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 3, NULL, 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 2, 2, 2,
 FORMAT('["%s", "%s"]', 
        TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD')
 )::jsonb,
 false, NOW(), NOW()),

-- 1.4 连续中断测试任务 - 有记录但不连续
(gen_random_uuid(), '连续中断测试', '测试连续次数重置', 15,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 10, NULL, 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 4, 1, 5, -- 当前连续1次，历史最高5次
 FORMAT('["%s", "%s", "%s", "%s"]', 
        TO_CHAR(CURRENT_DATE - INTERVAL '5 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '4 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '3 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD') -- 昨天，今天可以继续
 )::jsonb,
 false, NOW(), NOW()),

-- 1.5 Forever任务 - 可以无限打卡
(gen_random_uuid(), 'Forever测试任务', '测试无限重复任务', 5,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'daily', NULL, NULL, NULL, 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 10, 3, 8,
 FORMAT('["%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s"]', 
        TO_CHAR(CURRENT_DATE - INTERVAL '10 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '9 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '8 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '6 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '4 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '3 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'),
        TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') -- 包含今天，测试重复打卡防护
 )::jsonb,
 false, NOW(), NOW());

-- 📊 显示测试任务信息
SELECT 
    '🎯 时间测试任务生成完成' as message,
    title,
    status,
    repeat_frequency,
    required_count,
    completed_count,
    current_streak,
    CASE 
        WHEN completion_record IS NULL THEN '无记录'
        ELSE '有' || jsonb_array_length(completion_record) || '次记录'
    END as record_status,
    CASE 
        WHEN required_count IS NULL THEN 'Forever任务'
        WHEN completed_count >= required_count THEN '应该已完成'
        WHEN required_count - completed_count = 1 THEN '还差1次完成'
        ELSE '还差' || (required_count - completed_count) || '次完成'
    END as completion_status
FROM tasks 
WHERE title LIKE '%测试%' OR title LIKE '%Forever%'
ORDER BY created_at DESC;
