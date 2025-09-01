-- 🔧 修复"Forever测试任务"的数据不一致问题

-- 1. 首先查看当前的数据状态
SELECT 
    '🔍 修复前的数据状态' as status,
    title,
    completed_count,
    current_streak,
    longest_streak,
    jsonb_array_length(completion_record::jsonb) as actual_records,
    completion_record
FROM tasks 
WHERE title = 'Forever测试任务';

-- 2. 分析打卡记录的连续性
WITH record_analysis AS (
    SELECT 
        title,
        completion_record::jsonb as records,
        jsonb_array_length(completion_record::jsonb) as total_records
    FROM tasks 
    WHERE title = 'Forever测试任务'
),
expanded_records AS (
    SELECT 
        title,
        jsonb_array_elements_text(records) as record_date
    FROM record_analysis
),
sorted_records AS (
    SELECT 
        title,
        record_date,
        LAG(record_date::date) OVER (ORDER BY record_date::date) as prev_date,
        record_date::date - LAG(record_date::date) OVER (ORDER BY record_date::date) as day_diff,
        ROW_NUMBER() OVER (ORDER BY record_date::date DESC) as reverse_order
    FROM expanded_records
)
SELECT 
    '📊 打卡记录分析' as analysis,
    record_date,
    CASE 
        WHEN prev_date IS NULL THEN '首次记录'
        WHEN day_diff = 1 THEN '连续 ✅'
        WHEN day_diff > 1 THEN '中断 ❌ (间隔' || day_diff || '天)'
        ELSE '异常'
    END as continuity_status,
    reverse_order
FROM sorted_records
ORDER BY record_date::date;

-- 3. 计算正确的current_streak
-- 从最新记录开始向前计算连续天数
WITH record_analysis AS (
    SELECT 
        title,
        completion_record::jsonb as records
    FROM tasks 
    WHERE title = 'Forever测试任务'
),
expanded_records AS (
    SELECT 
        title,
        jsonb_array_elements_text(records) as record_date
    FROM record_analysis
),
sorted_records AS (
    SELECT 
        title,
        record_date,
        record_date::date as date_val,
        ROW_NUMBER() OVER (ORDER BY record_date::date DESC) as reverse_order
    FROM expanded_records
),
streak_calculation AS (
    SELECT 
        title,
        record_date,
        date_val,
        reverse_order,
        LAG(date_val) OVER (ORDER BY reverse_order) as next_date,
        CASE 
            WHEN reverse_order = 1 THEN 1  -- 最新记录算1次
            WHEN LAG(date_val) OVER (ORDER BY reverse_order) - date_val = 1 THEN 1  -- 连续
            ELSE 0  -- 不连续
        END as is_consecutive
    FROM sorted_records
)
SELECT 
    '🎯 连续次数计算' as calculation,
    title,
    SUM(is_consecutive) as correct_current_streak
FROM streak_calculation
WHERE is_consecutive = 1 OR reverse_order = 1
GROUP BY title;

-- 4. 执行修复
UPDATE tasks 
SET 
    current_streak = (
        -- 计算正确的连续次数
        WITH record_analysis AS (
            SELECT completion_record::jsonb as records
            FROM tasks t2 
            WHERE t2.id = tasks.id
        ),
        expanded_records AS (
            SELECT jsonb_array_elements_text(records) as record_date
            FROM record_analysis
        ),
        sorted_records AS (
            SELECT 
                record_date::date as date_val,
                ROW_NUMBER() OVER (ORDER BY record_date::date DESC) as reverse_order
            FROM expanded_records
        ),
        streak_calculation AS (
            SELECT 
                reverse_order,
                CASE 
                    WHEN reverse_order = 1 THEN 1
                    WHEN LAG(date_val) OVER (ORDER BY reverse_order) - date_val = 1 THEN 1
                    ELSE 0
                END as is_consecutive
            FROM sorted_records
        )
        SELECT COALESCE(SUM(is_consecutive), 0)
        FROM streak_calculation
        WHERE is_consecutive = 1
    ),
    longest_streak = GREATEST(
        longest_streak, 
        (
            -- 确保longest_streak不小于新的current_streak
            WITH record_analysis AS (
                SELECT completion_record::jsonb as records
                FROM tasks t2 
                WHERE t2.id = tasks.id
            ),
            expanded_records AS (
                SELECT jsonb_array_elements_text(records) as record_date
                FROM record_analysis
            ),
            sorted_records AS (
                SELECT 
                    record_date::date as date_val,
                    ROW_NUMBER() OVER (ORDER BY record_date::date DESC) as reverse_order
                FROM expanded_records
            ),
            streak_calculation AS (
                SELECT 
                    reverse_order,
                    CASE 
                        WHEN reverse_order = 1 THEN 1
                        WHEN LAG(date_val) OVER (ORDER BY reverse_order) - date_val = 1 THEN 1
                        ELSE 0
                    END as is_consecutive
                FROM sorted_records
            )
            SELECT COALESCE(SUM(is_consecutive), 0)
            FROM streak_calculation
            WHERE is_consecutive = 1
        )
    )
WHERE title = 'Forever测试任务';

-- 5. 验证修复结果
SELECT 
    '✅ 修复后的数据状态' as status,
    title,
    completed_count,
    current_streak,
    longest_streak,
    jsonb_array_length(completion_record::jsonb) as actual_records,
    CASE 
        WHEN completed_count = jsonb_array_length(completion_record::jsonb) THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as count_consistency,
    completion_record
FROM tasks 
WHERE title = 'Forever测试任务';

-- 6. 显示修复摘要
SELECT 
    '📋 修复摘要' as summary,
    '根据打卡记录分析，Forever测试任务的连续次数应该是4天' as explanation,
    '原因：记录中跳过了第5天，导致连续中断，当前连续段为最后4天' as reason;
