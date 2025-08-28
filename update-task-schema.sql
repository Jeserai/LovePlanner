-- 更新任务表结构 - 完整的schema更新
-- 执行前请先备份数据库！

-- 1. 检查当前表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 添加缺失的时间范围字段（如果不存在）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_end_time TIMESTAMP WITH TIME ZONE;

-- 3. 添加缺失的重复任务字段（如果不存在）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_frequency TEXT CHECK (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_weekdays INTEGER[];

-- 4. 删除不必要的UI字段
-- has_specific_time 字段 - 可以通过 task_start_time IS NOT NULL 判断
ALTER TABLE tasks DROP COLUMN IF EXISTS has_specific_time;

-- duration 字段 - UI便利字段，应由前端计算
ALTER TABLE tasks DROP COLUMN IF EXISTS duration;

-- 3. 验证更新后的表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 显示优化后的核心字段列表
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 验证现有数据完整性
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
    deadline,
    task_start_time,
    task_end_time,
    start_date,
    end_date,
    repeat_frequency
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- 注释：优化后的字段说明
/*
保留的核心字段：

一次性任务 (repeat_type = 'once'):
- deadline: 任务截止时间（必需）
- task_start_time: 时间范围开始时间（可选，判断是否为时间范围模式）
- task_end_time: 时间范围结束时间（可选）

重复性任务 (repeat_type = 'repeat'):
- start_date: 重复开始日期（必需）
- end_date: 重复结束日期（必需）
- repeat_frequency: 重复频率（必需）
- repeat_time: 重复时间（可选）
- repeat_weekdays: 重复的星期（可选，用于weekly）

删除的UI字段：
- has_specific_time: 通过 task_start_time IS NOT NULL 判断
- duration: 前端通过 end_date - start_date 计算显示
*/
