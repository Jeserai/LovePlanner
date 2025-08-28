-- 在清空的tasks表中创建全新的模拟数据
-- 包含所有新功能的完整测试用例

-- 1. 检查现有用户和情侣关系
SELECT '=== 现有用户 ===' as info;
SELECT id, display_name, email FROM user_profiles ORDER BY created_at;

SELECT '=== 情侣关系 ===' as info;  
SELECT id FROM couples LIMIT 1;

-- 2. 创建全新的模拟数据
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
    
    -- 如果只有一个用户，使用同一个用户创建不同任务
    IF user2_id IS NULL THEN
        user2_id := user1_id;
    END IF;
    
    RAISE NOTICE '👥 使用用户1: %, 用户2: %, 情侣ID: %', user1_id, user2_id, couple_id;
    
    -- === 一次性任务 - 简单模式 ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof
    ) VALUES 
    (
        '📦 买菜准备晚餐',
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
        '📚 整理书房',
        '清理书桌，整理书籍，打扫房间卫生',
        NOW() + INTERVAL '3 days',
        25,
        'recruiting',
        user2_id,
        couple_id,
        'daily',
        'once',
        true
    ),
    (
        '🧹 大扫除客厅',
        '全面清洁客厅，包括沙发、地毯和装饰品',
        NOW() + INTERVAL '1 day',
        20,
        'recruiting',
        user1_id,
        couple_id,
        'daily',
        'once',
        true
    );
    
    -- === 一次性任务 - 时间范围模式 ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        task_start_time, task_end_time
    ) VALUES 
    (
        '🕯️ 准备浪漫晚餐',
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
        '🎬 陪伴看电影',
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
    ),
    (
        '☕ 咖啡约会',
        '在最喜欢的咖啡厅度过下午时光',
        NOW() + INTERVAL '3 days' + INTERVAL '16 hours',
        25,
        'recruiting',
        user1_id,
        couple_id,
        'special',
        'once',
        false,
        NOW() + INTERVAL '3 days' + INTERVAL '14 hours',
        NOW() + INTERVAL '3 days' + INTERVAL '16 hours'
    );
    
    -- 设置assignee_id for 陪伴看电影
    UPDATE tasks SET assignee_id = user1_id WHERE title = '🎬 陪伴看电影';
    
    -- === 重复任务 - 每日 ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time
    ) VALUES 
    (
        '🏃 早晨锻炼',
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
        '📖 睡前阅读',
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
    ),
    (
        '💧 喝水提醒',
        '每天保持充足的水分摄入，记录饮水量',
        CURRENT_DATE + INTERVAL '14 days',
        10,
        'assigned',
        user1_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '14 days',
        'daily',
        '09:00:00'
    );
    
    -- 设置assignee_id for 喝水提醒
    UPDATE tasks SET assignee_id = user2_id WHERE title = '💧 喝水提醒';
    
    -- === 重复任务 - 每周（指定星期） ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
    ) VALUES 
    (
        '🧽 深度清洁厨房',
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
        '📋 制定周计划',
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
    ),
    (
        '🛒 超市购物',
        '每周末进行一次大采购，补充生活必需品',
        CURRENT_DATE + INTERVAL '45 days',
        30,
        'recruiting',
        user1_id,
        couple_id,
        'daily',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '45 days',
        'weekly',
        '15:00:00',
        ARRAY[6]  -- 周六
    );
    
    -- === 重复任务 - 双周和每月 ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time
    ) VALUES 
    (
        '💕 约会计划',
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
        '💰 家庭财务回顾',
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
        NULL  -- 每月任务不指定具体时间
    ),
    (
        '🏠 房间深度清洁',
        '每月进行一次全屋深度清洁，包括床单更换和角落清理',
        CURRENT_DATE + INTERVAL '4 months',
        45,
        'recruiting',
        user1_id,
        couple_id,
        'daily',
        'repeat',
        true,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '4 months',
        'monthly',
        NULL  -- 每月任务不指定具体时间
    );
    
    -- === 已分配和进行中的任务 ===
    INSERT INTO tasks (
        title, description, deadline, points, status, creator_id, assignee_id, couple_id, 
        task_type, repeat_type, requires_proof,
        start_date, end_date, repeat_frequency, repeat_time, repeat_weekdays
    ) VALUES 
    (
        '💪 健身房锻炼',
        '每周三次去健身房进行力量训练和有氧运动',
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
        ARRAY[1, 3, 5]  -- 周一、周三、周五
    ),
    (
        '🎯 学习新技能',
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
    ),
    (
        '🎨 绘画练习',
        '每周两次进行绘画练习，提升艺术技能',
        CURRENT_DATE + INTERVAL '60 days',
        35,
        'assigned',
        user1_id,
        user2_id,
        couple_id,
        'habit',
        'repeat',
        false,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '60 days',
        'weekly',
        '16:00:00',
        ARRAY[2, 4]  -- 周二、周四
    );
    
    RAISE NOTICE '🎉 成功创建了18个多样化的测试任务！';
END $$;

-- 验证插入的数据
SELECT 
    '=== 数据创建完成 ===' as message,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN repeat_type = 'once' AND task_start_time IS NULL THEN 1 END) as once_simple,
    COUNT(CASE WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN 1 END) as once_time_range,
    COUNT(CASE WHEN repeat_type = 'repeat' THEN 1 END) as repeat_tasks,
    COUNT(CASE WHEN status = 'recruiting' THEN 1 END) as recruiting,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned
FROM tasks;

-- 显示任务概览（按类型分组）
SELECT 
    '=== 任务类型分布 ===' as info;
    
SELECT 
    CASE 
        WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN '⏰ 一次性时间范围'
        WHEN repeat_type = 'once' THEN '📅 一次性简单'
        WHEN repeat_type = 'repeat' AND repeat_frequency = 'daily' THEN '🔄 每日重复'
        WHEN repeat_type = 'repeat' AND repeat_frequency = 'weekly' THEN '📋 每周重复'
        WHEN repeat_type = 'repeat' AND repeat_frequency = 'biweekly' THEN '🔁 双周重复'
        WHEN repeat_type = 'repeat' AND repeat_frequency = 'monthly' THEN '📆 每月重复'
        ELSE '❓ 其他'
    END as task_category,
    COUNT(*) as count,
    string_agg(title, ', ') as examples
FROM tasks 
GROUP BY 
    repeat_type, 
    (task_start_time IS NOT NULL),
    repeat_frequency
ORDER BY count DESC;

-- 显示详细任务列表
SELECT 
    '=== 创建的任务详情 ===' as info;
    
SELECT 
    title,
    status,
    points,
    CASE 
        WHEN repeat_type = 'once' AND task_start_time IS NOT NULL THEN 
            CONCAT('时间范围: ', task_start_time::time, ' - ', COALESCE(task_end_time::time::text, '开放结束'))
        WHEN repeat_type = 'once' THEN 
            CONCAT('截止: ', deadline::date)
        ELSE 
            CONCAT(repeat_frequency, 
                   CASE WHEN repeat_time IS NOT NULL THEN CONCAT(' @', repeat_time::time) ELSE '' END,
                   CASE WHEN repeat_weekdays IS NOT NULL AND array_length(repeat_weekdays, 1) > 0 
                        THEN CONCAT(' 星期', array_to_string(repeat_weekdays, ',')) 
                        ELSE '' END)
    END as schedule_info,
    CASE WHEN requires_proof THEN '✅需要凭证' ELSE '❌无需凭证' END as proof_required
FROM tasks 
ORDER BY 
    repeat_type,
    CASE 
        WHEN repeat_type = 'once' THEN 1
        WHEN repeat_frequency = 'daily' THEN 2
        WHEN repeat_frequency = 'weekly' THEN 3
        WHEN repeat_frequency = 'biweekly' THEN 4
        WHEN repeat_frequency = 'monthly' THEN 5
        ELSE 6
    END,
    created_at;
