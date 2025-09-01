-- 🚀 快速测试数据生成脚本 (最终修复版)
-- 修复了 PostgreSQL 数组格式问题和 NOT NULL 约束问题

-- 📊 生成测试数据 (使用随机UUID)
INSERT INTO tasks (
    id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, repeat_weekdays,
    daily_time_start, daily_time_end, status, assignee_id,
    completed_count, current_streak, longest_streak, completion_record,
    requires_proof, created_at, updated_at
) VALUES 

-- 🏠 1. 招募中的日常任务 (空记录用 '[]')
(gen_random_uuid(), '每日洗碗', '饭后及时清洗餐具，保持厨房整洁', 10, 
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1), 
 'daily', 'daily', NULL, 7, '2025-01-15 23:59:59+00', NULL, '18:00', '22:00', 'recruiting', NULL,
 0, 0, 0, '[]', false, NOW(), NOW()),

-- 🏃 2. 已领取的健身任务 (空记录用 '[]')
(gen_random_uuid(), '每日健身', '每天至少运动30分钟', 15,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', '2025-01-01 06:00:00+00', 21, '2025-01-31 23:59:59+00', NULL, '06:00', '08:00', 'assigned', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 0, 0, 0, '[]', true, NOW(), NOW()),

-- 📚 3. 进行中的阅读任务（有打卡记录）
(gen_random_uuid(), '每日阅读', '每天阅读至少30分钟', 12,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 14, NULL, NULL, NULL, NULL, 'in_progress', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 5, 3, 5, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-05", "2025-01-06"]', false, NOW(), NOW()),

-- 💧 4. 已完成的喝水任务
(gen_random_uuid(), '每日喝水', '每天喝足8杯水', 8,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 7, NULL, NULL, NULL, NULL, 'completed', 
 (SELECT id FROM user_profiles LIMIT 1),
 7, 7, 7, '["2024-12-25", "2024-12-26", "2024-12-27", "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31"]', false, NOW(), NOW()),

-- 🧹 5. 每周大扫除 (修复：使用 ARRAY[1] 而不是 '[1]')
(gen_random_uuid(), '每周大扫除', '每周进行一次全屋大扫除', 25,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'weekly', NULL, 4, '2025-02-28 23:59:59+00', ARRAY[1], NULL, NULL, 'assigned', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 2, 2, 2, '["2025-W01", "2025-W02"]', true, NOW(), NOW()),

-- 💰 6. 每月理财规划
(gen_random_uuid(), '每月理财规划', '每月制定和回顾理财计划', 30,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'monthly', NULL, 3, NULL, NULL, NULL, NULL, 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 1, 1, 1, '["2024-12"]', false, NOW(), NOW()),

-- 💕 7. 双周约会 (空记录用 '[]')
(gen_random_uuid(), '双周约会', '每两周安排一次浪漫约会', 50,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'biweekly', NULL, 6, NULL, NULL, NULL, NULL, 'recruiting', NULL,
 0, 0, 0, '[]', true, NOW(), NOW()),

-- 🎁 8. 生日惊喜准备 (空记录用 '[]')
(gen_random_uuid(), '准备生日惊喜', '为对方准备一个难忘的生日惊喜', 100,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'special', 'never', '2025-01-10 00:00:00+00', NULL, '2025-01-20 23:59:59+00', NULL, NULL, NULL, 'assigned', 
 (SELECT id FROM user_profiles LIMIT 1),
 0, 0, 0, '[]', true, NOW(), NOW()),

-- 🎯 9. 学习新技能
(gen_random_uuid(), '学习新技能', '学会一项新的生活技能', 80,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'special', 'never', NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 1, 1, 1, '["2025-01-05"]', false, NOW(), NOW()),

-- 🏡 10. 装饰新家（已完成）
(gen_random_uuid(), '装饰新家', '一起装饰我们的新家', 150,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'special', 'never', NULL, NULL, NULL, NULL, NULL, NULL, 'completed', 
 (SELECT id FROM user_profiles LIMIT 1),
 1, 1, 1, '["2024-12-20"]', true, NOW(), NOW()),

-- ❤️ 11. 每日说我爱你 (Forever任务)
(gen_random_uuid(), '每日说我爱你', '每天对彼此说"我爱你"', 5,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'daily', NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 15, 5, 10, '["2024-12-20", "2024-12-21", "2024-12-22", "2024-12-23", "2024-12-24", "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31", "2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06"]', false, NOW(), NOW()),

-- 🌙 12. 每周约会夜 (Forever任务) - 修复：使用 ARRAY[5] 而不是 '[5]'
(gen_random_uuid(), '每周约会夜', '每周至少一次约会夜', 20,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'weekly', NULL, NULL, NULL, ARRAY[5], '19:00', '23:00', 'assigned', 
 (SELECT id FROM user_profiles LIMIT 1),
 0, 0, 0, '[]', false, NOW(), NOW()),

-- 🧘 13. 已放弃的冥想任务
(gen_random_uuid(), '每日冥想', '每天冥想15分钟', 10,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 10, '2025-01-31 23:59:59+00', NULL, '06:00', '07:00', 'abandoned', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 3, 0, 3, '["2024-12-28", "2024-12-29", "2024-12-30"]', false, NOW(), NOW()),

-- 📖 14. 已完成的整理任务 (改为completed状态)
(gen_random_uuid(), '整理书房', '把书房的书籍重新整理分类', 30,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'special', 'never', NULL, NULL, '2025-01-15 23:59:59+00', NULL, NULL, NULL, 'completed', 
 (SELECT id FROM user_profiles LIMIT 1),
 1, 1, 1, '["2025-01-06"]', true, NOW(), NOW()),

-- 🍳 15. 工作日早餐 - 修复：使用 ARRAY[1,2,3,4,5] 而不是 '[1,2,3,4,5]'
(gen_random_uuid(), '工作日早餐', '工作日为对方准备营养早餐', 15,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 5, NULL, ARRAY[1,2,3,4,5], '06:30', '08:30', 'assigned', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 0, 0, 0, '[]', true, NOW(), NOW()),

-- 🏃‍♂️ 16. 30天挑战
(gen_random_uuid(), '30天挑战', '连续30天早起锻炼', 50,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'habit', 'daily', '2025-01-01 05:30:00+00', 30, '2025-02-15 23:59:59+00', NULL, '05:30', '06:30', 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 18, 8, 12, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10", "2025-01-11", "2025-01-12", "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18", "2025-01-19", "2025-01-20"]', true, NOW(), NOW()),

-- 🎊 17. 即将过期的新年准备 (空记录用 '[]')
(gen_random_uuid(), '新年准备', '准备新年庆祝活动', 60,
 (SELECT id FROM user_profiles LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'special', 'never', NULL, NULL, '2025-01-10 23:59:59+00', NULL, NULL, NULL, 'assigned', 
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
 0, 0, 0, '[]', false, NOW(), NOW()),

-- 🌙 18. 睡前聊天
(gen_random_uuid(), '睡前聊天', '每晚睡前聊天15分钟', 8,
 (SELECT id FROM user_profiles OFFSET 1 LIMIT 1), 
 (SELECT id FROM couples LIMIT 1),
 'daily', 'daily', NULL, 14, NULL, NULL, '21:30', '23:00', 'in_progress', 
 (SELECT id FROM user_profiles LIMIT 1),
 7, 4, 7, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-06", "2025-01-07", "2025-01-08"]', false, NOW(), NOW());

-- 📊 显示生成结果
SELECT 
    '🎉 测试数据生成完成！' as message,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_type = 'daily' THEN 1 END) as daily_tasks,
    COUNT(CASE WHEN task_type = 'habit' THEN 1 END) as habit_tasks,
    COUNT(CASE WHEN task_type = 'special' THEN 1 END) as special_tasks,
    COUNT(CASE WHEN status = 'recruiting' THEN 1 END) as recruiting,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned
FROM tasks;

-- 📋 显示数组字段的任务
SELECT 
    '📋 包含工作日限制的任务' as info,
    title,
    repeat_weekdays,
    CASE 
        WHEN repeat_weekdays = ARRAY[1] THEN '仅周一'
        WHEN repeat_weekdays = ARRAY[5] THEN '仅周五'
        WHEN repeat_weekdays = ARRAY[1,2,3,4,5] THEN '工作日'
        WHEN repeat_weekdays IS NULL THEN '无限制'
        ELSE '其他限制'
    END as weekday_description
FROM tasks 
WHERE repeat_weekdays IS NOT NULL
ORDER BY title;

-- 🔍 验证 completion_record 字段
SELECT 
    '🔍 completion_record 字段验证' as info,
    title,
    completion_record,
    CASE 
        WHEN completion_record = '[]' THEN '空记录(正确)'
        WHEN completion_record IS NULL THEN 'NULL(错误)'
        WHEN jsonb_array_length(completion_record::jsonb) > 0 THEN FORMAT('有%s条记录', jsonb_array_length(completion_record::jsonb))
        ELSE '未知格式'
    END as record_status
FROM tasks 
ORDER BY 
    CASE WHEN completion_record IS NULL THEN 1 ELSE 0 END,
    title;
