# 🔄 重新设计后的重复任务数据结构

## 📊 **核心数据结构**

### **1. 主表：tasks（扩展后）**

```sql
CREATE TABLE tasks (
  -- 🎯 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  couple_id UUID NOT NULL REFERENCES couples(id),
  
  -- 🎯 任务分类
  task_type TEXT CHECK (task_type IN ('daily', 'habit', 'special')),
  repeat_type TEXT CHECK (repeat_type IN ('once', 'repeat')),
  challenge_mode BOOLEAN DEFAULT FALSE,  -- 🆕 关键字段：是否为挑战模式
  
  -- 🎯 重复配置（统一）
  repeat_frequency TEXT CHECK (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date DATE,                       -- 任务/挑战开始日期
  end_date DATE,                         -- 任务/挑战结束日期
  repeat_weekdays INTEGER[],             -- [1,2,5] 周一、周二、周五
  repeat_time TIME,                      -- 每日建议执行时间
  
  -- 🎯 挑战模式特有配置
  duration TEXT CHECK (duration IN ('21days', '1month', '6months', '1year')), -- 个人挑战持续时间
  max_participants INTEGER,             -- 最大参与人数（NULL=无限制）
  allow_flexible_start BOOLEAN DEFAULT FALSE,  -- 允许用户自选开始时间
  consecutive_required BOOLEAN DEFAULT FALSE,  -- 是否要求连续完成
  min_completion_rate DECIMAL(3,2),     -- 最低完成率要求 (0.8 = 80%)
  allow_restart BOOLEAN DEFAULT TRUE,   -- 允许重新开始挑战
  
  -- 🎯 挑战统计
  total_participants INTEGER DEFAULT 0,
  active_participants INTEGER DEFAULT 0,
  completed_participants INTEGER DEFAULT 0,
  
  -- 🎯 时间约束
  task_start_time TIMESTAMPTZ,          -- 每次任务的开始时间窗口
  task_end_time TIMESTAMPTZ,            -- 每次任务的结束时间窗口
  deadline TIMESTAMPTZ,                 -- 整体截止时间
  
  -- 🎯 任务状态和执行
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'assigned', 'in_progress', 'pending_review', 'completed', 'abandoned')),
  assignee_id UUID REFERENCES auth.users(id),  -- 传统模式的分配对象
  requires_proof BOOLEAN DEFAULT FALSE,
  proof_url TEXT,
  proof_type TEXT,
  
  -- 🎯 系统字段
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  review_comment TEXT
);
```

### **2. 参与记录表：task_participations**

```sql
CREATE TABLE task_participations (
  -- 🎯 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 🎯 参与方式
  participation_type TEXT NOT NULL DEFAULT 'assigned' CHECK (
    participation_type IN ('assigned', 'joined')
  ),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 🎯 个人时间线（挑战模式专用）
  personal_start_date DATE,             -- 个人挑战开始日期
  personal_end_date DATE,               -- 个人挑战结束日期
  personal_duration_days INTEGER,       -- 个人挑战持续天数
  
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
  
  -- 🎯 系统字段
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, user_id)
);
```

### **3. 完成记录表：task_completions**

```sql
CREATE TABLE task_completions (
  -- 🎯 基础信息
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
```

---

## 🎯 **TypeScript 接口定义**

### **1. 统一任务接口**

```typescript
interface UnifiedTask {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  points: number;
  creator_id: string;
  couple_id: string;
  
  // 任务分类
  task_type: 'daily' | 'habit' | 'special';
  repeat_type: 'once' | 'repeat';
  challenge_mode: boolean;  // 🔑 关键字段
  
  // 重复配置
  repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  start_date?: string;      // 任务/挑战开始日期
  end_date?: string;        // 任务/挑战结束日期
  repeat_weekdays?: number[];
  repeat_time?: string;
  
  // 挑战模式配置
  duration?: '21days' | '1month' | '6months' | '1year';
  max_participants?: number;
  allow_flexible_start?: boolean;
  consecutive_required?: boolean;
  min_completion_rate?: number;
  allow_restart?: boolean;
  
  // 挑战统计
  total_participants?: number;
  active_participants?: number;
  completed_participants?: number;
  
  // 时间约束
  task_start_time?: string;
  task_end_time?: string;
  deadline?: string;
  
  // 状态和执行
  status: 'recruiting' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'abandoned';
  assignee_id?: string;
  requires_proof: boolean;
  proof_url?: string;
  submitted_at?: string;
  completed_at?: string;
  review_comment?: string;
  
  // 系统字段
  created_at: string;
  updated_at: string;
}
```

### **2. 参与记录接口**

```typescript
interface TaskParticipation {
  id: string;
  task_id: string;
  user_id: string;
  participation_type: 'assigned' | 'joined';
  joined_at: string;
  
  // 个人时间线
  personal_start_date?: string;
  personal_end_date?: string;
  personal_duration_days?: number;
  
  // 进度跟踪
  total_required: number;
  completed_count: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  
  // 状态
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  completed_at?: string;
  abandoned_at?: string;
  paused_at?: string;
  
  // 重启记录
  restart_count: number;
  last_restart_date?: string;
  
  // 系统字段
  created_at: string;
  updated_at: string;
}
```

### **3. 完成记录接口**

```typescript
interface TaskCompletion {
  id: string;
  participation_id: string;
  completion_date: string;
  completed_at: string;
  notes?: string;
  proof_url?: string;
  mood_rating?: number;
  streak_day: number;
  is_makeup: boolean;
  
  // 审核信息
  requires_review?: boolean;
  review_status?: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_comment?: string;
  reviewed_at?: string;
}
```

---

## 🔄 **不同任务模式的数据示例**

### **模式1: 传统重复任务**

```typescript
// 数据库记录
{
  id: 'task-001',
  title: '每日洗碗',
  task_type: 'daily',
  repeat_type: 'repeat',
  challenge_mode: false,           // 🔑 传统模式
  
  repeat_frequency: 'daily',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  
  assignee_id: 'user-123',         // 直接分配
  status: 'assigned',
  
  // 挑战相关字段为空
  duration: null,
  max_participants: null,
  allow_flexible_start: false,
  consecutive_required: false
}

// 对应的参与记录
{
  id: 'participation-001',
  task_id: 'task-001',
  user_id: 'user-123',
  participation_type: 'assigned',  // 分配模式
  
  // 传统模式不需要个人时间线
  personal_start_date: null,
  personal_end_date: null,
  
  total_required: 365,             // 一年365天
  completed_count: 45,
  current_streak: 7,
  status: 'active'
}
```

### **模式2: 习惯挑战任务**

```typescript
// 数据库记录
{
  id: 'task-002',
  title: '21天早起挑战',
  task_type: 'habit',
  repeat_type: 'repeat',
  challenge_mode: true,            // 🔑 挑战模式
  
  repeat_frequency: 'daily',
  start_date: '2024-01-01',        // 招募期间
  end_date: '2024-01-31',
  
  duration: '21days',              // 个人挑战持续时间
  max_participants: 10,
  allow_flexible_start: true,      // 用户可以自选开始时间
  consecutive_required: true,      // 要求连续完成
  
  assignee_id: null,               // 无直接分配
  status: 'recruiting',
  
  total_participants: 5,
  active_participants: 4
}

// 用户A的参与记录
{
  id: 'participation-002',
  task_id: 'task-002',
  user_id: 'user-456',
  participation_type: 'joined',    // 主动加入
  joined_at: '2024-01-05T10:00:00Z',
  
  // 个人时间线
  personal_start_date: '2024-01-06',  // 用户选择的开始时间
  personal_end_date: '2024-01-26',    // 21天后
  personal_duration_days: 21,
  
  total_required: 21,
  completed_count: 15,
  current_streak: 5,
  longest_streak: 10,
  completion_rate: 71.43,
  status: 'active'
}

// 用户A的完成记录
[
  {
    id: 'completion-001',
    participation_id: 'participation-002',
    completion_date: '2024-01-06',
    streak_day: 1,
    notes: '第一天，6:30起床！'
  },
  {
    id: 'completion-002',
    participation_id: 'participation-002',
    completion_date: '2024-01-07',
    streak_day: 2,
    mood_rating: 4
  }
  // ... 更多完成记录
]
```

### **模式3: 混合模式任务**

```typescript
// 数据库记录
{
  id: 'task-003',
  title: '每周健身打卡',
  task_type: 'special',
  repeat_type: 'repeat',
  challenge_mode: true,            // 支持主动参与
  
  repeat_frequency: 'weekly',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  repeat_weekdays: [1, 3, 5],      // 周一、三、五
  
  allow_flexible_start: false,     // 固定开始时间
  consecutive_required: false,     // 不要求连续
  min_completion_rate: 0.8,        // 要求80%完成率
  
  assignee_id: null,
  status: 'recruiting'
}
```

---

## 📊 **数据关系图**

```
tasks (主表)
├── challenge_mode = false → 传统重复任务
│   └── assignee_id → 直接分配给用户
│       └── task_participations (participation_type = 'assigned')
│           └── task_completions
│
└── challenge_mode = true → 习惯挑战任务
    ├── duration, max_participants, allow_flexible_start...
    └── 用户主动加入
        └── task_participations (participation_type = 'joined')
            ├── personal_start_date, personal_end_date
            ├── current_streak, completion_rate
            └── task_completions
                ├── completion_date, streak_day
                └── notes, proof_url, mood_rating
```

---

## 🎯 **关键设计决策**

### **1. 统一的任务表**
- ✅ 所有重复任务都存储在同一个`tasks`表中
- ✅ 通过`challenge_mode`字段区分不同模式
- ✅ 最大化代码和逻辑复用

### **2. 灵活的参与机制**
- ✅ `task_participations`表支持两种参与方式：`assigned`和`joined`
- ✅ 支持一个任务多个用户参与（挑战模式）
- ✅ 每个用户有独立的进度跟踪

### **3. 详细的完成记录**
- ✅ `task_completions`表记录每次完成的详细信息
- ✅ 支持连续天数跟踪、心情评分、补完成等功能
- ✅ 为未来的数据分析和可视化提供基础

### **4. 向后兼容**
- ✅ 现有的重复任务字段保持不变
- ✅ 新增字段都有合理的默认值
- ✅ 现有功能不受影响

---

## 🚀 **实施优势**

1. **数据一致性**: 所有重复任务使用统一的数据结构
2. **功能完整性**: 支持从简单重复到复杂挑战的所有场景
3. **扩展性**: 可以轻松添加新的任务模式和功能
4. **性能优化**: 合理的索引和查询优化
5. **开发效率**: 统一的API和业务逻辑

这个重新设计的数据结构既保持了现有系统的稳定性，又为习惯任务和未来的功能扩展提供了完整的支持。
