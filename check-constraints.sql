-- 检查tasks表的约束条件

SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public' 
AND constraint_name LIKE '%tasks%';

-- 也可以查看表定义来了解约束
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass
AND contype = 'c';
