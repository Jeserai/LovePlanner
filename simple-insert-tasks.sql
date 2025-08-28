-- 简化版本 - 直接插入测试数据，避免复杂的约束检查
-- 使用最基本和安全的方法

-- 1. 检查现有用户（简化版）
SELECT '=== 现有用户 ===' as info;
SELECT id, display_name FROM user_profiles ORDER BY created_at;

-- 2. 检查情侣关系
SELECT '=== 情侣关系 ===' as info;
SELECT id FROM couples LIMIT 1;

-- 3. 直接插入安全的测试数据
DO $$ 
DECLARE 
    user1_id UUID;
    user2_id UUID;
    couple_id UUID;
BEGIN
    -- 获取用户ID
    SELECT id INTO user1_id FROM user_profiles ORDER BY created_at LIMIT 1;
    SELECT id INTO user2_id FROM user_profiles ORDER BY created_at OFFSET 1 LIMIT 1;
    SELECT id INTO couple_id FROM couples LIMIT 1;
    
    -- 如果只有一个用户，使用同一个用户
    IF user2_id IS NULL THEN
        user2_id := user1_id;
    END IF;
    
    RAISE NOTICE 'Using User1: %, User2: %, Couple: %', user1_id, user2_id, couple_id;
    
    -- 清理现有测试数据
    DELETE FROM tasks WHERE title LIKE '%锻炼%' OR title LIKE '%阅读%' OR title LIKE '%晚餐%' OR title LIKE '%清洁%';
    
    -- 1. 一次性任务 - 简单模式
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof
    ) VALUES 
    (
        '买菜准备晚餐',
        '去超市购买今晚做饭需要的食材',
        NOW() + INTERVAL '2 days',
        15,
        'recruiting',
        user1_id,
        couple_id,
        'daily',
        'once',
        false
    ),
    (
        '整理书房',
        '清理书桌，整理书籍',
        NOW() + INTERVAL '3 days',
        25,
        'recruiting',
        user2_id,
        couple_id,
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
        '在家准备一顿浪漫的烛光晚餐',
        NOW() + INTERVAL '1 day' + INTERVAL '20 hours',
        50,
        'recruiting',
        user1_id,
        couple_id,
        'special',
        'once',
        true,
        NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
        NOW() + INTERVAL '1 day' + INTERVAL '20 hours'
    );
    
    -- 3. 重复任务 - 每日
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time
    ) VALUES 
    (
        '早晨锻炼',
        '每天早上进行30分钟的晨练',
        CURRENT_DATE + INTERVAL '21 days',
        20,
        'recruiting',
        user1_id,
        couple_id,
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
        '每天睡前阅读15-30分钟',
        CURRENT_DATE + INTERVAL '30 days',
        15,
        'recruiting',
        user2_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'daily',
        '21:30:00'
    );
    
    -- 4. 重复任务 - 每周
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
    ) VALUES 
    (
        '深度清洁厨房',
        '每周三次对厨房进行深度清洁',
        CURRENT_DATE + INTERVAL '30 days',
        35,
        'recruiting',
        user1_id,
        couple_id,
        'daily',
        'repeat',
        true,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'weekly',
        '10:00:00',
        ARRAY[1, 3, 5]
    ),
    (
        '制定周计划',
        '每周制定下一周的学习和工作计划',
        CURRENT_DATE + INTERVAL '60 days',
        25,
        'recruiting',
        user2_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '60 days',
        'weekly',
        '19:00:00',
        ARRAY[0]
    );
    
    -- 5. 重复任务 - 双周和每月
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time
    ) VALUES 
    (
        '约会计划',
        '每两周计划一次特别的约会活动',
        CURRENT_DATE + INTERVAL '3 months',
        60,
        'recruiting',
        user1_id,
        couple_id,
        'special',
        'repeat',
        true,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '3 months',
        'biweekly',
        '14:00:00'
    ),
    (
        '家庭财务回顾',
        '每月回顾和整理家庭财务状况',
        CURRENT_DATE + INTERVAL '6 months',
        40,
        'recruiting',
        user2_id,
        couple_id,
        'daily',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 months',
        'monthly'
    );
    
    -- 6. 已分配的任务
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, assignee_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
    ) VALUES 
    (
        '健身房锻炼',
        '每周三次去健身房进行力量训练',
        CURRENT_DATE + INTERVAL '21 days',
        30,
        'assigned',
        user1_id,
        user2_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '21 days',
        'weekly',
        '18:30:00',
        ARRAY[1, 3, 5]
    ),
    (
        '学习新技能',
        '每天花1小时学习编程',
        CURRENT_DATE + INTERVAL '30 days',
        25,
        'assigned',
        user2_id,
        user1_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'daily',
        '20:00:00',
        NULL
    );
    
    RAISE NOTICE 'All tasks inserted successfully!';
END $$;

-- 显示插入结果
SELECT 
    'Tasks created successfully!' as result,
    COUNT(*) as total_count
FROM tasks 
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- 显示任务详情
SELECT 
    title,
    status,
    repeat_type,
    CASE 
        WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN '时间范围'
        WHEN repeat_type = 'once' THEN '简单模式'
        ELSE CONCAT('重复-', repeat_frequency)
    END as type,
    points
FROM tasks 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at;
