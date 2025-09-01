-- 🎯 LovePlanner 测试数据生成脚本
-- 生成各种类型、状态的任务用于测试

-- 清理现有数据（如果需要）
-- DELETE FROM tasks;

-- 📊 生成测试数据
-- 注意：请根据你的实际 couple_id 和 user_id 修改下面的值

-- 假设的测试用户ID（请替换为实际值）
-- couple_id: 'test-couple-id'
-- user1_id: 'cat-user-id' (cat)
-- user2_id: 'cow-user-id' (cow)

-- 🏠 1. 日常任务 (daily) - 各种状态
INSERT INTO tasks (
    id, title, description, points, creator_id, couple_id, task_type, repeat_frequency,
    earliest_start_time, required_count, task_deadline, repeat_weekdays,
    daily_time_start, daily_time_end, status, assignee_id,
    completed_count, current_streak, longest_streak, completion_record,
    requires_proof, created_at, updated_at
) VALUES 
-- 1.1 招募中的日常任务
('task-001', '每日洗碗', '饭后及时清洗餐具，保持厨房整洁', 10, 'cat-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 7, '2025-01-15 23:59:59+00', NULL, '18:00', '22:00', 'recruiting', NULL,
 0, 0, 0, NULL, false, NOW(), NOW()),

-- 1.2 已领取的日常任务
('task-002', '每日健身', '每天至少运动30分钟', 15, 'cow-user-id', 'test-couple-id', 'daily', 'daily',
 '2025-01-01 06:00:00+00', 21, '2025-01-31 23:59:59+00', NULL, '06:00', '08:00', 'assigned', 'cat-user-id',
 0, 0, 0, NULL, true, NOW(), NOW()),

-- 1.3 进行中的日常任务（有打卡记录）
('task-003', '每日阅读', '每天阅读至少30分钟', 12, 'cat-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 14, NULL, NULL, NULL, NULL, 'in_progress', 'cow-user-id',
 5, 3, 5, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-05", "2025-01-06"]', false, NOW(), NOW()),

-- 1.4 已完成的日常任务
('task-004', '每日喝水', '每天喝足8杯水', 8, 'cow-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 7, NULL, NULL, NULL, NULL, 'completed', 'cat-user-id',
 7, 7, 7, '["2024-12-25", "2024-12-26", "2024-12-27", "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31"]', false, NOW(), NOW()),

-- 🎯 2. 习惯任务 (habit) - 各种频率
-- 2.1 每周任务
('task-005', '每周大扫除', '每周进行一次全屋大扫除', 25, 'cat-user-id', 'test-couple-id', 'habit', 'weekly',
 NULL, 4, '2025-02-28 23:59:59+00', '[1]', NULL, NULL, 'assigned', 'cow-user-id',
 2, 2, 2, '["2025-W01", "2025-W02"]', true, NOW(), NOW()),

-- 2.2 每月任务
('task-006', '每月理财规划', '每月制定和回顾理财计划', 30, 'cow-user-id', 'test-couple-id', 'habit', 'monthly',
 NULL, 3, NULL, NULL, NULL, NULL, 'in_progress', 'cat-user-id',
 1, 1, 1, '["2024-12"]', false, NOW(), NOW()),

-- 2.3 双周任务
('task-007', '双周约会', '每两周安排一次浪漫约会', 50, 'cat-user-id', 'test-couple-id', 'habit', 'biweekly',
 NULL, 6, NULL, NULL, NULL, NULL, 'recruiting', NULL,
 0, 0, 0, NULL, true, NOW(), NOW()),

-- 🌟 3. 特殊任务 (special) - 一次性任务
-- 3.1 限时特殊任务
('task-008', '准备生日惊喜', '为对方准备一个难忘的生日惊喜', 100, 'cow-user-id', 'test-couple-id', 'special', 'never',
 '2025-01-10 00:00:00+00', NULL, '2025-01-20 23:59:59+00', NULL, NULL, NULL, 'assigned', 'cat-user-id',
 0, 0, 0, NULL, true, NOW(), NOW()),

-- 3.2 无限时特殊任务
('task-009', '学习新技能', '学会一项新的生活技能', 80, 'cat-user-id', 'test-couple-id', 'special', 'never',
 NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress', 'cow-user-id',
 1, 1, 1, '["2025-01-05"]', false, NOW(), NOW()),

-- 3.3 已完成的特殊任务
('task-010', '装饰新家', '一起装饰我们的新家', 150, 'cow-user-id', 'test-couple-id', 'special', 'never',
 NULL, NULL, NULL, NULL, NULL, NULL, 'completed', 'cat-user-id',
 1, 1, 1, '["2024-12-20"]', true, NOW(), NOW()),

-- 🔄 4. Forever 任务 - 无限重复
-- 4.1 每日 forever 任务
('task-011', '每日说我爱你', '每天对彼此说"我爱你"', 5, 'cat-user-id', 'test-couple-id', 'habit', 'daily',
 NULL, NULL, NULL, NULL, NULL, NULL, 'in_progress', 'cow-user-id',
 15, 5, 10, '["2024-12-20", "2024-12-21", "2024-12-22", "2024-12-23", "2024-12-24", "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31", "2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06"]', false, NOW(), NOW()),

-- 4.2 每周 forever 任务
('task-012', '每周约会夜', '每周至少一次约会夜', 20, 'cow-user-id', 'test-couple-id', 'habit', 'weekly',
 NULL, NULL, NULL, '[5]', '19:00', '23:00', 'assigned', 'cat-user-id',
 0, 0, 0, NULL, false, NOW(), NOW()),

-- 🚫 5. 已放弃的任务
('task-013', '每日冥想', '每天冥想15分钟', 10, 'cat-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 10, '2025-01-31 23:59:59+00', NULL, '06:00', '07:00', 'abandoned', 'cow-user-id',
 3, 0, 3, '["2024-12-28", "2024-12-29", "2024-12-30"]', false, NOW(), NOW()),

-- 📝 6. 需要审核的任务
('task-014', '整理书房', '把书房的书籍重新整理分类', 30, 'cow-user-id', 'test-couple-id', 'special', 'never',
 NULL, NULL, '2025-01-15 23:59:59+00', NULL, NULL, NULL, 'pending_review', 'cat-user-id',
 1, 1, 1, '["2025-01-06"]', true, NOW(), NOW()),

-- 🎮 7. 复杂场景任务
-- 7.1 工作日任务
('task-015', '工作日早餐', '工作日为对方准备营养早餐', 15, 'cat-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 5, NULL, '[1,2,3,4,5]', '06:30', '08:30', 'assigned', 'cow-user-id',
 0, 0, 0, NULL, true, NOW(), NOW()),

-- 7.2 周末任务
('task-016', '周末户外活动', '周末一起进行户外活动', 25, 'cow-user-id', 'test-couple-id', 'habit', 'weekly',
 NULL, 4, NULL, '[6,0]', '09:00', '18:00', 'recruiting', NULL,
 0, 0, 0, NULL, true, NOW(), NOW()),

-- 7.3 年度任务
('task-017', '年度旅行', '每年至少一次长途旅行', 200, 'cat-user-id', 'test-couple-id', 'habit', 'yearly',
 NULL, 3, NULL, NULL, NULL, NULL, 'assigned', 'cow-user-id',
 1, 1, 1, '["2024"]', true, NOW(), NOW()),

-- 🔥 8. 高难度连续任务
('task-018', '30天挑战', '连续30天早起锻炼', 50, 'cow-user-id', 'test-couple-id', 'habit', 'daily',
 '2025-01-01 05:30:00+00', 30, '2025-02-15 23:59:59+00', NULL, '05:30', '06:30', 'in_progress', 'cat-user-id',
 18, 8, 12, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10", "2025-01-11", "2025-01-12", "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18", "2025-01-19", "2025-01-20"]', true, NOW(), NOW()),

-- 🎊 9. 即将过期的任务
('task-019', '新年准备', '准备新年庆祝活动', 60, 'cat-user-id', 'test-couple-id', 'special', 'never',
 NULL, NULL, '2025-01-10 23:59:59+00', NULL, NULL, NULL, 'assigned', 'cow-user-id',
 0, 0, 0, NULL, false, NOW(), NOW()),

-- 🌙 10. 夜间任务
('task-020', '睡前聊天', '每晚睡前聊天15分钟', 8, 'cow-user-id', 'test-couple-id', 'daily', 'daily',
 NULL, 14, NULL, NULL, '21:30', '23:00', 'in_progress', 'cat-user-id',
 7, 4, 7, '["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-06", "2025-01-07", "2025-01-08"]', false, NOW(), NOW());

-- 📊 插入完成后的统计信息
SELECT 
    '📊 测试数据生成完成' as status,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_type = 'daily' THEN 1 END) as daily_tasks,
    COUNT(CASE WHEN task_type = 'habit' THEN 1 END) as habit_tasks,
    COUNT(CASE WHEN task_type = 'special' THEN 1 END) as special_tasks,
    COUNT(CASE WHEN status = 'recruiting' THEN 1 END) as recruiting,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned,
    COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review
FROM tasks;
