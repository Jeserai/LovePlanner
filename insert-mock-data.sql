-- 插入模拟数据脚本
-- 包含任务和日程数据，适用于Cat和Cow两个用户

DO $$
DECLARE
    couple_record RECORD;
    couple_id UUID;
    cat_user_id UUID;
    cow_user_id UUID;
    task_id_1 UUID;
    task_id_2 UUID;
    task_id_3 UUID;
    task_id_4 UUID;
    task_id_5 UUID;
    event_id_1 UUID;
    event_id_2 UUID;
    event_id_3 UUID;
BEGIN
    -- 获取第一个活跃的情侣关系
    SELECT c.id, c.user1_id, c.user2_id 
    INTO couple_id, cat_user_id, cow_user_id
    FROM couples c 
    WHERE c.is_active = true 
    LIMIT 1;
    
    IF couple_id IS NULL THEN
        RAISE EXCEPTION '未找到活跃的情侣关系，请先确保数据库中有用户和情侣数据';
    END IF;
    
    RAISE NOTICE '找到情侣关系: %', couple_id;
    RAISE NOTICE 'User1 (Cat): %', cat_user_id;
    RAISE NOTICE 'User2 (Cow): %', cow_user_id;
    
    -- ========================================
    -- 插入任务数据
    -- ========================================
    
    RAISE NOTICE '开始插入任务数据...';
    
    -- 任务1: Cat创建的个人任务
    INSERT INTO tasks (
        couple_id, title, description, category, status, priority,
        assigned_to, created_by, due_date, points_reward
    ) VALUES (
        couple_id, 
        '瑜伽练习计划', 
        '每周至少练习3次瑜伽，保持身心健康', 
        'health', 
        'in_progress', 
        'medium',
        cat_user_id, 
        cat_user_id, 
        CURRENT_DATE + INTERVAL '7 days',
        50
    ) RETURNING id INTO task_id_1;
    
    -- 任务2: Cow创建的个人任务
    INSERT INTO tasks (
        couple_id, title, description, category, status, priority,
        assigned_to, created_by, due_date, points_reward
    ) VALUES (
        couple_id, 
        '学习新的编程技能', 
        '完成React.js在线课程', 
        'learning', 
        'recruiting', 
        'high',
        cow_user_id, 
        cow_user_id, 
        CURRENT_DATE + INTERVAL '14 days',
        100
    ) RETURNING id INTO task_id_2;
    
    -- 任务3: 共同任务 - Cat创建，分配给Cow
    INSERT INTO tasks (
        couple_id, title, description, category, status, priority,
        assigned_to, created_by, due_date, points_reward
    ) VALUES (
        couple_id, 
        '计划周末约会', 
        '安排一个浪漫的周末约会，包括餐厅预订和活动安排', 
        'relationship', 
        'assigned', 
        'high',
        cow_user_id, 
        cat_user_id, 
        CURRENT_DATE + INTERVAL '5 days',
        80
    ) RETURNING id INTO task_id_3;
    
    -- 任务4: 家务任务 - Cow创建，分配给Cat
    INSERT INTO tasks (
        couple_id, title, description, category, status, priority,
        assigned_to, created_by, due_date, points_reward
    ) VALUES (
        couple_id, 
        '整理家里的书房', 
        '重新整理书房，整理书籍和文件', 
        'home', 
        'pending_review', 
        'low',
        cat_user_id, 
        cow_user_id, 
        CURRENT_DATE + INTERVAL '3 days',
        30
    ) RETURNING id INTO task_id_4;
    
    -- 任务5: 已完成的任务
    INSERT INTO tasks (
        couple_id, title, description, category, status, priority,
        assigned_to, created_by, due_date, points_reward, completed_at
    ) VALUES (
        couple_id, 
        '购买生日礼物', 
        '为对方选择一份特别的生日礼物', 
        'relationship', 
        'completed', 
        'medium',
        cat_user_id, 
        cow_user_id, 
        CURRENT_DATE - INTERVAL '2 days',
        60,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ) RETURNING id INTO task_id_5;
    
    RAISE NOTICE '已插入 5 个任务';
    
    -- ========================================
    -- 插入日程事件数据
    -- ========================================
    
    RAISE NOTICE '开始插入日程事件数据...';
    
    -- 事件1: 今天的共同事件
    SELECT create_simple_event(
        couple_id,
        '浪漫晚餐',
        CURRENT_DATE,
        cat_user_id,
        true,  -- 包含user1 (Cat)
        true,  -- 包含user2 (Cow)
        '19:00'::TIME,
        '21:00'::TIME,
        '在家准备一顿浪漫的烛光晚餐',
        false, -- 不是全天事件
        '家里',
        false, -- 不重复
        NULL,
        NULL
    ) INTO event_id_1;
    
    -- 事件2: 明天Cat的个人事件
    SELECT create_simple_event(
        couple_id,
        '瑜伽课程',
        CURRENT_DATE + INTERVAL '1 day',
        cat_user_id,
        true,  -- 包含user1 (Cat)
        false, -- 不包含user2 (Cow)
        '08:00'::TIME,
        '09:30'::TIME,
        '晨间瑜伽练习',
        false,
        '瑜伽馆',
        false,
        NULL,
        NULL
    ) INTO event_id_2;
    
    -- 事件3: 后天Cow的个人事件
    SELECT create_simple_event(
        couple_id,
        '团队会议',
        CURRENT_DATE + INTERVAL '2 days',
        cow_user_id,
        false, -- 不包含user1 (Cat)
        true,  -- 包含user2 (Cow)
        '14:00'::TIME,
        '16:00'::TIME,
        '项目进度讨论会议',
        false,
        '公司会议室',
        false,
        NULL,
        NULL
    ) INTO event_id_3;
    
    -- 事件4: 下周的重复事件（每周共同锻炼）
    PERFORM create_simple_event(
        couple_id,
        '夫妻健身时间',
        CURRENT_DATE + INTERVAL '7 days',
        cow_user_id,
        true,  -- 包含user1 (Cat)
        true,  -- 包含user2 (Cow)
        '18:30'::TIME,
        '20:00'::TIME,
        '一起去健身房锻炼',
        false,
        '健身房',
        true,  -- 重复事件
        'weekly',
        CURRENT_DATE + INTERVAL '3 months'
    );
    
    -- 事件5: 下个月的特殊事件（纪念日）
    PERFORM create_simple_event(
        couple_id,
        '我们的纪念日',
        CURRENT_DATE + INTERVAL '30 days',
        cat_user_id,
        true,  -- 包含user1 (Cat)
        true,  -- 包含user2 (Cow)
        NULL,  -- 全天事件
        NULL,
        '庆祝我们在一起的特殊日子',
        true,  -- 全天事件
        '特别的地方',
        false,
        NULL,
        NULL
    );
    
    -- 事件6: 下周Cat的工作事件
    PERFORM create_simple_event(
        couple_id,
        '客户演示',
        CURRENT_DATE + INTERVAL '5 days',
        cat_user_id,
        true,  -- 包含user1 (Cat)
        false, -- 不包含user2 (Cow)
        '10:00'::TIME,
        '11:30'::TIME,
        '向重要客户展示新项目',
        false,
        '客户办公室',
        false,
        NULL,
        NULL
    );
    
    -- 事件7: 本周末的共同活动
    PERFORM create_simple_event(
        couple_id,
        '电影之夜',
        CURRENT_DATE + INTERVAL '6 days',
        cow_user_id,
        true,  -- 包含user1 (Cat)
        true,  -- 包含user2 (Cow)
        '20:00'::TIME,
        '22:30'::TIME,
        '在家看新上映的电影',
        false,
        '家里客厅',
        false,
        NULL,
        NULL
    );
    
    RAISE NOTICE '已插入 7 个日程事件';
    
    -- ========================================
    -- 插入一些积分交易记录
    -- ========================================
    
    RAISE NOTICE '开始插入积分交易记录...';
    
    -- Cat完成任务获得积分
    INSERT INTO point_transactions (
        couple_id, user_id, amount, transaction_type, description, reference_type, reference_id
    ) VALUES (
        couple_id, cat_user_id, 60, 'earned', '完成任务：购买生日礼物', 'task', task_id_5
    );
    
    -- Cow完成其他任务获得积分
    INSERT INTO point_transactions (
        couple_id, cow_user_id, 50, 'earned', '每日签到奖励', 'daily_checkin', NULL
    );
    
    INSERT INTO point_transactions (
        couple_id, cat_user_id, 30, 'earned', '参与日程安排', 'event', event_id_1
    );
    
    RAISE NOTICE '已插入积分交易记录';
    
    -- ========================================
    -- 创建一些商店物品（可选）
    -- ========================================
    
    INSERT INTO shop_items (
        couple_id, name, description, cost, category, is_available
    ) VALUES 
    (couple_id, '按摩服务券', '享受30分钟专业按摩', 100, 'wellness', true),
    (couple_id, '免洗碗特权', '今晚不用洗碗啦！', 50, 'chores', true),
    (couple_id, '选择今晚看什么电影', '决定今晚一起看什么电影的权利', 30, 'entertainment', true),
    (couple_id, '早餐在床上', '享受对方准备的床上早餐', 80, 'romantic', true);
    
    RAISE NOTICE '已插入商店物品';
    
    -- ========================================
    -- 总结
    -- ========================================
    
    RAISE NOTICE '=== 模拟数据插入完成 ===';
    RAISE NOTICE '情侣ID: %', couple_id;
    RAISE NOTICE '任务数量: 5';
    RAISE NOTICE '日程事件数量: 7';
    RAISE NOTICE '积分交易数量: 3';
    RAISE NOTICE '商店物品数量: 4';
    RAISE NOTICE '=============================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '插入模拟数据时出错: %', SQLERRM;
END $$;

-- 验证插入的数据
RAISE NOTICE '正在验证插入的数据...';

-- 检查任务
SELECT 
    '任务统计' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'recruiting' THEN 1 END) as recruiting,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM tasks;

-- 检查事件
SELECT 
    '事件统计' as info,
    COUNT(*) as total_events,
    COUNT(CASE WHEN includes_user1 AND includes_user2 THEN 1 END) as shared_events,
    COUNT(CASE WHEN includes_user1 AND NOT includes_user2 THEN 1 END) as user1_events,
    COUNT(CASE WHEN includes_user2 AND NOT includes_user1 THEN 1 END) as user2_events,
    COUNT(CASE WHEN is_recurring THEN 1 END) as recurring_events
FROM events;

-- 显示最近的任务和事件
SELECT 
    '最近任务' as type,
    title,
    status,
    priority,
    due_date
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
    '最近事件' as type,
    title,
    event_date,
    start_time,
    CASE 
        WHEN includes_user1 AND includes_user2 THEN 'shared'
        WHEN includes_user1 THEN 'user1'
        ELSE 'user2'
    END as event_type
FROM events 
ORDER BY created_at DESC 
LIMIT 5;
