-- 检查用户并插入任务数据
-- 先查看现有用户，然后插入数据

-- 1. 检查现有用户
SELECT 'Current users:' as info;
SELECT id, display_name, email FROM user_profiles ORDER BY display_name;

-- 2. 检查情侣关系
SELECT 'Current couples:' as info;
SELECT id, user1_id, user2_id FROM couples;

-- 3. 获取用户ID变量（使用实际存在的用户）
DO $$ 
DECLARE 
    user1_id UUID;
    user2_id UUID;
    couple_id UUID;
BEGIN
    -- 获取第一个用户ID
    SELECT id INTO user1_id FROM user_profiles ORDER BY created_at LIMIT 1;
    -- 获取第二个用户ID
    SELECT id INTO user2_id FROM user_profiles ORDER BY created_at OFFSET 1 LIMIT 1;
    -- 获取情侣ID
    SELECT id INTO couple_id FROM couples LIMIT 1;
    
    -- 如果只有一个用户，使用同一个用户
    IF user2_id IS NULL THEN
        user2_id := user1_id;
    END IF;
    
    RAISE NOTICE 'User1 ID: %', user1_id;
    RAISE NOTICE 'User2 ID: %', user2_id;
    RAISE NOTICE 'Couple ID: %', couple_id;
    
    -- 清理现有测试数据
    DELETE FROM tasks WHERE title IN (
        '买菜准备晚餐', '整理书房', '准备浪漫晚餐', '陪伴看电影', 
        '早晨锻炼', '睡前阅读', '深度清洁厨房', '制定周计划', 
        '约会计划', '家庭财务回顾', '健身房锻炼', '学习新技能'
    );
    
    -- 插入一次性任务 - 简单模式
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
        user1_id,
        couple_id,
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
        user2_id,
        couple_id,
        'daily',
        'once',
        true
    );
    
    -- 插入一次性任务 - 时间范围模式
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
        user1_id,
        couple_id,
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
        user2_id,
        couple_id,
        'special',
        'once',
        false,
        NOW() + INTERVAL '2 days' + INTERVAL '19 hours',
        NOW() + INTERVAL '2 days' + INTERVAL '22 hours'
    );
    
    -- 设置assignee_id for 陪伴看电影
    UPDATE tasks 
    SET assignee_id = user1_id
    WHERE title = '陪伴看电影';
    
    -- 插入重复任务 - 每日
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
        '每天睡前阅读15-30分钟，培养良好的阅读习惯',
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
    
    -- 插入重复任务 - 每周（指定星期）
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
        user1_id,
        couple_id,
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
        user2_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '60 days',
        'weekly',
        '19:00:00',
        ARRAY[0]  -- 周日
    );
    
    -- 插入重复任务 - 双周和每月
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
        '每月回顾和整理家庭财务状况，包括收支分析和预算调整',
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
        'monthly',
        NULL  -- 每月任务没有特定时间
    );
    
    -- 插入已分配和进行中的任务
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
        user1_id,
        user2_id,
        couple_id,
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
        NULL  -- 每日任务不需要指定星期
    );
    
    RAISE NOTICE 'Tasks inserted successfully!';
END $$;

-- 验证插入的数据
SELECT 
    '=== 数据插入完成 ===' as message,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN repeat_type = 'once' AND task_start_time IS NULL THEN 1 END) as once_simple,
    COUNT(CASE WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN 1 END) as once_time_range,
    COUNT(CASE WHEN repeat_type = 'repeat' THEN 1 END) as repeat_tasks
FROM tasks 
WHERE created_at > NOW() - INTERVAL '10 minutes';

-- 显示创建的任务概览
SELECT 
    title,
    repeat_type,
    CASE 
        WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN '时间范围模式'
        WHEN repeat_type = 'once' THEN '简单模式'
        ELSE CONCAT('重复任务 - ', repeat_frequency)
    END as mode,
    status,
    points,
    CASE 
        WHEN repeat_type = 'once' THEN deadline::date::text
        ELSE CONCAT(start_date, ' 至 ', end_date)
    END as dates,
    CASE 
        WHEN task_start_time IS NOT NULL THEN 
            CONCAT(task_start_time::time, COALESCE(' - ' || task_end_time::time, ''))
        WHEN repeat_time IS NOT NULL THEN repeat_time::text
        ELSE ''
    END as times,
    CASE 
        WHEN repeat_weekdays IS NOT NULL AND array_length(repeat_weekdays, 1) > 0 THEN 
            'weekdays: ' || array_to_string(repeat_weekdays, ',')
        ELSE ''
    END as weekdays_info
FROM tasks 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
