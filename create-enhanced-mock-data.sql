-- 创建增强的模拟任务数据
-- 包含时间范围、重复任务等新功能的测试数据

-- 首先获取用户和情侣ID（假设已存在）
-- 这里使用变量，执行时需要替换为实际的ID

-- 删除现有的测试数据（可选）
-- DELETE FROM tasks WHERE title LIKE '%测试%' OR title LIKE '%Test%';

-- 1. 一次性任务 - 简单模式
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof
) VALUES 
(
    '买菜准备晚餐',
    '去超市购买今晚做饭需要的食材，包括蔬菜、肉类和调料',
    NOW() + INTERVAL '2 days',
    15,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'daily',
    'once',
    false
),
(
    '整理书房',
    '清理书桌，整理书籍，打扫房间卫生',
    NOW() + INTERVAL '3 days',
    25,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'daily',
    'once',
    true
);

-- 2. 一次性任务 - 时间范围模式
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof,
    task_start_time, task_end_time
) VALUES 
(
    '准备浪漫晚餐',
    '在家准备一顿浪漫的烛光晚餐，包括前菜、主菜和甜点',
    NOW() + INTERVAL '1 day' + INTERVAL '20 hours',
    50,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'special',
    'once',
    true,
    NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '20 hours'
),
(
    '陪伴看电影',
    '一起观看最新上映的电影，享受两人时光',
    NOW() + INTERVAL '2 days' + INTERVAL '22 hours',
    30,
    'assigned',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'special',
    'once',
    false,
    NOW() + INTERVAL '2 days' + INTERVAL '19 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '22 hours'
);

-- 3. 重复任务 - 每日
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof,
    start_date, end_date, repeat_frequency, repeat_time
) VALUES 
(
    '早晨锻炼',
    '每天早上进行30分钟的晨练，包括跑步、瑜伽或其他运动',
    CURRENT_DATE + INTERVAL '21 days',
    20,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '21 days',
    'daily',
    '07:00:00'
),
(
    '睡前阅读',
    '每天睡前阅读15-30分钟，培养良好的阅读习惯',
    CURRENT_DATE + INTERVAL '30 days',
    15,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'daily',
    '21:30:00'
);

-- 4. 重复任务 - 每周（指定星期）
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof,
    start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
) VALUES 
(
    '深度清洁厨房',
    '每周三次对厨房进行深度清洁，包括油烟机、炉灶和橱柜',
    CURRENT_DATE + INTERVAL '30 days',
    35,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'daily',
    'repeat',
    true,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'weekly',
    '10:00:00',
    ARRAY[1, 3, 5]  -- 周一、周三、周五
),
(
    '制定周计划',
    '每周制定下一周的学习和工作计划，包括目标设定和时间安排',
    CURRENT_DATE + INTERVAL '60 days',
    25,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    'weekly',
    '19:00:00',
    ARRAY[0]  -- 周日
);

-- 5. 重复任务 - 双周
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof,
    start_date, end_date, repeat_frequency, repeat_time
) VALUES 
(
    '约会计划',
    '每两周计划一次特别的约会活动，可以是看展览、郊游或尝试新餐厅',
    CURRENT_DATE + INTERVAL '3 months',
    60,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'special',
    'repeat',
    true,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 months',
    'biweekly',
    '14:00:00'
);

-- 6. 重复任务 - 每月
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, couple_id, 
    task_type, repeat_type, requires_proof,
    start_date, end_date, repeat_frequency
) VALUES 
(
    '家庭财务回顾',
    '每月回顾和整理家庭财务状况，包括收支分析和预算调整',
    CURRENT_DATE + INTERVAL '6 months',
    40,
    'recruiting',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'daily',
    'repeat',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    'monthly'
);

-- 7. 一些已分配和进行中的任务
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, assignee_id, couple_id, 
    task_type, repeat_type, requires_proof,
    start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
) VALUES 
(
    '健身房锻炼',
    '每周三次去健身房进行力量训练和有氧运动',
    CURRENT_DATE + INTERVAL '21 days',
    30,
    'in-progress',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '21 days',
    'weekly',
    '18:30:00',
    ARRAY[1, 3, 5]  -- 周一、周三、周五
),
(
    '学习新技能',
    '每天花1小时学习编程或其他技能',
    CURRENT_DATE + INTERVAL '30 days',
    25,
    'assigned',
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'daily',
    '20:00:00'
);

-- 8. 一些已完成的任务示例
INSERT INTO tasks (
    title, description, deadline, points, status, creator_id, assignee_id, couple_id, 
    task_type, repeat_type, requires_proof, completed_at,
    task_start_time, task_end_time
) VALUES 
(
    '周年纪念日庆祝',
    '准备周年纪念日的惊喜庆祝活动',
    NOW() - INTERVAL '2 days',
    100,
    'completed',
    (SELECT id FROM user_profiles WHERE display_name = 'cow' LIMIT 1),
    (SELECT id FROM user_profiles WHERE display_name = 'cat' LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'special',
    'once',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '18 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '22 hours'
);

-- 查看创建的数据
SELECT 
    title,
    repeat_type,
    CASE 
        WHEN repeat_type = 'once' THEN 
            CASE 
                WHEN task_start_time IS NOT NULL THEN '时间范围模式'
                ELSE '简单模式'
            END
        ELSE CONCAT('重复任务 - ', repeat_frequency)
    END as task_mode,
    status,
    points,
    CASE 
        WHEN repeat_type = 'once' THEN deadline::date::text
        ELSE CONCAT(start_date, ' - ', end_date)
    END as date_info,
    CASE 
        WHEN task_start_time IS NOT NULL THEN 
            CONCAT(task_start_time::time, COALESCE(' - ' || task_end_time::time, ''))
        WHEN repeat_time IS NOT NULL THEN repeat_time::text
        ELSE ''
    END as time_info,
    CASE 
        WHEN repeat_weekdays IS NOT NULL AND array_length(repeat_weekdays, 1) > 0 THEN 
            array_to_string(repeat_weekdays, ',')
        ELSE ''
    END as weekdays
FROM tasks 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
