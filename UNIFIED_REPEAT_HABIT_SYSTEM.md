# 🔄 统一的重复性任务和习惯任务系统

## 📊 **当前重复性任务数据结构分析**

### **现有数据库字段（tasks表）**
```sql
-- 基础信息
id, title, description, points, status
creator_id, assignee_id, couple_id
task_type: 'daily' | 'habit' | 'special'
repeat_type: 'once' | 'repeat'
requires_proof, proof_url, proof_type

-- 🎯 重复性任务核心字段
repeat_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
start_date: string | null          -- 重复开始日期
end_date: string | null            -- 重复结束日期
repeat_weekdays: number[]          -- 每周重复的日子 [1,2,5]
repeat_time: string | null         -- 每日执行时间点

-- 🎯 习惯任务字段（当前）
duration: '21days' | '1month' | '6months' | '1year' | null

-- 时间约束字段
deadline: string | null            -- 截止时间
task_start_time: string | null     -- 任务开始时间
task_end_time: string | null       -- 任务结束时间
has_specific_time: boolean         -- 是否有具体时间

-- 执行记录
submitted_at, completed_at, review_comment
created_at, updated_at
```

---

## 🎯 **核心洞察：习惯任务 = 特殊的重复任务**

您说得对！习惯任务本质上就是一种特殊的重复任务：

### **相同点**
1. **都有重复周期**: 习惯任务通常是每日重复
2. **都有时间范围**: 重复任务有start_date/end_date，习惯任务也有挑战期间
3. **都需要多次执行**: 重复任务生成多个实例，习惯任务需要多次打卡
4. **都有进度跟踪**: 重复任务跟踪完成情况，习惯任务跟踪连续天数

### **不同点**
1. **参与模式**: 习惯任务是"挑战模式"，用户主动加入；重复任务是"分配模式"
2. **完成标准**: 习惯任务强调连续性和总完成率；重复任务关注单次完成
3. **时间灵活性**: 习惯任务用户可以自选开始时间；重复任务通常有固定时间表

---

## 🏗️ **统一系统设计**

### **方案：扩展现有重复任务系统**

不需要创建全新的表结构，只需要在现有基础上增强：

```sql
-- 在现有tasks表基础上增加字段
ALTER TABLE tasks 
  -- 🎯 挑战模式字段
  ADD COLUMN challenge_mode BOOLEAN DEFAULT FALSE,           -- 是否为挑战模式
  ADD COLUMN max_participants INTEGER,                       -- 最大参与人数
  ADD COLUMN allow_flexible_start BOOLEAN DEFAULT FALSE,     -- 允许灵活开始时间
  
  -- 🎯 连续性要求字段  
  ADD COLUMN consecutive_required BOOLEAN DEFAULT FALSE,     -- 是否要求连续完成
  ADD COLUMN min_completion_rate DECIMAL(3,2),              -- 最低完成率 (0.8 = 80%)
  ADD COLUMN allow_restart BOOLEAN DEFAULT TRUE,            -- 允许重新开始
  
  -- 🎯 个人化时间字段
  ADD COLUMN personal_start_date DATE,                       -- 个人开始日期（挑战模式）
  ADD COLUMN personal_end_date DATE;                         -- 个人结束日期（挑战模式）
```

### **任务类型重新定义**
```typescript
interface UnifiedTask {
  // 基础信息
  id: string;
  title: string;
  description: string;
  points: number;
  creator_id: string;
  couple_id: string;
  
  // 🎯 任务分类
  repeat_type: 'once' | 'repeat';
  task_type: 'daily' | 'habit' | 'special';
  challenge_mode: boolean;  // 🆕 关键字段：是否为挑战模式
  
  // 🎯 重复配置（统一）
  repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  start_date?: string;      // 任务/挑战开始日期
  end_date?: string;        // 任务/挑战结束日期
  repeat_weekdays?: number[];
  repeat_time?: string;
  
  // 🎯 挑战模式特有配置
  max_participants?: number;
  allow_flexible_start?: boolean;
  consecutive_required?: boolean;
  min_completion_rate?: number;
  allow_restart?: boolean;
  
  // 🎯 个人化字段（挑战模式）
  personal_start_date?: string;
  personal_end_date?: string;
  
  // 🎯 时间约束
  task_start_time?: string;
  task_end_time?: string;
  deadline?: string;
  
  // 🎯 状态和执行
  status: TaskStatus;
  assignee_id?: string;
  requires_proof: boolean;
  proof_url?: string;
  submitted_at?: string;
  completed_at?: string;
  review_comment?: string;
}
```

---

## 🔄 **统一的任务模式**

### **模式1: 传统重复任务**
```typescript
{
  repeat_type: 'repeat',
  task_type: 'daily',
  challenge_mode: false,           // 🔑 关键区别
  repeat_frequency: 'daily',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  // 创建者直接分配给执行者
}
```

### **模式2: 习惯挑战任务**
```typescript
{
  repeat_type: 'repeat',
  task_type: 'habit',
  challenge_mode: true,            // 🔑 关键区别
  repeat_frequency: 'daily',
  start_date: '2024-01-01',        // 挑战招募期间
  end_date: '2024-01-31',
  allow_flexible_start: true,      // 用户可以自选开始时间
  consecutive_required: true,      // 要求连续完成
  min_completion_rate: 0.8,        // 80%完成率
  // 用户主动加入，系统计算personal_start_date/personal_end_date
}
```

### **模式3: 混合模式**
```typescript
{
  repeat_type: 'repeat',
  task_type: 'special',
  challenge_mode: true,
  repeat_frequency: 'weekly',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  allow_flexible_start: false,     // 固定开始时间
  consecutive_required: false,     // 不要求连续
  // 既可以分配，也可以主动加入
}
```

---

## 📋 **个人参与记录表**

为了支持挑战模式，需要一个新的关联表：

```sql
CREATE TABLE task_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 🎯 参与信息
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  participation_type TEXT NOT NULL CHECK (participation_type IN ('assigned', 'joined')),
  
  -- 🎯 个人时间线（挑战模式）
  personal_start_date DATE,
  personal_end_date DATE,
  
  -- 🎯 进度跟踪
  total_required INTEGER NOT NULL DEFAULT 1,
  completed_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- 🎯 状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'abandoned', 'paused')
  ),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  
  -- 🎯 重启记录
  restart_count INTEGER DEFAULT 0,
  last_restart_date DATE,
  
  UNIQUE(task_id, user_id)
);
```

---

## 🎯 **统一的服务接口**

```typescript
class UnifiedTaskService {
  // 创建任务（支持所有模式）
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    if (taskData.challenge_mode) {
      // 挑战模式：创建任务但不分配执行者
      return this.createChallengeTask(taskData);
    } else {
      // 传统模式：创建任务并可选分配执行者
      return this.createRegularTask(taskData);
    }
  }
  
  // 参与任务（统一接口）
  async participateInTask(taskId: string, userId: string, options?: ParticipationOptions): Promise<TaskParticipation> {
    const task = await this.getTask(taskId);
    
    if (task.challenge_mode) {
      // 挑战模式：用户主动加入
      return this.joinChallenge(taskId, userId, options);
    } else {
      // 传统模式：分配任务
      return this.assignTask(taskId, userId);
    }
  }
  
  // 提交任务完成（统一接口）
  async submitTaskCompletion(taskId: string, userId: string, submissionData: SubmissionData): Promise<boolean> {
    const task = await this.getTask(taskId);
    const participation = await this.getParticipation(taskId, userId);
    
    if (task.challenge_mode) {
      // 挑战模式：更新进度和连续记录
      return this.updateChallengeProgress(participation, submissionData);
    } else {
      // 传统模式：标记任务完成
      return this.completeRegularTask(taskId, submissionData);
    }
  }
  
  // 获取用户任务列表（统一）
  async getUserTasks(userId: string, filter?: TaskFilter): Promise<Task[]> {
    // 同时返回分配的任务和参与的挑战
    const [assignedTasks, challengeTasks] = await Promise.all([
      this.getAssignedTasks(userId, filter),
      this.getChallengeParticipations(userId, filter)
    ]);
    
    return [...assignedTasks, ...challengeTasks];
  }
}
```

---

## 🔄 **数据迁移策略**

### **阶段1: 扩展现有表结构**
```sql
-- 添加新字段到现有tasks表
ALTER TABLE tasks ADD COLUMN challenge_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN max_participants INTEGER;
ALTER TABLE tasks ADD COLUMN allow_flexible_start BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN consecutive_required BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN min_completion_rate DECIMAL(3,2);
ALTER TABLE tasks ADD COLUMN allow_restart BOOLEAN DEFAULT TRUE;

-- 创建参与记录表
CREATE TABLE task_participations (...);
```

### **阶段2: 迁移现有习惯任务**
```sql
-- 将现有的habit类型任务标记为挑战模式
UPDATE tasks 
SET challenge_mode = TRUE,
    consecutive_required = TRUE,
    allow_flexible_start = TRUE
WHERE task_type = 'habit';

-- 为现有的assignee创建参与记录
INSERT INTO task_participations (task_id, user_id, participation_type, ...)
SELECT id, assignee_id, 'assigned', ...
FROM tasks 
WHERE assignee_id IS NOT NULL;
```

### **阶段3: 更新应用逻辑**
- 修改任务创建UI，支持挑战模式选项
- 更新任务列表显示逻辑
- 实现统一的参与和完成接口

---

## 🎯 **优势分析**

### **✅ 统一架构的好处**
1. **代码复用**: 重复任务和习惯任务共享大部分逻辑
2. **数据一致性**: 统一的数据模型，减少不一致性
3. **功能扩展**: 可以轻松支持新的任务模式组合
4. **维护简单**: 只需要维护一套任务系统

### **✅ 灵活性**
1. **模式组合**: 可以创建各种任务模式的组合
2. **渐进迁移**: 现有功能不受影响，可以逐步迁移
3. **向后兼容**: 现有的重复任务继续正常工作

### **✅ 用户体验**
1. **统一界面**: 用户不需要区分"重复任务"和"习惯任务"
2. **灵活参与**: 支持分配模式和挑战模式
3. **进度跟踪**: 统一的进度跟踪和统计

---

## 🚀 **实施建议**

### **立即可行的步骤**
1. **扩展现有表结构**: 添加挑战模式相关字段
2. **创建参与记录表**: 支持多用户参与同一任务
3. **更新服务接口**: 实现统一的任务操作接口
4. **渐进式UI更新**: 先支持现有功能，再添加新功能

### **分阶段实施**
1. **阶段1**: 后端数据结构扩展（不影响现有功能）
2. **阶段2**: 实现统一的服务接口
3. **阶段3**: 更新前端UI支持挑战模式
4. **阶段4**: 迁移现有习惯任务数据

这样的设计既保持了现有系统的稳定性，又为习惯任务提供了完整的支持，同时为未来的功能扩展留下了空间。您觉得这个统一的方案如何？
