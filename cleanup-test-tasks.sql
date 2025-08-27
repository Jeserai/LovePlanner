-- 清理测试任务数据的脚本（可选使用）

-- 显示当前任务统计
SELECT 
    '=== 清理前任务统计 ===' as info;
    
SELECT 
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_created,
    COUNT(CASE WHEN title LIKE '%测试%' OR description LIKE '%测试%' THEN 1 END) as test_tasks
FROM tasks;

-- 可选：删除所有测试任务（谨慎使用）
-- 注释掉的删除命令，需要手动取消注释才会执行

/*
-- 删除今天创建的所有任务
DELETE FROM tasks 
WHERE created_at >= CURRENT_DATE;

-- 或者删除特定的测试任务
DELETE FROM tasks 
WHERE title IN (
    '收拾客厅', '购买生日礼物', '准备周末晚餐', '修理台灯',
    '学习新菜谱', '整理照片', '清洁浴室', '制作惊喜视频',
    '订购鲜花', '购买电影票', '学习吉他', '组织聚会',
    '紧急修理水龙头', '准备重要文件'
);
*/

-- 查看清理后的统计（如果执行了删除操作）
SELECT 
    '=== 清理后任务统计 ===' as info;
    
SELECT 
    COUNT(*) as remaining_tasks,
    STRING_AGG(DISTINCT status, ', ') as remaining_statuses
FROM tasks;

-- 重置任务ID序列（如果需要）
-- SELECT setval('tasks_id_seq', 1, false);
