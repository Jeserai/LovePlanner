-- 🔧 Supabase 安全修复脚本
-- 修复 completion_record 数据格式，处理 null 值情况

-- 📊 第一步：全面分析数据状态
SELECT 
    '数据分析报告' as report_type,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completion_record IS NULL THEN 1 END) as null_records,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '{%' THEN 1 END) as object_format,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '[%' THEN 1 END) as array_format,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text NOT LIKE '{%' AND completion_record::text NOT LIKE '[%' THEN 1 END) as other_format
FROM tasks;

-- 📋 第二步：查看需要修复的具体数据
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    CASE 
        WHEN completion_record IS NULL THEN '⚪ NULL (无需修复)'
        WHEN completion_record::text LIKE '{%' THEN '🔴 需要修复 (对象格式)'
        WHEN completion_record::text LIKE '[%' THEN '✅ 格式正确 (数组格式)'
        ELSE '❓ 未知格式'
    END as status
FROM tasks 
ORDER BY 
    CASE 
        WHEN completion_record IS NULL THEN 1
        WHEN completion_record::text LIKE '[%' THEN 2
        WHEN completion_record::text LIKE '{%' THEN 3
        ELSE 4
    END, title;

-- ⚠️ 第三步：安全修复 - 只处理对象格式的非空记录
-- 这个查询只会修复有问题的记录，不会影响 NULL 值

UPDATE tasks 
SET completion_record = (
    SELECT jsonb_agg(key ORDER BY key)
    FROM jsonb_object_keys(completion_record) AS key
    WHERE (completion_record ->> key)::boolean = true
)
WHERE completion_record IS NOT NULL 
AND completion_record::text LIKE '{%'
AND jsonb_typeof(completion_record) = 'object';

-- 🔄 第四步：修复 completed_count - 只处理有记录的任务
UPDATE tasks 
SET completed_count = jsonb_array_length(completion_record)
WHERE completion_record IS NOT NULL
AND jsonb_typeof(completion_record) = 'array';

-- ✅ 第五步：验证修复结果
SELECT 
    '修复结果验证' as verification_type,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completion_record IS NULL THEN 1 END) as null_records,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '{%' THEN 1 END) as remaining_object_format,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '[%' THEN 1 END) as array_format_count,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completed_count = jsonb_array_length(completion_record) THEN 1 END) as consistent_records
FROM tasks;

-- 📊 第六步：详细验证 - 显示可能的问题记录
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    CASE 
        WHEN completion_record IS NULL THEN jsonb_array_length('[]'::jsonb)
        ELSE jsonb_array_length(completion_record)
    END as actual_record_count,
    CASE 
        WHEN completion_record IS NULL AND completed_count = 0 THEN '✅ NULL记录正确'
        WHEN completion_record IS NOT NULL AND completed_count = jsonb_array_length(completion_record) THEN '✅ 数据一致'
        ELSE '❌ 需要检查'
    END as consistency_status
FROM tasks 
WHERE completion_record IS NOT NULL OR completed_count > 0
ORDER BY consistency_status, title;

-- 🎯 第七步：如果有不一致的记录，可以单独修复
-- 修复那些 completion_record 为 NULL 但 completed_count > 0 的记录
UPDATE tasks 
SET completed_count = 0
WHERE completion_record IS NULL 
AND completed_count > 0;

-- 📈 第八步：最终报告
SELECT 
    '🎉 最终修复报告' as final_report,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completion_record IS NULL THEN 1 END) as null_records,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '[%' THEN 1 END) as array_format_tasks,
    COUNT(CASE WHEN completion_record IS NOT NULL AND completion_record::text LIKE '{%' THEN 1 END) as remaining_object_format,
    COUNT(CASE 
        WHEN completion_record IS NULL AND completed_count = 0 THEN 1
        WHEN completion_record IS NOT NULL AND completed_count = jsonb_array_length(completion_record) THEN 1
    END) as consistent_tasks,
    ROUND(
        COUNT(CASE 
            WHEN completion_record IS NULL AND completed_count = 0 THEN 1
            WHEN completion_record IS NOT NULL AND completed_count = jsonb_array_length(completion_record) THEN 1
        END) * 100.0 / COUNT(*), 
        2
    ) as consistency_percentage
FROM tasks;

-- 💡 说明：
-- - NULL 记录是正常的，表示任务还没有完成记录
-- - 只有对象格式 {...} 的记录需要转换为数组格式 [...]
-- - completed_count 应该与记录数组长度一致，NULL 记录的 completed_count 应该为 0
