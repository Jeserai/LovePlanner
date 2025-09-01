-- 🔧 Supabase 简单修复脚本
-- 修复 completion_record 数据格式不一致问题

-- 📊 第一步：查看当前数据状态
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    CASE 
        WHEN completion_record::text LIKE '{%' THEN '🔴 需要修复 (对象格式)'
        WHEN completion_record::text LIKE '[%' THEN '✅ 格式正确 (数组格式)'
        ELSE '❓ 未知格式'
    END as status
FROM tasks 
WHERE completion_record IS NOT NULL
ORDER BY status, title;

-- 📈 第二步：统计需要修复的数量
SELECT 
    CASE 
        WHEN completion_record::text LIKE '{%' THEN '🔴 旧格式(对象)'
        WHEN completion_record::text LIKE '[%' THEN '✅ 新格式(数组)'
        ELSE '❓ 其他格式'
    END as format_type,
    COUNT(*) as count
FROM tasks 
WHERE completion_record IS NOT NULL
GROUP BY format_type;

-- ⚠️ 第三步：备份提醒
-- 请确保已经备份了数据库！
-- 如果没有备份，请先执行：
-- pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

-- 🛠️ 第四步：执行修复
-- 这个查询会将旧格式 {"2024-01-01": true} 转换为新格式 ["2024-01-01"]

UPDATE tasks 
SET completion_record = (
    SELECT jsonb_agg(key ORDER BY key)
    FROM jsonb_object_keys(completion_record) AS key
    WHERE (completion_record ->> key)::boolean = true
)
WHERE completion_record IS NOT NULL 
AND completion_record::text LIKE '{%';

-- 🔄 第五步：修复 completed_count 字段
UPDATE tasks 
SET completed_count = jsonb_array_length(completion_record)
WHERE completion_record IS NOT NULL
AND jsonb_typeof(completion_record) = 'array';

-- ✅ 第六步：验证修复结果
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    jsonb_array_length(completion_record) as actual_record_count,
    CASE 
        WHEN completed_count = jsonb_array_length(completion_record) THEN '✅ 数据一致'
        ELSE '❌ 数据不一致'
    END as consistency_status
FROM tasks 
WHERE completion_record IS NOT NULL
ORDER BY consistency_status, title;

-- 📊 第七步：最终统计报告
SELECT 
    '📊 修复完成报告' as report_title,
    COUNT(*) as total_tasks_with_records,
    COUNT(CASE WHEN completion_record::text LIKE '[%' THEN 1 END) as array_format_tasks,
    COUNT(CASE WHEN completion_record::text LIKE '{%' THEN 1 END) as remaining_object_format,
    COUNT(CASE WHEN completed_count = jsonb_array_length(completion_record) THEN 1 END) as consistent_tasks,
    ROUND(
        COUNT(CASE WHEN completed_count = jsonb_array_length(completion_record) THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as consistency_percentage
FROM tasks 
WHERE completion_record IS NOT NULL;

-- 🎉 如果 remaining_object_format = 0 且 consistency_percentage = 100，则修复成功！
