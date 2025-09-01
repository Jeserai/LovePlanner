-- 修复 completion_record 数据格式 (Supabase/PostgreSQL 兼容版本)
-- 将旧的对象格式 {"2024-01-01": true} 转换为新的数组格式 ["2024-01-01"]

-- 1. 首先查看需要修复的数据
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    CASE 
        WHEN completion_record::text LIKE '{%}' THEN '需要修复'
        WHEN completion_record::text LIKE '[%]' THEN '格式正确'
        ELSE '未知格式'
    END as status
FROM tasks 
WHERE completion_record IS NOT NULL
ORDER BY status, title;

-- 2. 统计需要修复的数据量
SELECT 
    CASE 
        WHEN completion_record::text LIKE '{%}' THEN '旧格式(对象)'
        WHEN completion_record::text LIKE '[%]' THEN '新格式(数组)'
        ELSE '其他格式'
    END as format_type,
    COUNT(*) as count
FROM tasks 
WHERE completion_record IS NOT NULL
GROUP BY format_type;

-- 3. 修复旧格式数据（PostgreSQL 版本）
-- 注意：请在执行前备份数据！

-- 创建临时函数来转换格式
CREATE OR REPLACE FUNCTION convert_completion_record(record_json TEXT)
RETURNS TEXT AS $$
DECLARE
    result_array TEXT[];
    key_record RECORD;
BEGIN
    -- 如果已经是数组格式，直接返回
    IF record_json LIKE '[%]' THEN
        RETURN record_json;
    END IF;
    
    -- 如果是对象格式，转换为数组
    IF record_json LIKE '{%}' THEN
        -- 提取所有值为 true 的键
        FOR key_record IN 
            SELECT key 
            FROM json_each_text(record_json::json) 
            WHERE value = 'true'
            ORDER BY key
        LOOP
            result_array := array_append(result_array, key_record.key);
        END LOOP;
        
        -- 转换为 JSON 数组字符串
        RETURN array_to_json(result_array)::TEXT;
    END IF;
    
    -- 其他情况返回空数组
    RETURN '[]';
END;
$$ LANGUAGE plpgsql;

-- 4. 执行修复（请谨慎执行！）
UPDATE tasks 
SET 
    completion_record = convert_completion_record(completion_record::text)::jsonb,
    completed_count = (
        SELECT array_length(
            ARRAY(
                SELECT key 
                FROM json_each_text(completion_record) 
                WHERE value = 'true'
            ), 1
        )
    )
WHERE completion_record IS NOT NULL 
AND completion_record::text LIKE '{%}';

-- 5. 验证修复结果
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    jsonb_array_length(completion_record) as record_length,
    CASE 
        WHEN completed_count = jsonb_array_length(completion_record) THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as consistency_check
FROM tasks 
WHERE completion_record IS NOT NULL
ORDER BY consistency_check DESC, title;

-- 6. 最终统计
SELECT 
    '修复完成统计' as summary,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completion_record::text LIKE '[%]' THEN 1 END) as array_format_count,
    COUNT(CASE WHEN completion_record::text LIKE '{%]' THEN 1 END) as object_format_count,
    COUNT(CASE WHEN completed_count = jsonb_array_length(completion_record) THEN 1 END) as consistent_count
FROM tasks 
WHERE completion_record IS NOT NULL;

-- 7. 清理临时函数
DROP FUNCTION IF EXISTS convert_completion_record(TEXT);
