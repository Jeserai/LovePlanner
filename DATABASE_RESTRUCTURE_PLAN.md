# 🗄️ 数据库重构方案 - 任务系统优化

## 📊 **当前问题分析**

### **现有数据库问题**
1. **字段冗余**: `deadline`, `task_end_time`, `end_date` 概念重叠
2. **类型混合**: 一次性任务和重复任务混在一个表中，字段利用率低
3. **习惯任务特殊性**: 习惯任务有独特的逻辑，但被强行塞入通用任务表
4. **时间概念混乱**: 多个时间字段含义不清晰
5. **扩展性差**: 新增任务类型需要修改现有表结构

---

## 🎯 **重构目标**

1. **分离关注点**: 不同类型任务使用不同表结构
2. **简化字段**: 消除冗余，明确每个字段的职责
3. **提高性能**: 减少不必要的NULL字段，优化查询
4. **增强扩展性**: 便于未来添加新的任务类型
5. **保持兼容**: 提供平滑的数据迁移路径

---

## 🏗️ **新架构设计**

### **方案A: 完全分离表结构（推荐）**

#### **1. 基础任务表 (base_tasks)**
```sql
-- 所有任务的基础信息
CREATE TABLE base_tasks (
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
```

#### **2. 一次性任务表 (once_tasks)**
```sql
-- 一次性任务的具体信息
CREATE TABLE once_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  
  -- 🎯 时间约束（四种组合）
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
```

#### **3. 重复任务模板表 (repeat_task_templates)**
```sql
-- 重复任务的模板配置
CREATE TABLE repeat_task_templates (
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
```

#### **4. 重复任务实例表 (repeat_task_instances)**
```sql
-- 重复任务的具体实例
CREATE TABLE repeat_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES repeat_task_templates(id) ON DELETE CASCADE,
  
  -- 🎯 实例特定信息
  instance_date DATE NOT NULL,      -- 这个实例对应的日期
  start_time TIMESTAMPTZ,           -- 这个实例的开始时间
  end_time TIMESTAMPTZ,             -- 这个实例的结束时间
  
  -- 🎯 实例状态（继承一次性任务的状态逻辑）
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
```

#### **5. 习惯任务表 (habit_tasks)**
```sql
-- 习惯养成任务
CREATE TABLE habit_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  
  -- 🎯 挑战配置
  duration_type TEXT NOT NULL CHECK (duration_type IN ('21days', '30days', '90days', '365days')),
  duration_days INTEGER NOT NULL,   -- 实际天数，便于计算
  
  -- 🎯 挑战时间范围
  challenge_start_date DATE NOT NULL,
  challenge_end_date DATE NOT NULL,
  
  -- 🎯 参与规则
  max_participants INTEGER,         -- 最大参与人数（NULL表示无限制）
  min_completion_rate DECIMAL(3,2), -- 最低完成率要求（0.8表示80%）
  allow_restart BOOLEAN DEFAULT TRUE,
  max_restart_count INTEGER DEFAULT 3,
  
  -- 🎯 状态
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (
    status IN ('recruiting', 'active', 'completed', 'cancelled')
  ),
  
  -- 🎯 统计信息
  total_participants INTEGER DEFAULT 0,
  active_participants INTEGER DEFAULT 0,
  completed_participants INTEGER DEFAULT 0
);
```

#### **6. 个人习惯挑战表 (personal_habit_challenges)**
```sql
-- 用户参与的习惯挑战
CREATE TABLE personal_habit_challenges (
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
```

#### **7. 习惯打卡记录表 (habit_check_ins)**
```sql
-- 习惯任务的每日打卡记录
CREATE TABLE habit_check_ins (
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
```

---

### **方案B: 混合表结构（兼容性优先）**

如果考虑到迁移成本，也可以采用混合方案：

#### **保留现有tasks表，但进行字段整理**
```sql
-- 重构现有tasks表
ALTER TABLE tasks 
  -- 🎯 简化时间字段
  DROP COLUMN task_start_time,
  DROP COLUMN task_end_time,
  DROP COLUMN start_date,
  DROP COLUMN end_date,
  
  -- 🎯 添加统一时间字段
  ADD COLUMN start_time TIMESTAMPTZ,     -- 统一的开始时间
  ADD COLUMN end_time TIMESTAMPTZ,       -- 统一的结束时间（替代deadline）
  
  -- 🎯 重复任务字段
  ADD COLUMN repeat_start_date DATE,     -- 重复开始日期
  ADD COLUMN repeat_end_date DATE,       -- 重复结束日期
  ADD COLUMN instance_date DATE,         -- 重复任务实例日期
  ADD COLUMN template_id UUID REFERENCES tasks(id), -- 指向模板任务
  
  -- 🎯 习惯任务字段
  ADD COLUMN duration_days INTEGER,     -- 习惯任务持续天数
  ADD COLUMN challenge_start_date DATE, -- 挑战开始日期
  ADD COLUMN challenge_end_date DATE;   -- 挑战结束日期

-- 然后创建习惯任务相关的独立表
-- (personal_habit_challenges 和 habit_check_ins 保持不变)
```

---

## 🔄 **数据迁移策略**

### **阶段1: 创建新表结构**
```sql
-- 创建所有新表
-- 设置外键约束
-- 创建必要的索引
```

### **阶段2: 数据迁移**
```sql
-- 迁移一次性任务
INSERT INTO base_tasks (id, title, description, ...)
SELECT id, title, description, ...
FROM tasks 
WHERE repeat_type = 'once';

INSERT INTO once_tasks (id, start_time, end_time, status, ...)
SELECT id, task_start_time, deadline, status, ...
FROM tasks 
WHERE repeat_type = 'once';

-- 迁移重复任务
-- 迁移习惯任务
```

### **阶段3: 应用层适配**
```typescript
// 创建统一的任务服务接口
interface TaskService {
  // 一次性任务
  getOnceTasks(coupleId: string): Promise<OnceTask[]>;
  createOnceTask(task: CreateOnceTaskRequest): Promise<OnceTask>;
  
  // 重复任务
  getRepeatTaskTemplates(coupleId: string): Promise<RepeatTaskTemplate[]>;
  getRepeatTaskInstances(templateId: string): Promise<RepeatTaskInstance[]>;
  
  // 习惯任务
  getHabitTasks(coupleId: string): Promise<HabitTask[]>;
  joinHabitChallenge(taskId: string, userId: string): Promise<PersonalHabitChallenge>;
}
```

### **阶段4: 清理旧表**
```sql
-- 验证数据完整性
-- 删除旧的tasks表
-- 清理不再需要的字段和约束
```

---

## 📈 **性能优化**

### **索引策略**
```sql
-- 基础任务表
CREATE INDEX idx_base_tasks_couple_creator ON base_tasks(couple_id, creator_id);
CREATE INDEX idx_base_tasks_category ON base_tasks(task_category);

-- 一次性任务表
CREATE INDEX idx_once_tasks_status ON once_tasks(status);
CREATE INDEX idx_once_tasks_assignee ON once_tasks(assignee_id);
CREATE INDEX idx_once_tasks_time_range ON once_tasks(start_time, end_time);

-- 重复任务模板表
CREATE INDEX idx_repeat_templates_active ON repeat_task_templates(is_active);
CREATE INDEX idx_repeat_templates_schedule ON repeat_task_templates(repeat_start_date, repeat_end_date);

-- 重复任务实例表
CREATE INDEX idx_repeat_instances_template_date ON repeat_task_instances(template_id, instance_date);
CREATE INDEX idx_repeat_instances_status ON repeat_task_instances(status);

-- 习惯任务表
CREATE INDEX idx_habit_tasks_challenge_period ON habit_tasks(challenge_start_date, challenge_end_date);
CREATE INDEX idx_habit_tasks_status ON habit_tasks(status);

-- 个人习惯挑战表
CREATE INDEX idx_personal_challenges_user ON personal_habit_challenges(user_id);
CREATE INDEX idx_personal_challenges_status ON personal_habit_challenges(status);

-- 习惯打卡记录表
CREATE INDEX idx_habit_checkins_challenge_date ON habit_check_ins(challenge_id, check_in_date);
```

### **查询优化**
```sql
-- 视图：统一任务列表
CREATE VIEW unified_task_list AS
SELECT 
  bt.id, bt.title, bt.description, bt.points, bt.task_category,
  ot.status, ot.assignee_id, ot.start_time, ot.end_time,
  'once' as task_type
FROM base_tasks bt
JOIN once_tasks ot ON bt.id = ot.id
WHERE bt.task_category = 'once'

UNION ALL

SELECT 
  bt.id, bt.title, bt.description, bt.points, bt.task_category,
  rti.status, rti.assignee_id, rti.start_time, rti.end_time,
  'repeat_instance' as task_type
FROM base_tasks bt
JOIN repeat_task_templates rtt ON bt.id = rtt.id
JOIN repeat_task_instances rti ON rtt.id = rti.template_id
WHERE bt.task_category = 'repeat'

UNION ALL

SELECT 
  bt.id, bt.title, bt.description, bt.points, bt.task_category,
  ht.status, NULL as assignee_id, ht.challenge_start_date::timestamptz, ht.challenge_end_date::timestamptz,
  'habit' as task_type
FROM base_tasks bt
JOIN habit_tasks ht ON bt.id = ht.id
WHERE bt.task_category = 'habit';
```

---

## 🎯 **推荐方案**

我推荐采用**方案A（完全分离表结构）**，理由如下：

### **优势**
1. **清晰的职责分离**: 每种任务类型有专门的表结构
2. **更好的性能**: 减少NULL字段，提高查询效率
3. **更强的扩展性**: 便于未来添加新的任务类型
4. **更好的数据完整性**: 每个表都有针对性的约束

### **实施建议**
1. **分阶段迁移**: 先创建新表，再逐步迁移数据
2. **保持API兼容**: 在服务层提供统一的接口
3. **充分测试**: 确保迁移过程中数据不丢失
4. **性能监控**: 迁移后监控查询性能

---

## 🔧 **下一步行动**

1. **确认方案**: 选择最终的重构方案
2. **创建迁移脚本**: 编写详细的数据库迁移SQL
3. **更新应用代码**: 修改服务层以适配新的表结构
4. **测试验证**: 全面测试新架构的功能和性能
5. **部署上线**: 在生产环境中执行迁移

你觉得这个重构方案如何？需要我详细实现其中的某个部分吗？
