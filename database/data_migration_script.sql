-- 🔄 数据迁移脚本
-- 将现有tasks表的数据迁移到新的表结构中

-- ==========================================
-- 数据迁移前的准备工作
-- ==========================================

-- 1. 备份现有数据
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;

-- 2. 创建迁移日志表
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  message TEXT,
  record_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 迁移日志函数
CREATE OR REPLACE FUNCTION log_migration_step(
  step_name_param TEXT,
  status_param TEXT,
  message_param TEXT DEFAULT NULL,
  count_param INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO migration_log (step_name, status, message, record_count)
  VALUES (step_name_param, status_param, message_param, count_param);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 阶段1: 迁移一次性任务
-- ==========================================

DO $$
DECLARE
  once_task_count INTEGER := 0;
BEGIN
  -- 记录开始
  PERFORM log_migration_step('migrate_once_tasks', 'started', '开始迁移一次性任务');
  
  -- 迁移基础任务信息
  INSERT INTO base_tasks (
    id, title, description, points, creator_id, couple_id, 
    task_category, requires_proof, created_at, updated_at
  )
  SELECT 
    id, title, description, points, creator_id, couple_id,
    'once' as task_category,
    COALESCE(requires_proof, false) as requires_proof,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
  FROM tasks 
  WHERE repeat_type = 'once'
  ON CONFLICT (id) DO NOTHING;
  
  -- 迁移一次性任务特定信息
  INSERT INTO once_tasks (
    id, start_time, end_time, status, assignee_id,
    assigned_at, submitted_at, completed_at, proof_url, review_comment
  )
  SELECT 
    id,
    -- 🎯 时间字段映射逻辑
    CASE 
      WHEN task_start_time IS NOT NULL THEN task_start_time
      WHEN start_date IS NOT NULL THEN start_date::TIMESTAMPTZ
      ELSE NULL
    END as start_time,
    CASE 
      WHEN deadline IS NOT NULL THEN deadline
      WHEN task_end_time IS NOT NULL THEN task_end_time
      WHEN end_date IS NOT NULL THEN (end_date + INTERVAL '23 hours 59 minutes')::TIMESTAMPTZ
      ELSE NULL
    END as end_time,
    status,
    assignee_id,
    -- 执行记录（如果有的话）
    NULL as assigned_at,  -- 原表没有这个字段
    submitted_at,
    completed_at,
    proof_url,
    review_comment
  FROM tasks 
  WHERE repeat_type = 'once'
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS once_task_count = ROW_COUNT;
  
  -- 记录完成
  PERFORM log_migration_step('migrate_once_tasks', 'completed', 
    '一次性任务迁移完成', once_task_count);
    
EXCEPTION WHEN OTHERS THEN
  PERFORM log_migration_step('migrate_once_tasks', 'failed', SQLERRM);
  RAISE;
END $$;

-- ==========================================
-- 阶段2: 迁移重复任务
-- ==========================================

DO $$
DECLARE
  repeat_template_count INTEGER := 0;
  repeat_instance_count INTEGER := 0;
  task_record RECORD;
BEGIN
  -- 记录开始
  PERFORM log_migration_step('migrate_repeat_tasks', 'started', '开始迁移重复任务');
  
  -- 迁移重复任务模板
  FOR task_record IN 
    SELECT DISTINCT ON (title, creator_id, couple_id) *
    FROM tasks 
    WHERE repeat_type = 'repeat'
    ORDER BY title, creator_id, couple_id, created_at
  LOOP
    -- 迁移基础任务信息
    INSERT INTO base_tasks (
      id, title, description, points, creator_id, couple_id, 
      task_category, requires_proof, created_at, updated_at
    ) VALUES (
      task_record.id, task_record.title, task_record.description, 
      task_record.points, task_record.creator_id, task_record.couple_id,
      'repeat', COALESCE(task_record.requires_proof, false),
      COALESCE(task_record.created_at, NOW()),
      COALESCE(task_record.updated_at, NOW())
    ) ON CONFLICT (id) DO NOTHING;
    
    -- 迁移重复任务模板信息
    INSERT INTO repeat_task_templates (
      id, repeat_frequency, repeat_start_date, repeat_end_date,
      repeat_weekdays, repeat_time, is_active
    ) VALUES (
      task_record.id,
      COALESCE(task_record.repeat_frequency, 'daily'),
      COALESCE(task_record.start_date, CURRENT_DATE),
      task_record.end_date,
      task_record.repeat_weekdays,
      task_record.repeat_time,
      CASE WHEN task_record.status IN ('recruiting', 'assigned', 'in_progress') 
           THEN true ELSE false END
    ) ON CONFLICT (id) DO NOTHING;
    
    repeat_template_count := repeat_template_count + 1;
  END LOOP;
  
  -- 为现有的重复任务创建实例（基于现有的任务记录）
  INSERT INTO repeat_task_instances (
    template_id, instance_date, start_time, end_time, status, assignee_id,
    submitted_at, completed_at, proof_url, review_comment, is_auto_generated
  )
  SELECT 
    -- 找到对应的模板ID（基于title和creator匹配）
    (SELECT bt.id FROM base_tasks bt 
     JOIN repeat_task_templates rtt ON bt.id = rtt.id
     WHERE bt.title = t.title AND bt.creator_id = t.creator_id 
     LIMIT 1) as template_id,
    COALESCE(t.start_date, CURRENT_DATE) as instance_date,
    t.task_start_time as start_time,
    CASE 
      WHEN t.deadline IS NOT NULL THEN t.deadline
      WHEN t.task_end_time IS NOT NULL THEN t.task_end_time
      ELSE NULL
    END as end_time,
    t.status,
    t.assignee_id,
    t.submitted_at,
    t.completed_at,
    t.proof_url,
    t.review_comment,
    false as is_auto_generated  -- 这些是从原有数据迁移的，不是自动生成的
  FROM tasks t
  WHERE t.repeat_type = 'repeat'
    AND (SELECT bt.id FROM base_tasks bt 
         JOIN repeat_task_templates rtt ON bt.id = rtt.id
         WHERE bt.title = t.title AND bt.creator_id = t.creator_id 
         LIMIT 1) IS NOT NULL
  ON CONFLICT (template_id, instance_date) DO NOTHING;
  
  GET DIAGNOSTICS repeat_instance_count = ROW_COUNT;
  
  -- 记录完成
  PERFORM log_migration_step('migrate_repeat_tasks', 'completed', 
    FORMAT('重复任务迁移完成：%s个模板，%s个实例', repeat_template_count, repeat_instance_count));
    
EXCEPTION WHEN OTHERS THEN
  PERFORM log_migration_step('migrate_repeat_tasks', 'failed', SQLERRM);
  RAISE;
END $$;

-- ==========================================
-- 阶段3: 迁移习惯任务
-- ==========================================

DO $$
DECLARE
  habit_task_count INTEGER := 0;
BEGIN
  -- 记录开始
  PERFORM log_migration_step('migrate_habit_tasks', 'started', '开始迁移习惯任务');
  
  -- 迁移习惯任务（如果原表中有task_type = 'habit'的记录）
  INSERT INTO base_tasks (
    id, title, description, points, creator_id, couple_id, 
    task_category, requires_proof, created_at, updated_at
  )
  SELECT 
    id, title, description, points, creator_id, couple_id,
    'habit' as task_category,
    COALESCE(requires_proof, false) as requires_proof,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
  FROM tasks 
  WHERE task_type = 'habit'
  ON CONFLICT (id) DO NOTHING;
  
  -- 迁移习惯任务特定信息
  INSERT INTO habit_tasks (
    id, duration_type, duration_days, challenge_start_date, challenge_end_date, status
  )
  SELECT 
    id,
    -- 根据现有数据推断持续时间类型
    CASE 
      WHEN end_date - start_date <= 21 THEN '21days'
      WHEN end_date - start_date <= 30 THEN '30days'
      WHEN end_date - start_date <= 90 THEN '90days'
      ELSE '365days'
    END as duration_type,
    COALESCE(end_date - start_date + 1, 21) as duration_days,
    COALESCE(start_date, CURRENT_DATE) as challenge_start_date,
    COALESCE(end_date, CURRENT_DATE + INTERVAL '21 days') as challenge_end_date,
    CASE 
      WHEN status IN ('recruiting', 'assigned') THEN 'recruiting'
      WHEN status IN ('in_progress') THEN 'active'
      WHEN status = 'completed' THEN 'completed'
      ELSE 'cancelled'
    END as status
  FROM tasks 
  WHERE task_type = 'habit'
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS habit_task_count = ROW_COUNT;
  
  -- 记录完成
  PERFORM log_migration_step('migrate_habit_tasks', 'completed', 
    '习惯任务迁移完成', habit_task_count);
    
EXCEPTION WHEN OTHERS THEN
  PERFORM log_migration_step('migrate_habit_tasks', 'failed', SQLERRM);
  RAISE;
END $$;

-- ==========================================
-- 阶段4: 数据验证和清理
-- ==========================================

DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
  validation_result TEXT;
BEGIN
  -- 记录开始
  PERFORM log_migration_step('data_validation', 'started', '开始数据验证');
  
  -- 统计原始数据
  SELECT COUNT(*) INTO original_count FROM tasks;
  
  -- 统计迁移后的数据
  SELECT COUNT(*) INTO migrated_count FROM unified_task_list;
  
  -- 验证数据完整性
  IF migrated_count >= original_count * 0.95 THEN  -- 允许5%的数据差异（可能是重复数据等）
    validation_result := FORMAT('数据验证通过：原始%s条，迁移%s条', original_count, migrated_count);
    PERFORM log_migration_step('data_validation', 'completed', validation_result);
  ELSE
    validation_result := FORMAT('数据验证失败：原始%s条，迁移%s条，差异过大', original_count, migrated_count);
    PERFORM log_migration_step('data_validation', 'failed', validation_result);
    RAISE EXCEPTION '%', validation_result;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  PERFORM log_migration_step('data_validation', 'failed', SQLERRM);
  RAISE;
END $$;

-- ==========================================
-- 阶段5: 创建迁移后的便利视图
-- ==========================================

-- 创建兼容性视图，保持与原tasks表相同的接口
CREATE OR REPLACE VIEW tasks_compatible AS
SELECT 
  id,
  title,
  description,
  points,
  creator_id,
  couple_id,
  requires_proof,
  created_at,
  updated_at,
  status,
  assignee_id,
  start_time as task_start_time,
  end_time as deadline,
  start_time::DATE as start_date,
  end_time::DATE as end_date,
  task_type,
  CASE 
    WHEN task_category = 'once' THEN 'once'
    WHEN task_category = 'repeat' THEN 'repeat'
    WHEN task_category = 'habit' THEN 'repeat'
  END as repeat_type,
  proof_url,
  review_comment
FROM unified_task_list;

-- ==========================================
-- 完成报告
-- ==========================================

DO $$
DECLARE
  log_record RECORD;
  total_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE '🎉 数据迁移完成报告';
  RAISE NOTICE '==========================================';
  
  -- 显示迁移日志
  FOR log_record IN 
    SELECT step_name, status, message, record_count, created_at 
    FROM migration_log 
    ORDER BY created_at
  LOOP
    RAISE NOTICE '[%] %: % (% 条记录)', 
      log_record.created_at::TIME, 
      log_record.step_name, 
      log_record.message, 
      COALESCE(log_record.record_count, 0);
    
    IF log_record.status = 'completed' AND log_record.record_count IS NOT NULL THEN
      total_migrated := total_migrated + log_record.record_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📊 迁移统计：';
  RAISE NOTICE '   总迁移记录数：% 条', total_migrated;
  RAISE NOTICE '   基础任务表：% 条', (SELECT COUNT(*) FROM base_tasks);
  RAISE NOTICE '   一次性任务：% 条', (SELECT COUNT(*) FROM once_tasks);
  RAISE NOTICE '   重复任务模板：% 条', (SELECT COUNT(*) FROM repeat_task_templates);
  RAISE NOTICE '   重复任务实例：% 条', (SELECT COUNT(*) FROM repeat_task_instances);
  RAISE NOTICE '   习惯任务：% 条', (SELECT COUNT(*) FROM habit_tasks);
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ 数据迁移成功完成！';
  RAISE NOTICE '🔧 下一步：更新应用代码以使用新的表结构';
  RAISE NOTICE '📝 备份数据保存在 tasks_backup 表中';
  RAISE NOTICE '🔍 可以通过 unified_task_list 视图查看所有任务';
  RAISE NOTICE '🔄 可以通过 tasks_compatible 视图保持向后兼容';
END $$;
