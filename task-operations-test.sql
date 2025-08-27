-- 任务操作测试脚本 - 模拟各种任务状态变更

DO $$
DECLARE
    cat_user_id UUID;
    cow_user_id UUID;
    test_task_id UUID;
BEGIN
    -- 获取用户ID
    SELECT id INTO cat_user_id FROM user_profiles WHERE email = 'cat@loveplanner.com';
    SELECT id INTO cow_user_id FROM user_profiles WHERE email = 'cow@loveplanner.com';
    
    RAISE NOTICE '=== 任务操作测试开始 ===';
    
    -- 测试1: 模拟Cow接受Cat发布的recruiting任务
    SELECT id INTO test_task_id 
    FROM tasks 
    WHERE status = 'recruiting' AND creator_id = cat_user_id 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        UPDATE tasks 
        SET 
            status = 'assigned',
            assignee_id = cow_user_id,
            accepted_at = NOW()
        WHERE id = test_task_id;
        
        RAISE NOTICE '✅ 测试1: Cow接受了任务 "%"', (SELECT title FROM tasks WHERE id = test_task_id);
    END IF;
    
    -- 测试2: 模拟开始执行assigned任务
    SELECT id INTO test_task_id 
    FROM tasks 
    WHERE status = 'assigned' AND assignee_id = cow_user_id 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        UPDATE tasks 
        SET 
            status = 'in_progress',
            started_at = NOW()
        WHERE id = test_task_id;
        
        RAISE NOTICE '✅ 测试2: 开始执行任务 "%"', (SELECT title FROM tasks WHERE id = test_task_id);
    END IF;
    
    -- 测试3: 模拟提交in_progress任务
    SELECT id INTO test_task_id 
    FROM tasks 
    WHERE status = 'in_progress' AND assignee_id = cat_user_id 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        UPDATE tasks 
        SET 
            status = 'pending_review',
            submitted_at = NOW(),
            submit_comment = '任务已完成！请检查结果。'
        WHERE id = test_task_id;
        
        RAISE NOTICE '✅ 测试3: 提交任务 "%"', (SELECT title FROM tasks WHERE id = test_task_id);
    END IF;
    
    -- 测试4: 模拟审核通过pending_review任务
    SELECT id INTO test_task_id 
    FROM tasks 
    WHERE status = 'pending_review' AND creator_id = cat_user_id 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        UPDATE tasks 
        SET 
            status = 'completed',
            completed_at = NOW(),
            review_comment = '非常棒！任务完成得很好！⭐⭐⭐⭐⭐'
        WHERE id = test_task_id;
        
        RAISE NOTICE '✅ 测试4: 审核通过任务 "%"', (SELECT title FROM tasks WHERE id = test_task_id);
    END IF;
    
    -- 测试5: 模拟放弃recruiting任务
    SELECT id INTO test_task_id 
    FROM tasks 
    WHERE status = 'recruiting' AND creator_id = cow_user_id 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        UPDATE tasks 
        SET 
            status = 'abandoned'
        WHERE id = test_task_id;
        
        RAISE NOTICE '✅ 测试5: 放弃任务 "%"', (SELECT title FROM tasks WHERE id = test_task_id);
    END IF;
    
    RAISE NOTICE '=== 任务操作测试完成 ===';
    
END $$;

-- 查看测试后的状态分布
SELECT 
    '=== 测试后状态分布 ===' as info;
    
SELECT 
    status,
    COUNT(*) as count
FROM tasks 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'recruiting' THEN 1
        WHEN 'assigned' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'pending_review' THEN 4
        WHEN 'completed' THEN 5
        WHEN 'abandoned' THEN 6
    END;
