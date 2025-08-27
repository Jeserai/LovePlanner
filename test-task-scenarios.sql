-- 测试任务状态处理功能的验证脚本

-- 1. 查看所有任务的当前状态
SELECT 
    '=== 所有任务状态概览 ===' as info;

SELECT 
    t.title,
    t.status,

    t.points,
    t.deadline::date as deadline_date,
    CASE 
        WHEN t.deadline::date < CURRENT_DATE THEN '⏰ 已过期'
        WHEN t.deadline::date = CURRENT_DATE THEN '⚠️ 今天到期'
        WHEN t.deadline::date <= CURRENT_DATE + INTERVAL '3 days' THEN '🔔 即将到期'
        ELSE '✅ 时间充足'
    END as deadline_status,
    up_creator.display_name as creator,
    up_assignee.display_name as assignee
FROM tasks t
LEFT JOIN user_profiles up_creator ON t.creator_id = up_creator.id
LEFT JOIN user_profiles up_assignee ON t.assignee_id = up_assignee.id
ORDER BY 
    CASE t.status 
        WHEN 'recruiting' THEN 1
        WHEN 'assigned' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'pending_review' THEN 4
        WHEN 'completed' THEN 5
        WHEN 'abandoned' THEN 6
    END,
    t.deadline;

-- 2. 状态分布统计
SELECT 
    '=== 任务状态分布统计 ===' as info;

SELECT 
    status as 任务状态,
    COUNT(*) as 数量,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as 百分比,
    SUM(points) as 总积分
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

-- 3. 用户任务分布
SELECT 
    '=== 用户任务分布 ===' as info;

SELECT 
    '发布的任务' as 类型,
    up.display_name as 用户,
    COUNT(*) as 数量,
    SUM(t.points) as 总积分
FROM tasks t
JOIN user_profiles up ON t.creator_id = up.id
GROUP BY up.display_name

UNION ALL

SELECT 
    '执行的任务' as 类型,
    up.display_name as 用户,
    COUNT(*) as 数量,
    SUM(t.points) as 总积分
FROM tasks t
JOIN user_profiles up ON t.assignee_id = up.id
WHERE t.assignee_id IS NOT NULL
GROUP BY up.display_name

ORDER BY 类型, 用户;

-- 4. 过期任务检测
SELECT 
    '=== 过期任务检测 ===' as info;

SELECT 
    t.title,
    t.status,
    t.deadline,
    CURRENT_DATE - t.deadline_date as 过期天数,
    up_creator.display_name as 发布者,
    up_assignee.display_name as 执行者,
    CASE 
        WHEN t.status IN ('recruiting', 'assigned', 'in_progress') THEN '⚠️ 需要标记为已放弃'
        ELSE '✅ 状态正确'
    END as 处理建议
FROM tasks t
LEFT JOIN user_profiles up_creator ON t.creator_id = up_creator.id
LEFT JOIN user_profiles up_assignee ON t.assignee_id = up_assignee.id
WHERE t.deadline::date < CURRENT_DATE
ORDER BY t.deadline;

-- 5. 即将到期的任务
SELECT 
    '=== 即将到期的任务 (3天内) ===' as info;

SELECT 
    t.title,
    t.status,
    t.deadline,
    CASE 
        WHEN t.deadline_date = CURRENT_DATE THEN '今天到期！'
        ELSE (t.deadline_date - CURRENT_DATE)::text || ' 天后到期'
    END as 时间提醒,
    up_creator.display_name as 发布者,
    up_assignee.display_name as 执行者
FROM tasks t
LEFT JOIN user_profiles up_creator ON t.creator_id = up_creator.id
LEFT JOIN user_profiles up_assignee ON t.assignee_id = up_assignee.id
WHERE t.deadline::date <= CURRENT_DATE + INTERVAL '3 days'
    AND t.deadline::date >= CURRENT_DATE
    AND t.status NOT IN ('completed', 'abandoned')
ORDER BY t.deadline;

-- 6. 任务流程完整性检查
SELECT 
    '=== 任务流程时间轴检查 ===' as info;

SELECT 
    t.title,
    t.status,
    t.created_at::date as 创建日期,
    t.accepted_at::date as 接受日期,
    t.started_at::date as 开始日期,
    t.submitted_at::date as 提交日期,
    t.completed_at::date as 完成日期,
    CASE 
        WHEN t.status = 'assigned' AND t.accepted_at IS NULL THEN '⚠️ 缺少接受时间'
        WHEN t.status = 'in_progress' AND t.started_at IS NULL THEN '⚠️ 缺少开始时间'
        WHEN t.status = 'pending_review' AND t.submitted_at IS NULL THEN '⚠️ 缺少提交时间'
        WHEN t.status = 'completed' AND t.completed_at IS NULL THEN '⚠️ 缺少完成时间'
        ELSE '✅ 时间轴完整'
    END as 数据完整性
FROM tasks t
ORDER BY t.created_at DESC;
