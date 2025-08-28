-- 验证表结构更新结果
-- 在Supabase SQL编辑器中执行

-- 1. 检查所有字段
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查新增的字段
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
    AND column_name IN (
        'task_start_time', 'task_end_time', 'start_date', 'end_date',
        'repeat_frequency', 'repeat_time', 'repeat_weekdays', 'proof_type'
    )
ORDER BY column_name;

-- 3. 验证数据完整性 - 测试新字段
INSERT INTO tasks (
    title, 
    description, 
    deadline, 
    points, 
    status, 
    creator_id, 
    couple_id, 
    task_type, 
    repeat_type,
    requires_proof,
    -- 测试新字段
    task_start_time,
    task_end_time,
    start_date,
    end_date,
    repeat_frequency,
    repeat_time,
    repeat_weekdays
) VALUES (
    '测试任务 - 时间范围模式',
    '这是一个测试时间范围功能的任务',
    NOW() + INTERVAL '1 day',
    10,
    'recruiting',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'daily',
    'once',
    false,
    -- 新字段值
    NOW() + INTERVAL '6 hours',
    NOW() + INTERVAL '18 hours',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);

-- 4. 测试重复任务字段
INSERT INTO tasks (
    title, 
    description, 
    deadline, 
    points, 
    status, 
    creator_id, 
    couple_id, 
    task_type, 
    repeat_type,
    requires_proof,
    -- 测试重复任务字段
    start_date,
    end_date,
    repeat_frequency,
    repeat_time,
    repeat_weekdays
) VALUES (
    '测试任务 - 重复模式',
    '这是一个测试重复功能的任务',
    NOW() + INTERVAL '30 days',
    20,
    'recruiting',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM couples LIMIT 1),
    'habit',
    'repeat',
    false,
    -- 重复任务字段值
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '21 days',
    'weekly',
    '09:00:00',
    ARRAY[1, 3, 5]  -- 周一、周三、周五
);

-- 5. 查看测试数据
SELECT 
    id,
    title,
    repeat_type,
    CASE 
        WHEN repeat_type = 'once' THEN 
            CASE 
                WHEN task_start_time IS NOT NULL THEN '时间范围模式'
                ELSE '简单模式'
            END
        ELSE '重复任务'
    END as task_mode,
    task_start_time,
    task_end_time,
    start_date,
    end_date,
    repeat_frequency,
    repeat_weekdays
FROM tasks 
WHERE title LIKE '测试任务%'
ORDER BY created_at DESC;
