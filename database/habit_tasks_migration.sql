-- 🎯 简化版习惯任务数据库迁移
-- 这个脚本创建支持简化习惯任务功能所需的表

-- 1. 个人习惯挑战表
CREATE TABLE IF NOT EXISTS personal_habit_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联信息
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 🎯 个人时间线
  joined_at TIMESTAMP DEFAULT NOW(),
  personal_start_date DATE NOT NULL,     -- 个人挑战开始日期
  personal_end_date DATE NOT NULL,       -- 个人挑战截止日期
  
  -- 🎯 简单进度追踪
  total_completions INTEGER DEFAULT 0,   -- 总完成天数
  last_completion_date DATE,             -- 最后打卡日期
  
  -- 🎯 简单状态
  status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- 挑战进行中
    'completed',   -- 挑战成功
    'failed',      -- 挑战失败（截止日期到了但未完成）
    'abandoned'    -- 主动放弃
  )),
  
  -- 结果统计
  completed_at TIMESTAMP,               -- 完成时间
  total_points_earned INTEGER DEFAULT 0, -- 总获得积分
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 🎯 确保每个用户只能参与一次同一个习惯任务
  UNIQUE(task_id, user_id)
);

-- 2. 习惯打卡记录表
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联到个人挑战
  personal_challenge_id UUID NOT NULL REFERENCES personal_habit_challenges(id) ON DELETE CASCADE,
  
  -- 🎯 打卡信息
  completion_date DATE NOT NULL,         -- 打卡日期
  completion_time TIMESTAMP DEFAULT NOW(), -- 打卡时间
  
  -- 打卡内容
  notes TEXT,                           -- 打卡备注
  proof_url TEXT,                       -- 打卡证明图片
  
  -- 积分
  points_earned INTEGER DEFAULT 0,      -- 本次打卡获得的积分
  
  -- 🎯 确保每天只能打卡一次
  UNIQUE(personal_challenge_id, completion_date),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 为现有tasks表添加习惯任务支持（如果字段不存在）
-- 注意：这些字段可能已经存在，所以使用 IF NOT EXISTS
DO $$ 
BEGIN
  -- 检查并添加duration字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'duration') THEN
    ALTER TABLE tasks ADD COLUMN duration VARCHAR CHECK (duration IN ('21days', '1month', '6months', '1year'));
  END IF;
END $$;

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_personal_habit_challenges_user_id ON personal_habit_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_habit_challenges_task_id ON personal_habit_challenges(task_id);
CREATE INDEX IF NOT EXISTS idx_personal_habit_challenges_status ON personal_habit_challenges(status);
CREATE INDEX IF NOT EXISTS idx_personal_habit_challenges_end_date ON personal_habit_challenges(personal_end_date);

CREATE INDEX IF NOT EXISTS idx_habit_completions_challenge_id ON habit_completions(personal_challenge_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);

-- 5. 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为personal_habit_challenges表创建触发器
DROP TRIGGER IF EXISTS update_personal_habit_challenges_updated_at ON personal_habit_challenges;
CREATE TRIGGER update_personal_habit_challenges_updated_at
    BEFORE UPDATE ON personal_habit_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 创建RLS（行级安全）策略
-- 启用RLS
ALTER TABLE personal_habit_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- personal_habit_challenges的RLS策略
CREATE POLICY "Users can view their own habit challenges" ON personal_habit_challenges
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own habit challenges" ON personal_habit_challenges
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own habit challenges" ON personal_habit_challenges
  FOR UPDATE USING (auth.uid()::text = user_id);

-- habit_completions的RLS策略
CREATE POLICY "Users can view their own habit completions" ON habit_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM personal_habit_challenges 
      WHERE id = habit_completions.personal_challenge_id 
      AND user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own habit completions" ON habit_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal_habit_challenges 
      WHERE id = habit_completions.personal_challenge_id 
      AND user_id = auth.uid()::text
    )
  );

-- 7. 创建一些有用的视图
-- 习惯任务统计视图
CREATE OR REPLACE VIEW habit_task_stats AS
SELECT 
  t.id as task_id,
  t.title,
  t.description,
  t.duration,
  t.start_date,
  t.end_date,
  COUNT(phc.id) as total_participants,
  COUNT(CASE WHEN phc.status = 'active' THEN 1 END) as active_participants,
  COUNT(CASE WHEN phc.status = 'completed' THEN 1 END) as completed_participants,
  COUNT(CASE WHEN phc.status = 'failed' THEN 1 END) as failed_participants,
  COUNT(CASE WHEN phc.status = 'abandoned' THEN 1 END) as abandoned_participants,
  ROUND(
    COUNT(CASE WHEN phc.status = 'completed' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(phc.id), 0), 
    2
  ) as completion_rate
FROM tasks t
LEFT JOIN personal_habit_challenges phc ON t.id = phc.task_id
WHERE t.task_type = 'habit'
GROUP BY t.id, t.title, t.description, t.duration, t.start_date, t.end_date;

-- 用户习惯挑战进度视图
CREATE OR REPLACE VIEW user_habit_progress AS
SELECT 
  phc.*,
  t.title as task_title,
  t.description as task_description,
  t.points as points_per_completion,
  t.duration,
  CASE 
    WHEN t.duration = '21days' THEN 21
    WHEN t.duration = '1month' THEN 30
    WHEN t.duration = '6months' THEN 180
    WHEN t.duration = '1year' THEN 365
    ELSE 21
  END as required_completions,
  ROUND(
    phc.total_completions * 100.0 / 
    CASE 
      WHEN t.duration = '21days' THEN 21
      WHEN t.duration = '1month' THEN 30
      WHEN t.duration = '6months' THEN 180
      WHEN t.duration = '1year' THEN 365
      ELSE 21
    END, 
    2
  ) as progress_percentage,
  (phc.personal_end_date >= CURRENT_DATE) as is_still_active_period
FROM personal_habit_challenges phc
JOIN tasks t ON phc.task_id = t.id
WHERE t.task_type = 'habit';

-- 8. 插入一些示例数据（可选，用于测试）
-- 注意：这些数据仅用于开发测试，生产环境请删除

/*
-- 示例习惯任务
INSERT INTO tasks (
  title, 
  description, 
  task_type, 
  repeat_type,
  duration,
  start_date,
  end_date,
  points,
  status,
  creator_id,
  couple_id
) VALUES 
(
  '21天早起挑战',
  '每天早上7点前起床并打卡，养成早起的好习惯',
  'habit',
  'repeat',
  '21days',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  10,
  'recruiting',
  '00000000-0000-0000-0000-000000000001', -- 替换为实际的用户ID
  '00000000-0000-0000-0000-000000000001'  -- 替换为实际的couple_id
),
(
  '30天阅读习惯',
  '每天阅读至少30分钟，培养阅读习惯',
  'habit',
  'repeat', 
  '1month',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '45 days',
  15,
  'recruiting',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);
*/

-- 完成迁移
SELECT 'Habit tasks migration completed successfully!' as result;
