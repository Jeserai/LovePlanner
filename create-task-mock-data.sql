-- 创建任务模拟数据，适配实际的tasks表结构

DO $$
DECLARE
    cat_user_id UUID;
    cow_user_id UUID;
    couple_id UUID;
BEGIN
    -- 获取用户ID
    SELECT id INTO cat_user_id FROM user_profiles WHERE email = 'cat@loveplanner.com';
    SELECT id INTO cow_user_id FROM user_profiles WHERE email = 'cow@loveplanner.com';
    
    -- 获取couple ID
    SELECT id INTO couple_id FROM couples WHERE is_active = true LIMIT 1;
    
    -- 输出找到的ID用于验证
    RAISE NOTICE '找到 Cat 用户ID: %', cat_user_id;
    RAISE NOTICE '找到 Cow 用户ID: %', cow_user_id;
    RAISE NOTICE '找到 Couple ID: %', couple_id;
    
    -- 如果找到了所有必要的ID，创建任务数据
    IF cat_user_id IS NOT NULL AND cow_user_id IS NOT NULL AND couple_id IS NOT NULL THEN
        
        -- 1. recruiting状态的任务 (Cat发布，等待Cow接受)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type
        ) VALUES 
        (
            couple_id, '收拾客厅', 
            '整理客厅的书籍和杂物，让空间更整洁', 50, 
            (NOW() + INTERVAL '7 days'), 
            'recruiting', cat_user_id, NULL, 'special', 'once'
        ),
        (
            couple_id, '购买生日礼物', 
            '为即将到来的生日准备一份特别的礼物', 80, 
            (NOW() + INTERVAL '14 days'), 
            'recruiting', cat_user_id, NULL, 'special', 'once'
        );
        
        -- 2. assigned状态的任务 (Cow接受了Cat的任务)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type
        ) VALUES 
        (
            couple_id, '准备周末晚餐', 
            '计划并准备一顿浪漫的周末晚餐', 100, 
            (NOW() + INTERVAL '5 days'), 
            'assigned', cat_user_id, cow_user_id, 'special', 'once'
        ),
        (
            couple_id, '修理台灯', 
            '客厅的台灯开关坏了，需要修理或更换', 30, 
            (NOW() + INTERVAL '10 days'), 
            'assigned', cow_user_id, cat_user_id, 'special', 'once'
        );
        
        -- 3. in_progress状态的任务 (正在进行中)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type
        ) VALUES 
        (
            couple_id, '学习新菜谱', 
            '学会做一道新的中式菜肴，下次约会时展示', 60, 
            (NOW() + INTERVAL '12 days'), 
            'in-progress', cat_user_id, cow_user_id, 'special', 'once'
        ),
        (
            couple_id, '整理照片', 
            '把手机里的照片整理到相册，制作回忆集', 40, 
            (NOW() + INTERVAL '8 days'), 
            'in-progress', cow_user_id, cat_user_id, 'special', 'once'
        );
        
        -- 4. pending_review状态的任务 (已提交等待审核)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type, 
            submitted_at, review_comment
        ) VALUES 
        (
            couple_id, '清洁浴室', 
            '深度清洁浴室，包括瓷砖和镜子', 70, 
            (NOW() + INTERVAL '3 days'), 
            'pending_review', cat_user_id, cow_user_id, 'special', 'once',
            NOW() - INTERVAL '1 hour', '浴室已经彻底清洁完毕，瓷砖和镜子都擦得很亮！'
        ),
        (
            couple_id, '制作惊喜视频', 
            '为纪念日制作一个短视频回顾我们的美好时光', 120, 
            (NOW() + INTERVAL '6 days'), 
            'pending_review', cow_user_id, cat_user_id, 'special', 'once',
            NOW() - INTERVAL '30 minutes', '视频制作完成了！包含了我们这一年的精彩瞬间，希望你喜欢 💕'
        );
        
        -- 5. completed状态的任务 (已完成)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type, 
            submitted_at, completed_at, review_comment
        ) VALUES 
        (
            couple_id, '订购鲜花', 
            '为这周的约会订购一束美丽的鲜花', 45, 
            (NOW() - INTERVAL '1 day'), 
            'completed', cat_user_id, cow_user_id, 'special', 'once',
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
            '花非常漂亮！约会的氛围太棒了，谢谢！❤️'
        ),
        (
            couple_id, '购买电影票', 
            '购买周末电影院的票，选择一部我们都想看的电影', 25, 
            (NOW() - INTERVAL '3 days'), 
            'completed', cow_user_id, cat_user_id, 'special', 'once',
            NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days',
            '电影超级好看！完美的周末夜晚 🎬'
        );
        
        -- 6. abandoned状态的任务 (已放弃，包括过期的)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type
        ) VALUES 
        (
            couple_id, '学习吉他', 
            '学会弹奏一首简单的歌曲', 150, 
            (NOW() - INTERVAL '5 days'), 
            'abandoned', cat_user_id, NULL, 'special', 'once'
        ),
        (
            couple_id, '组织聚会', 
            '组织一次朋友聚会，邀请大家来家里', 90, 
            (NOW() - INTERVAL '2 days'), 
            'abandoned', cow_user_id, cat_user_id, 'special', 'once'
        );
        
        -- 7. 一些即将过期的任务 (用于测试过期处理)
        INSERT INTO tasks (
            couple_id, title, description, points, deadline, 
            status, creator_id, assignee_id, task_type, repeat_type
        ) VALUES 
        (
            couple_id, '紧急修理水龙头', 
            '厨房水龙头滴水，需要尽快修理', 40, 
            (NOW() + INTERVAL '1 day'), 
            'assigned', cat_user_id, cow_user_id, 'special', 'once'
        ),
        (
            couple_id, '准备重要文件', 
            '整理和准备下周需要的重要文件', 35,
            (NOW() + INTERVAL '2 days'), 
            'in-progress', cow_user_id, cat_user_id, 'special', 'once'
        );
        
        RAISE NOTICE '✅ 成功创建了14个测试任务，涵盖所有状态';
        RAISE NOTICE '任务状态分布：';
        RAISE NOTICE '- recruiting: 2个';
        RAISE NOTICE '- assigned: 2个';
        RAISE NOTICE '- in_progress: 2个';
        RAISE NOTICE '- pending_review: 2个';
        RAISE NOTICE '- completed: 2个';
        RAISE NOTICE '- abandoned: 2个';
        RAISE NOTICE '- 即将过期: 2个';
        
    ELSE
        RAISE NOTICE '❌ 缺少必要的用户或情侣数据，无法创建任务';
        RAISE NOTICE 'Cat用户ID: %', cat_user_id;
        RAISE NOTICE 'Cow用户ID: %', cow_user_id;
        RAISE NOTICE 'Couple ID: %', couple_id;
    END IF;
END $$;

-- 验证创建的任务
SELECT 
    '=== 任务统计 ===' as info;
    
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(title, ', ') as task_titles
FROM tasks 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'recruiting' THEN 1
        WHEN 'assigned' THEN 2
        WHEN 'in-progress' THEN 3
        WHEN 'pending_review' THEN 4
        WHEN 'completed' THEN 5
        WHEN 'abandoned' THEN 6
    END;
