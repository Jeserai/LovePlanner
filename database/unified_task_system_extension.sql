-- 🔄 统一任务系统扩展脚本
-- 在现有tasks表基础上扩展，支持挑战模式的重复任务（习惯任务）

-- ==========================================
-- 阶段1: 扩展现有tasks表
-- ==========================================

-- 添加挑战模式相关字段
ALTER TABLE tasks 
  -- 🎯 挑战模式核心字段
  ADD COLUMN IF NOT EXISTS challenge_mode BOOLEAN DEFAULT FALSE,           -- 是否为挑战模式
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,                       -- 最大参与人数（NULL=无限制）
  ADD COLUMN IF NOT EXISTS allow_flexible_start BOOLEAN DEFAULT FALSE,     -- 允许用户自选开始时间
  
  -- 🎯 连续性和完成要求
  ADD COLUMN IF NOT EXISTS consecutive_required BOOLEAN DEFAULT FALSE,     -- 是否要求连续完成
  ADD COLUMN IF NOT EXISTS min_completion_rate DECIMAL(3,2),              -- 最低完成率要求 (0.8 = 80%)
  ADD COLUMN IF NOT EXISTS allow_restart BOOLEAN DEFAULT TRUE,            -- 允许重新开始挑战
  
  -- 🎯 挑战统计字段
  ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0,          -- 总参与人数
  ADD COLUMN IF NOT EXISTS active_participants INTEGER DEFAULT 0,         -- 活跃参与人数
  ADD COLUMN IF NOT EXISTS completed_participants INTEGER DEFAULT 0;      -- 完成挑战人数

-- 添加约束
ALTER TABLE tasks 
  ADD CONSTRAINT IF NOT EXISTS check_completion_rate 
    CHECK (min_completion_rate IS NULL OR (min_completion_rate >= 0 AND min_completion_rate <= 1));

-- ==========================================
-- 阶段2: 创建任务参与记录表
-- ==========================================

CREATE TABLE IF NOT EXISTS task_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 🎯 参与信息
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  participation_type TEXT NOT NULL DEFAULT 'assigned' CHECK (
    participation_type IN ('assigned', 'joined')
  ),
  
  -- 🎯 个人时间线（挑战模式专用）
  personal_start_date DATE,
  personal_end_date DATE,
  personal_duration_days INTEGER,
  
  -- 🎯 进度跟踪
  total_required INTEGER NOT NULL DEFAULT 1,      -- 总共需要完成的次数
  completed_count INTEGER DEFAULT 0,              -- 已完成次数
  current_streak INTEGER DEFAULT 0,               -- 当前连续次数
  longest_streak INTEGER DEFAULT 0,               -- 最长连续次数
  completion_rate DECIMAL(5,2) DEFAULT 0.00,      -- 完成率百分比
  
  -- 🎯 参与状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'abandoned', 'paused')
  ),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  -- 🎯 重启记录
  restart_count INTEGER DEFAULT 0,
  last_restart_date DATE,
  
  -- 🎯 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, user_id)
);

-- ==========================================
-- 阶段3: 创建任务完成记录表
-- ==========================================

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID NOT NULL REFERENCES task_participations(id) ON DELETE CASCADE,
  
  -- 🎯 完成信息
  completion_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 🎯 完成内容
  notes TEXT,
  proof_url TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  
  -- 🎯 进度信息
  streak_day INTEGER NOT NULL,                    -- 这是连续的第几天
  is_makeup BOOLEAN DEFAULT FALSE,                -- 是否是补完成
  
  -- 🎯 审核信息（如果需要）
  requires_review BOOLEAN DEFAULT FALSE,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  
  UNIQUE(participation_id, completion_date)
);

-- ==========================================
-- 阶段4: 创建索引
-- ==========================================

-- tasks表新字段索引
CREATE INDEX IF NOT EXISTS idx_tasks_challenge_mode ON tasks(challenge_mode);
CREATE INDEX IF NOT EXISTS idx_tasks_challenge_active ON tasks(challenge_mode, status) WHERE challenge_mode = TRUE;

-- task_participations表索引
CREATE INDEX IF NOT EXISTS idx_participations_user ON task_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_task ON task_participations(task_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON task_participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_user_status ON task_participations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_active ON task_participations(task_id, status) WHERE status = 'active';

-- task_completions表索引
CREATE INDEX IF NOT EXISTS idx_completions_participation ON task_completions(participation_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_participation_date ON task_completions(participation_id, completion_date);

-- ==========================================
-- 阶段5: 创建视图
-- ==========================================

-- 统一任务视图（包含参与信息）
CREATE OR REPLACE VIEW unified_tasks_with_participation AS
SELECT 
  t.*,
  tp.id as participation_id,
  tp.user_id as participant_id,
  tp.participation_type,
  tp.personal_start_date,
  tp.personal_end_date,
  tp.completed_count,
  tp.current_streak,
  tp.longest_streak,
  tp.completion_rate,
  tp.status as participation_status,
  tp.joined_at,
  tp.completed_at as participation_completed_at
FROM tasks t
LEFT JOIN task_participations tp ON t.id = tp.task_id
WHERE t.repeat_type = 'repeat';

-- 用户任务列表视图
CREATE OR REPLACE VIEW user_task_list AS
-- 传统分配的任务
SELECT 
  t.*,
  'assigned' as user_relation,
  t.assignee_id as user_id,
  NULL::UUID as participation_id,
  NULL::INTEGER as completed_count,
  NULL::INTEGER as current_streak,
  NULL::DECIMAL as completion_rate
FROM tasks t
WHERE t.assignee_id IS NOT NULL 
  AND (t.challenge_mode = FALSE OR t.challenge_mode IS NULL)

UNION ALL

-- 挑战模式参与的任务
SELECT 
  t.*,
  'participant' as user_relation,
  tp.user_id,
  tp.id as participation_id,
  tp.completed_count,
  tp.current_streak,
  tp.completion_rate
FROM tasks t
JOIN task_participations tp ON t.id = tp.task_id
WHERE t.challenge_mode = TRUE;

-- ==========================================
-- 阶段6: 创建函数
-- ==========================================

-- 加入挑战函数
CREATE OR REPLACE FUNCTION join_challenge(
  task_id_param UUID,
  user_id_param UUID,
  start_date_param DATE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  task_record RECORD;
  participation_id UUID;
  calculated_start_date DATE;
  calculated_end_date DATE;
  duration_days INTEGER;
BEGIN
  -- 获取任务信息
  SELECT * INTO task_record FROM tasks WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '任务不存在';
  END IF;
  
  IF task_record.challenge_mode = FALSE THEN
    RAISE EXCEPTION '此任务不是挑战模式';
  END IF;
  
  -- 检查是否已经参与
  IF EXISTS (SELECT 1 FROM task_participations WHERE task_id = task_id_param AND user_id = user_id_param) THEN
    RAISE EXCEPTION '已经参与过此挑战';
  END IF;
  
  -- 计算个人开始和结束日期
  IF task_record.allow_flexible_start = TRUE THEN
    calculated_start_date := COALESCE(start_date_param, CURRENT_DATE);
  ELSE
    calculated_start_date := task_record.start_date::DATE;
  END IF;
  
  -- 根据duration字段计算持续天数
  duration_days := CASE task_record.duration
    WHEN '21days' THEN 21
    WHEN '1month' THEN 30
    WHEN '6months' THEN 180
    WHEN '1year' THEN 365
    ELSE 21  -- 默认21天
  END;
  
  calculated_end_date := calculated_start_date + (duration_days - 1);
  
  -- 检查是否超出任务结束日期
  IF task_record.end_date IS NOT NULL AND calculated_end_date > task_record.end_date::DATE THEN
    RAISE EXCEPTION '挑战结束时间超出任务期限';
  END IF;
  
  -- 创建参与记录
  INSERT INTO task_participations (
    task_id, user_id, participation_type,
    personal_start_date, personal_end_date, personal_duration_days,
    total_required
  ) VALUES (
    task_id_param, user_id_param, 'joined',
    calculated_start_date, calculated_end_date, duration_days,
    duration_days
  ) RETURNING id INTO participation_id;
  
  -- 更新任务参与统计
  UPDATE tasks 
  SET total_participants = total_participants + 1,
      active_participants = active_participants + 1
  WHERE id = task_id_param;
  
  RETURN participation_id;
END;
$$ LANGUAGE plpgsql;

-- 记录任务完成函数
CREATE OR REPLACE FUNCTION record_task_completion(
  participation_id_param UUID,
  completion_date_param DATE DEFAULT CURRENT_DATE,
  notes_param TEXT DEFAULT NULL,
  proof_url_param TEXT DEFAULT NULL,
  mood_rating_param INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  participation_record RECORD;
  completion_id UUID;
  new_streak INTEGER;
  is_consecutive BOOLEAN;
BEGIN
  -- 获取参与记录
  SELECT * INTO participation_record FROM task_participations WHERE id = participation_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '参与记录不存在';
  END IF;
  
  -- 检查是否已经完成过这一天
  IF EXISTS (SELECT 1 FROM task_completions WHERE participation_id = participation_id_param AND completion_date = completion_date_param) THEN
    RAISE EXCEPTION '今天已经完成过了';
  END IF;
  
  -- 检查是否在个人挑战期间内
  IF completion_date_param < participation_record.personal_start_date OR 
     completion_date_param > participation_record.personal_end_date THEN
    RAISE EXCEPTION '不在挑战期间内';
  END IF;
  
  -- 计算连续天数
  is_consecutive := (
    completion_date_param = participation_record.personal_start_date + participation_record.completed_count
  );
  
  IF is_consecutive THEN
    new_streak := participation_record.current_streak + 1;
  ELSE
    new_streak := 1;  -- 重新开始计数
  END IF;
  
  -- 创建完成记录
  INSERT INTO task_completions (
    participation_id, completion_date, notes, proof_url, mood_rating, streak_day
  ) VALUES (
    participation_id_param, completion_date_param, notes_param, proof_url_param, 
    mood_rating_param, new_streak
  ) RETURNING id INTO completion_id;
  
  -- 更新参与记录
  UPDATE task_participations 
  SET completed_count = completed_count + 1,
      current_streak = new_streak,
      longest_streak = GREATEST(longest_streak, new_streak),
      completion_rate = (completed_count + 1) * 100.0 / total_required,
      status = CASE 
        WHEN (completed_count + 1) >= total_required THEN 'completed'
        ELSE 'active'
      END,
      completed_at = CASE 
        WHEN (completed_count + 1) >= total_required THEN NOW()
        ELSE completed_at
      END,
      updated_at = NOW()
  WHERE id = participation_id_param;
  
  RETURN completion_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 阶段7: 创建触发器
-- ==========================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_task_participations_updated_at
  BEFORE UPDATE ON task_participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 阶段8: 数据迁移
-- ==========================================

-- 将现有的habit类型任务转换为挑战模式
UPDATE tasks 
SET challenge_mode = TRUE,
    consecutive_required = TRUE,
    allow_flexible_start = TRUE,
    allow_restart = TRUE
WHERE task_type = 'habit' AND challenge_mode IS NULL;

-- 为现有的已分配任务创建参与记录
INSERT INTO task_participations (
  task_id, user_id, participation_type, 
  personal_start_date, personal_end_date, personal_duration_days,
  total_required, status
)
SELECT 
  t.id, t.assignee_id, 'assigned',
  t.start_date::DATE, t.end_date::DATE,
  CASE t.duration
    WHEN '21days' THEN 21
    WHEN '1month' THEN 30
    WHEN '6months' THEN 180
    WHEN '1year' THEN 365
    ELSE 21
  END,
  CASE t.duration
    WHEN '21days' THEN 21
    WHEN '1month' THEN 30
    WHEN '6months' THEN 180
    WHEN '1year' THEN 365
    ELSE 21
  END,
  CASE 
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.status = 'abandoned' THEN 'abandoned'
    ELSE 'active'
  END
FROM tasks t
WHERE t.assignee_id IS NOT NULL 
  AND t.repeat_type = 'repeat'
  AND NOT EXISTS (
    SELECT 1 FROM task_participations tp 
    WHERE tp.task_id = t.id AND tp.user_id = t.assignee_id
  );

-- ==========================================
-- 阶段9: RLS策略
-- ==========================================

-- 启用RLS
ALTER TABLE task_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- task_participations RLS策略
CREATE POLICY "Users can view their own participations" ON task_participations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own participations" ON task_participations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participations" ON task_participations
  FOR UPDATE USING (user_id = auth.uid());

-- task_completions RLS策略
CREATE POLICY "Users can view their own completions" ON task_completions
  FOR SELECT USING (
    participation_id IN (SELECT id FROM task_participations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own completions" ON task_completions
  FOR INSERT WITH CHECK (
    participation_id IN (SELECT id FROM task_participations WHERE user_id = auth.uid())
  );

-- ==========================================
-- 完成信息
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ 统一任务系统扩展完成！';
  RAISE NOTICE '📊 扩展内容：';
  RAISE NOTICE '   - tasks表新增挑战模式字段';
  RAISE NOTICE '   - task_participations表（任务参与记录）';
  RAISE NOTICE '   - task_completions表（任务完成记录）';
  RAISE NOTICE '   - 统一任务视图和函数';
  RAISE NOTICE '   - 自动数据迁移';
  RAISE NOTICE '🎯 现在支持：';
  RAISE NOTICE '   - 传统重复任务（分配模式）';
  RAISE NOTICE '   - 习惯挑战任务（参与模式）';
  RAISE NOTICE '   - 混合模式任务';
  RAISE NOTICE '   - 灵活的开始时间';
  RAISE NOTICE '   - 连续性跟踪';
  RAISE NOTICE '   - 进度统计';
END $$;
