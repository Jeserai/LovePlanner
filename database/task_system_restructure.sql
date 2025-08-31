-- 🗄️ 任务系统数据库重构脚本
-- 将现有的混合任务表重构为专门的任务类型表

-- ==========================================
-- 阶段1: 创建新的表结构
-- ==========================================

-- 1. 基础任务表 - 所有任务的公共信息
CREATE TABLE IF NOT EXISTS base_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  task_category TEXT NOT NULL CHECK (task_category IN ('once', 'repeat', 'habit')),
  requires_proof BOOLEAN DEFAULT FALSE,
  proof_type TEXT CHECK (proof_type IN ('photo', 'text', 'file')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 一次性任务表
CREATE TABLE IF NOT EXISTS once_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  
  -- 🎯 时间约束（支持四种组合）
  start_time TIMESTAMPTZ,           -- 最早开始时间（可选）
  end_time TIMESTAMPTZ,             -- 最晚完成时间（可选）
  
  -- 🎯 任务状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'assigned', 'in_progress', 'pending_review', 'completed', 'abandoned')
  ),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 🎯 执行记录
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  review_comment TEXT
);

-- 3. 重复任务模板表
CREATE TABLE IF NOT EXISTS repeat_task_templates (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  
  -- 🎯 重复周期配置
  repeat_frequency TEXT NOT NULL CHECK (
    repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')
  ),
  repeat_start_date DATE NOT NULL,
  repeat_end_date DATE,             -- NULL表示无限重复
  
  -- 🎯 重复细节
  repeat_weekdays INTEGER[],        -- [1,2,5] 周一、周二、周五
  repeat_time TIME,                 -- 每次任务的建议时间
  
  -- 🎯 实例时间约束模板
  instance_start_offset INTERVAL,   -- 相对于重复日期的开始偏移
  instance_end_offset INTERVAL,     -- 相对于重复日期的结束偏移
  
  -- 🎯 调度状态
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_date DATE,         -- 最后生成实例的日期
  
  -- 🎯 自动发布设置
  auto_publish BOOLEAN DEFAULT TRUE,
  publish_days_ahead INTEGER DEFAULT 1  -- 提前几天发布任务实例
);

-- 4. 重复任务实例表
CREATE TABLE IF NOT EXISTS repeat_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES repeat_task_templates(id) ON DELETE CASCADE,
  
  -- 🎯 实例特定信息
  instance_date DATE NOT NULL,      -- 这个实例对应的日期
  start_time TIMESTAMPTZ,           -- 这个实例的开始时间
  end_time TIMESTAMPTZ,             -- 这个实例的结束时间
  
  -- 🎯 实例状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'assigned', 'in_progress', 'pending_review', 'completed', 'abandoned', 'skipped')
  ),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 🎯 执行记录
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  review_comment TEXT,
  
  -- 🎯 实例元数据
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, instance_date)
);

-- 5. 习惯任务表
CREATE TABLE IF NOT EXISTS habit_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  
  -- 🎯 挑战配置
  duration_type TEXT NOT NULL CHECK (duration_type IN ('21days', '30days', '90days', '365days')),
  duration_days INTEGER NOT NULL,   -- 实际天数，便于计算
  
  -- 🎯 挑战时间范围
  challenge_start_date DATE NOT NULL,
  challenge_end_date DATE NOT NULL,
  
  -- 🎯 参与规则（简化版，移除复杂参数）
  max_participants INTEGER,         -- 最大参与人数（NULL表示无限制）
  allow_restart BOOLEAN DEFAULT TRUE,
  
  -- 🎯 状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'active', 'completed', 'cancelled')
  ),
  
  -- 🎯 统计信息
  total_participants INTEGER DEFAULT 0,
  active_participants INTEGER DEFAULT 0,
  completed_participants INTEGER DEFAULT 0
);

-- 6. 个人习惯挑战表
CREATE TABLE IF NOT EXISTS personal_habit_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_task_id UUID NOT NULL REFERENCES habit_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 🎯 个人挑战时间
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  personal_start_date DATE NOT NULL,
  personal_end_date DATE NOT NULL,
  
  -- 🎯 挑战状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'abandoned', 'paused')
  ),
  
  -- 🎯 进度统计
  total_days INTEGER NOT NULL,
  completed_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- 🎯 重启记录
  restart_count INTEGER DEFAULT 0,
  last_restart_date DATE,
  
  -- 🎯 完成记录
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  
  UNIQUE(habit_task_id, user_id)
);

-- 7. 习惯打卡记录表
CREATE TABLE IF NOT EXISTS habit_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES personal_habit_challenges(id) ON DELETE CASCADE,
  
  -- 🎯 打卡信息
  check_in_date DATE NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 🎯 打卡内容
  notes TEXT,
  proof_url TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  
  -- 🎯 元数据
  streak_day INTEGER NOT NULL,      -- 这是连续的第几天
  is_makeup BOOLEAN DEFAULT FALSE,  -- 是否是补打卡
  
  UNIQUE(challenge_id, check_in_date)
);

-- ==========================================
-- 阶段2: 创建索引
-- ==========================================

-- 基础任务表索引
CREATE INDEX IF NOT EXISTS idx_base_tasks_couple_creator ON base_tasks(couple_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_base_tasks_category ON base_tasks(task_category);
CREATE INDEX IF NOT EXISTS idx_base_tasks_created_at ON base_tasks(created_at DESC);

-- 一次性任务表索引
CREATE INDEX IF NOT EXISTS idx_once_tasks_status ON once_tasks(status);
CREATE INDEX IF NOT EXISTS idx_once_tasks_assignee ON once_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_once_tasks_time_range ON once_tasks(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_once_tasks_status_time ON once_tasks(status, end_time);

-- 重复任务模板表索引
CREATE INDEX IF NOT EXISTS idx_repeat_templates_active ON repeat_task_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_repeat_templates_schedule ON repeat_task_templates(repeat_start_date, repeat_end_date);
CREATE INDEX IF NOT EXISTS idx_repeat_templates_frequency ON repeat_task_templates(repeat_frequency);

-- 重复任务实例表索引
CREATE INDEX IF NOT EXISTS idx_repeat_instances_template_date ON repeat_task_instances(template_id, instance_date);
CREATE INDEX IF NOT EXISTS idx_repeat_instances_status ON repeat_task_instances(status);
CREATE INDEX IF NOT EXISTS idx_repeat_instances_assignee ON repeat_task_instances(assignee_id);
CREATE INDEX IF NOT EXISTS idx_repeat_instances_date_status ON repeat_task_instances(instance_date, status);

-- 习惯任务表索引
CREATE INDEX IF NOT EXISTS idx_habit_tasks_challenge_period ON habit_tasks(challenge_start_date, challenge_end_date);
CREATE INDEX IF NOT EXISTS idx_habit_tasks_status ON habit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_habit_tasks_duration ON habit_tasks(duration_type);

-- 个人习惯挑战表索引
CREATE INDEX IF NOT EXISTS idx_personal_challenges_user ON personal_habit_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_challenges_habit ON personal_habit_challenges(habit_task_id);
CREATE INDEX IF NOT EXISTS idx_personal_challenges_status ON personal_habit_challenges(status);
CREATE INDEX IF NOT EXISTS idx_personal_challenges_user_status ON personal_habit_challenges(user_id, status);

-- 习惯打卡记录表索引
CREATE INDEX IF NOT EXISTS idx_habit_checkins_challenge_date ON habit_check_ins(challenge_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date ON habit_check_ins(check_in_date DESC);

-- ==========================================
-- 阶段3: 创建视图和函数
-- ==========================================

-- 统一任务列表视图
CREATE OR REPLACE VIEW unified_task_list AS
-- 一次性任务
SELECT 
  bt.id,
  bt.title,
  bt.description,
  bt.points,
  bt.creator_id,
  bt.couple_id,
  bt.task_category,
  bt.requires_proof,
  bt.created_at,
  bt.updated_at,
  ot.status,
  ot.assignee_id,
  ot.start_time,
  ot.end_time,
  NULL::DATE as instance_date,
  NULL::UUID as template_id,
  ot.proof_url,
  ot.review_comment,
  'once' as task_type
FROM base_tasks bt
JOIN once_tasks ot ON bt.id = ot.id
WHERE bt.task_category = 'once'

UNION ALL

-- 重复任务实例
SELECT 
  bt.id,
  bt.title,
  bt.description,
  bt.points,
  bt.creator_id,
  bt.couple_id,
  bt.task_category,
  bt.requires_proof,
  bt.created_at,
  bt.updated_at,
  rti.status,
  rti.assignee_id,
  rti.start_time,
  rti.end_time,
  rti.instance_date,
  rti.template_id,
  rti.proof_url,
  rti.review_comment,
  'repeat_instance' as task_type
FROM base_tasks bt
JOIN repeat_task_templates rtt ON bt.id = rtt.id
JOIN repeat_task_instances rti ON rtt.id = rti.template_id
WHERE bt.task_category = 'repeat'

UNION ALL

-- 习惯任务
SELECT 
  bt.id,
  bt.title,
  bt.description,
  bt.points,
  bt.creator_id,
  bt.couple_id,
  bt.task_category,
  bt.requires_proof,
  bt.created_at,
  bt.updated_at,
  ht.status,
  NULL::UUID as assignee_id,
  ht.challenge_start_date::TIMESTAMPTZ as start_time,
  ht.challenge_end_date::TIMESTAMPTZ as end_time,
  NULL::DATE as instance_date,
  NULL::UUID as template_id,
  NULL::TEXT as proof_url,
  NULL::TEXT as review_comment,
  'habit' as task_type
FROM base_tasks bt
JOIN habit_tasks ht ON bt.id = ht.id
WHERE bt.task_category = 'habit';

-- 重复任务实例生成函数
CREATE OR REPLACE FUNCTION generate_repeat_task_instances(
  template_id_param UUID,
  start_date_param DATE,
  end_date_param DATE
) RETURNS INTEGER AS $$
DECLARE
  template_record RECORD;
  current_date DATE;
  instance_count INTEGER := 0;
  weekday_num INTEGER;
BEGIN
  -- 获取模板信息
  SELECT * INTO template_record
  FROM repeat_task_templates rtt
  JOIN base_tasks bt ON rtt.id = bt.id
  WHERE rtt.id = template_id_param AND rtt.is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  current_date := start_date_param;
  
  WHILE current_date <= end_date_param LOOP
    -- 检查是否应该在这一天创建实例
    CASE template_record.repeat_frequency
      WHEN 'daily' THEN
        -- 每日任务：直接创建
        INSERT INTO repeat_task_instances (
          template_id, instance_date, start_time, end_time
        ) VALUES (
          template_id_param,
          current_date,
          CASE WHEN template_record.instance_start_offset IS NOT NULL 
               THEN current_date::TIMESTAMPTZ + template_record.instance_start_offset
               ELSE NULL END,
          CASE WHEN template_record.instance_end_offset IS NOT NULL 
               THEN current_date::TIMESTAMPTZ + template_record.instance_end_offset
               ELSE NULL END
        ) ON CONFLICT (template_id, instance_date) DO NOTHING;
        
        instance_count := instance_count + 1;
        
      WHEN 'weekly' THEN
        -- 每周任务：检查星期几
        weekday_num := EXTRACT(DOW FROM current_date); -- 0=Sunday, 1=Monday, ...
        weekday_num := CASE WHEN weekday_num = 0 THEN 7 ELSE weekday_num END; -- 转换为1=Monday, 7=Sunday
        
        IF template_record.repeat_weekdays IS NULL OR weekday_num = ANY(template_record.repeat_weekdays) THEN
          INSERT INTO repeat_task_instances (
            template_id, instance_date, start_time, end_time
          ) VALUES (
            template_id_param,
            current_date,
            CASE WHEN template_record.instance_start_offset IS NOT NULL 
                 THEN current_date::TIMESTAMPTZ + template_record.instance_start_offset
                 ELSE NULL END,
            CASE WHEN template_record.instance_end_offset IS NOT NULL 
                 THEN current_date::TIMESTAMPTZ + template_record.instance_end_offset
                 ELSE NULL END
          ) ON CONFLICT (template_id, instance_date) DO NOTHING;
          
          instance_count := instance_count + 1;
        END IF;
        
      -- 可以添加其他频率的处理逻辑
    END CASE;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  -- 更新最后生成日期
  UPDATE repeat_task_templates 
  SET last_generated_date = end_date_param
  WHERE id = template_id_param;
  
  RETURN instance_count;
END;
$$ LANGUAGE plpgsql;

-- 习惯任务进度更新函数
CREATE OR REPLACE FUNCTION update_habit_challenge_progress(challenge_id_param UUID)
RETURNS VOID AS $$
DECLARE
  challenge_record RECORD;
  total_checkins INTEGER;
  current_streak_count INTEGER;
  longest_streak_count INTEGER;
  completion_rate_value DECIMAL(5,2);
BEGIN
  -- 获取挑战信息
  SELECT * INTO challenge_record
  FROM personal_habit_challenges
  WHERE id = challenge_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- 计算总打卡次数
  SELECT COUNT(*) INTO total_checkins
  FROM habit_check_ins
  WHERE challenge_id = challenge_id_param;
  
  -- 计算当前连续天数
  WITH consecutive_days AS (
    SELECT 
      check_in_date,
      check_in_date - ROW_NUMBER() OVER (ORDER BY check_in_date)::INTEGER AS group_date
    FROM habit_check_ins
    WHERE challenge_id = challenge_id_param
    ORDER BY check_in_date DESC
  ),
  streak_groups AS (
    SELECT 
      group_date,
      COUNT(*) as streak_length,
      MAX(check_in_date) as latest_date
    FROM consecutive_days
    GROUP BY group_date
    ORDER BY latest_date DESC
  )
  SELECT COALESCE(streak_length, 0) INTO current_streak_count
  FROM streak_groups
  LIMIT 1;
  
  -- 计算最长连续天数
  WITH consecutive_days AS (
    SELECT 
      check_in_date,
      check_in_date - ROW_NUMBER() OVER (ORDER BY check_in_date)::INTEGER AS group_date
    FROM habit_check_ins
    WHERE challenge_id = challenge_id_param
    ORDER BY check_in_date
  ),
  streak_groups AS (
    SELECT COUNT(*) as streak_length
    FROM consecutive_days
    GROUP BY group_date
  )
  SELECT COALESCE(MAX(streak_length), 0) INTO longest_streak_count
  FROM streak_groups;
  
  -- 计算完成率
  completion_rate_value := (total_checkins::DECIMAL / challenge_record.total_days) * 100;
  
  -- 更新挑战记录
  UPDATE personal_habit_challenges
  SET 
    completed_days = total_checkins,
    current_streak = current_streak_count,
    longest_streak = longest_streak_count,
    completion_rate = completion_rate_value,
    status = CASE 
      WHEN total_checkins >= challenge_record.total_days THEN 'completed'
      WHEN status = 'abandoned' THEN 'abandoned'
      ELSE 'active'
    END,
    completed_at = CASE 
      WHEN total_checkins >= challenge_record.total_days AND completed_at IS NULL 
      THEN NOW()
      ELSE completed_at
    END
  WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 阶段4: 创建触发器
-- ==========================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_base_tasks_updated_at
  BEFORE UPDATE ON base_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 习惯任务打卡后自动更新进度
CREATE OR REPLACE FUNCTION trigger_update_habit_progress()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_habit_challenge_progress(NEW.challenge_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_habit_progress_after_checkin
  AFTER INSERT OR UPDATE OR DELETE ON habit_check_ins
  FOR EACH ROW EXECUTE FUNCTION trigger_update_habit_progress();

-- ==========================================
-- 阶段5: RLS (Row Level Security) 策略
-- ==========================================

-- 启用RLS
ALTER TABLE base_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE once_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE repeat_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE repeat_task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_habit_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_check_ins ENABLE ROW LEVEL SECURITY;

-- 基础任务表RLS策略
CREATE POLICY "Users can view tasks in their couple" ON base_tasks
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their couple" ON base_tasks
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    couple_id IN (
      SELECT id FROM couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tasks" ON base_tasks
  FOR UPDATE USING (creator_id = auth.uid());

-- 一次性任务表RLS策略
CREATE POLICY "Users can view once tasks in their couple" ON once_tasks
  FOR SELECT USING (
    id IN (SELECT id FROM base_tasks WHERE couple_id IN (
      SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update once tasks they created or are assigned to" ON once_tasks
  FOR UPDATE USING (
    id IN (SELECT id FROM base_tasks WHERE creator_id = auth.uid()) OR
    assignee_id = auth.uid()
  );

-- 习惯任务相关RLS策略
CREATE POLICY "Users can view habit tasks in their couple" ON habit_tasks
  FOR SELECT USING (
    id IN (SELECT id FROM base_tasks WHERE couple_id IN (
      SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    ))
  );

CREATE POLICY "Users can view their own habit challenges" ON personal_habit_challenges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own habit challenges" ON personal_habit_challenges
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own habit challenges" ON personal_habit_challenges
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own check-ins" ON habit_check_ins
  FOR SELECT USING (
    challenge_id IN (SELECT id FROM personal_habit_challenges WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own check-ins" ON habit_check_ins
  FOR INSERT WITH CHECK (
    challenge_id IN (SELECT id FROM personal_habit_challenges WHERE user_id = auth.uid())
  );

-- ==========================================
-- 完成信息
-- ==========================================

-- 输出创建完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ 任务系统重构完成！';
  RAISE NOTICE '📊 创建的表：';
  RAISE NOTICE '   - base_tasks (基础任务表)';
  RAISE NOTICE '   - once_tasks (一次性任务表)';
  RAISE NOTICE '   - repeat_task_templates (重复任务模板表)';
  RAISE NOTICE '   - repeat_task_instances (重复任务实例表)';
  RAISE NOTICE '   - habit_tasks (习惯任务表)';
  RAISE NOTICE '   - personal_habit_challenges (个人习惯挑战表)';
  RAISE NOTICE '   - habit_check_ins (习惯打卡记录表)';
  RAISE NOTICE '🔧 创建的功能：';
  RAISE NOTICE '   - 统一任务列表视图 (unified_task_list)';
  RAISE NOTICE '   - 重复任务实例生成函数';
  RAISE NOTICE '   - 习惯任务进度更新函数';
  RAISE NOTICE '   - 自动触发器和RLS策略';
  RAISE NOTICE '🎯 下一步：运行数据迁移脚本将现有数据迁移到新表结构';
END $$;
