-- 简化版模拟数据插入脚本
-- 仅插入日程事件数据（适配简化的事件表结构）

DO $$
DECLARE
    couple_record RECORD;
    couple_id UUID;
    user1_id UUID;
    user2_id UUID;
    event_count INTEGER := 0;
BEGIN
    -- 获取第一个活跃的情侣关系
    SELECT c.id, c.user1_id, c.user2_id 
    INTO couple_id, user1_id, user2_id
    FROM couples c 
    WHERE c.is_active = true 
    LIMIT 1;
    
    IF couple_id IS NULL THEN
        RAISE EXCEPTION '未找到活跃的情侣关系，请先确保数据库中有用户和情侣数据';
    END IF;
    
    RAISE NOTICE '找到情侣关系: %', couple_id;
    RAISE NOTICE 'User1 ID: %', user1_id;
    RAISE NOTICE 'User2 ID: %', user2_id;
    
    -- ========================================
    -- 插入日程事件数据
    -- ========================================
    
    RAISE NOTICE '开始插入日程事件数据...';
    
    -- 清空现有事件（可选，小心使用）
    -- DELETE FROM events WHERE couple_id = couple_id;
    
    -- 事件1: 今天的共同事件 - 浪漫晚餐
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_simple_event') THEN
        PERFORM create_simple_event(
            couple_id,
            '浪漫晚餐',
            CURRENT_DATE,
            user1_id,
            true,  -- 包含user1
            true,  -- 包含user2
            '19:00'::TIME,
            '21:00'::TIME,
            '在家准备一顿浪漫的烛光晚餐',
            false, -- 不是全天事件
            '家里',
            false, -- 不重复
            NULL,
            NULL
        );
        event_count := event_count + 1;
    ELSE
        -- 直接插入（如果函数不存在）
        INSERT INTO events (
            couple_id, title, description, event_date, start_time, end_time,
            is_all_day, location, created_by, includes_user1, includes_user2,
            is_recurring
        ) VALUES (
            couple_id, '浪漫晚餐', '在家准备一顿浪漫的烛光晚餐', 
            CURRENT_DATE, '19:00'::TIME, '21:00'::TIME,
            false, '家里', user1_id, true, true, false
        );
        event_count := event_count + 1;
    END IF;
    
    -- 事件2: 明天User1的个人事件 - 瑜伽课程
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '瑜伽课程', '晨间瑜伽练习', 
        CURRENT_DATE + INTERVAL '1 day', '08:00'::TIME, '09:30'::TIME,
        false, '瑜伽馆', user1_id, true, false, false
    );
    event_count := event_count + 1;
    
    -- 事件3: 后天User2的个人事件 - 工作会议
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '团队会议', '项目进度讨论会议', 
        CURRENT_DATE + INTERVAL '2 days', '14:00'::TIME, '16:00'::TIME,
        false, '公司会议室', user2_id, false, true, false
    );
    event_count := event_count + 1;
    
    -- 事件4: 这个周末的共同活动 - 电影之夜
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '电影之夜', '在家看新上映的电影', 
        CURRENT_DATE + INTERVAL '6 days', '20:00'::TIME, '22:30'::TIME,
        false, '家里客厅', user2_id, true, true, false
    );
    event_count := event_count + 1;
    
    -- 事件5: 下周的共同锻炼（重复事件）
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring, recurrence_type, recurrence_end
    ) VALUES (
        couple_id, '夫妻健身时间', '一起去健身房锻炼', 
        CURRENT_DATE + INTERVAL '7 days', '18:30'::TIME, '20:00'::TIME,
        false, '健身房', user2_id, true, true, 
        true, 'weekly', CURRENT_DATE + INTERVAL '3 months'
    );
    event_count := event_count + 1;
    
    -- 事件6: 下个月的特殊事件 - 纪念日（全天事件）
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '我们的纪念日', '庆祝我们在一起的特殊日子', 
        CURRENT_DATE + INTERVAL '30 days', NULL, NULL,
        true, '特别的地方', user1_id, true, true, false
    );
    event_count := event_count + 1;
    
    -- 事件7: 下周User1的工作事件
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '客户演示', '向重要客户展示新项目', 
        CURRENT_DATE + INTERVAL '5 days', '10:00'::TIME, '11:30'::TIME,
        false, '客户办公室', user1_id, true, false, false
    );
    event_count := event_count + 1;
    
    -- 事件8: 明天的User2个人学习时间
    INSERT INTO events (
        couple_id, title, description, event_date, start_time, end_time,
        is_all_day, location, created_by, includes_user1, includes_user2,
        is_recurring
    ) VALUES (
        couple_id, '在线学习', '学习React.js课程', 
        CURRENT_DATE + INTERVAL '1 day', '21:00'::TIME, '22:30'::TIME,
        false, '家里书房', user2_id, false, true, false
    );
    event_count := event_count + 1;
    
    RAISE NOTICE '已插入 % 个日程事件', event_count;
    
    -- ========================================
    -- 总结
    -- ========================================
    
    RAISE NOTICE '=== 简化模拟数据插入完成 ===';
    RAISE NOTICE '情侣ID: %', couple_id;
    RAISE NOTICE '日程事件数量: %', event_count;
    RAISE NOTICE '==============================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '插入模拟数据时出错: %', SQLERRM;
END $$;

-- ========================================
-- 验证插入的数据
-- ========================================

-- 检查事件统计
SELECT 
    '📊 事件统计' as info,
    COUNT(*) as total_events,
    COUNT(CASE WHEN includes_user1 AND includes_user2 THEN 1 END) as shared_events,
    COUNT(CASE WHEN includes_user1 AND NOT includes_user2 THEN 1 END) as user1_only_events,
    COUNT(CASE WHEN includes_user2 AND NOT includes_user1 THEN 1 END) as user2_only_events,
    COUNT(CASE WHEN is_recurring THEN 1 END) as recurring_events,
    COUNT(CASE WHEN is_all_day THEN 1 END) as all_day_events
FROM events;

-- 显示插入的事件详情
SELECT 
    '📅 最近事件' as type,
    title,
    event_date,
    start_time,
    CASE 
        WHEN includes_user1 AND includes_user2 THEN '👫 共同'
        WHEN includes_user1 THEN '👤 用户1'
        WHEN includes_user2 THEN '👤 用户2'
        ELSE '❓ 未知'
    END as participants,
    CASE WHEN is_recurring THEN '🔄 重复' ELSE '📍 单次' END as type_info,
    location
FROM events 
ORDER BY event_date, start_time 
LIMIT 10;

-- 显示按日期分组的事件
SELECT 
    event_date as 日期,
    COUNT(*) as 事件数量,
    STRING_AGG(
        title || CASE 
            WHEN includes_user1 AND includes_user2 THEN '(共同)'
            WHEN includes_user1 THEN '(用户1)'
            ELSE '(用户2)'
        END, 
        ', '
    ) as 事件列表
FROM events 
GROUP BY event_date 
ORDER BY event_date;

-- 数据验证完成提示
SELECT '✅ 数据验证完成！请检查上述查询结果。' as 提示;
