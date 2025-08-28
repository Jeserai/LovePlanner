-- 添加任务表缺失的字段
-- 基于当前表结构，添加时间范围和重复任务支持

-- 添加一次性任务的时间范围字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_end_time TIMESTAMP WITH TIME ZONE;

-- 添加重复任务字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_frequency TEXT 
    CHECK (repeat_frequency IS NULL OR repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_weekdays INTEGER[];

-- 添加任务证明类型字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_type TEXT;

-- 验证添加的字段
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
    AND column_name IN (
        'task_start_time', 'task_end_time', 'start_date', 'end_date', 
        'repeat_frequency', 'repeat_time', 'repeat_weekdays', 'proof_type'
    )
ORDER BY column_name;

-- 检查完整的表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
