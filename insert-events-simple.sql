-- 简化的日程事件数据插入脚本
-- 最小化版本，避免语法错误

DO $$
DECLARE
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
    
    -- 插入事件数据
    
    -- 1. 今天的共同事件 - 浪漫晚餐
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
    
    -- 2. 明天User1的个人事件 - 瑜伽课程
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
    
    -- 3. 后天User2的个人事件 - 工作会议
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
    
    -- 4. 这个周末的共同活动 - 电影之夜
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
    
    -- 5. 下周的共同锻炼（重复事件）
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
    
    -- 6. 下个月的特殊事件 - 纪念日（全天事件）
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
    
    -- 7. 下周User1的工作事件
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
    
    -- 8. 明天的User2个人学习时间
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
    
    RAISE NOTICE '成功插入 % 个日程事件到情侣ID: %', event_count, couple_id;
    
END $$;
