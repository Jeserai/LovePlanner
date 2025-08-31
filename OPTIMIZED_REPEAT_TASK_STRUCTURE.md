# 🔄 优化的重复任务数据结构

## 🎯 **优化建议实现**

### **1. 简化重复字段**
将 `repeat_type` 和 `repeat_frequency` 合并为一个字段：

```sql
-- 原来的设计
repeat_type: 'once' | 'repeat'
repeat_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null

-- 🆕 优化后的设计
repeat_frequency: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever'
```

### **2. 永远重复任务的处理**
添加 `'forever'` 选项来表示永远重复的任务：

```sql
-- 永远重复的任务示例
{
  repeat_frequency: 'forever',
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: null,        -- 永远重复任务没有完成次数限制
  task_deadline: null,         -- 永远重复任务没有截止时间
}
```

---

## 📊 **优化后的数据结构**

### **主表：tasks（优化版）**

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
  repeat_frequency TEXT NOT NULL DEFAULT 'never' CHECK (
    repeat_frequency IN ('never', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'forever')
  ),
  
  -- 🎯 时间配置
  earliest_start_time TIMESTAMPTZ,              -- 最早开始时间
  required_count INTEGER,                       -- 需要完成的次数（forever任务为null）
  task_deadline TIMESTAMPTZ,                    -- 任务截止时间（forever任务为null）
  
  -- 🎯 重复细节配置
  repeat_weekdays INTEGER[],                    -- [1,2,5] 周一、周二、周五
  daily_time_start TIME,                        -- 每日任务时间窗口开始
  daily_time_end TIME,                          -- 每日任务时间窗口结束
  
  -- 🎯 任务状态
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned')),
  assignee_id UUID REFERENCES auth.users(id),
  
  -- 🎯 完成跟踪
  completed_count INTEGER DEFAULT 0,            -- 已完成次数
  current_streak INTEGER DEFAULT 0,             -- 当前连续次数
  longest_streak INTEGER DEFAULT 0,             -- 历史最长连续次数
  completion_record JSONB DEFAULT '{}',         -- 完成记录 {"2024-01-01": true, ...}
  
  -- 🎯 其他字段
  requires_proof BOOLEAN DEFAULT FALSE,
  proof_url TEXT,
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

## 🎯 **不同任务类型示例**

### **1. 一次性任务**
```typescript
{
  title: "修理水龙头",
  repeat_frequency: 'never',           // 🔑 一次性任务
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: 1,                   // 只需要完成1次
  task_deadline: '2024-01-07T23:59:59Z',
  
  // 其他字段为null或默认值
  repeat_weekdays: null,
  daily_time_start: null,
  daily_time_end: null
}
```

### **2. 固定期限的重复任务**
```typescript
{
  title: "21天早起挑战",
  repeat_frequency: 'daily',           // 每日重复
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: 21,                  // 需要完成21次
  task_deadline: '2024-01-21T23:59:59Z', // 正好21天
  daily_time_start: '06:00',
  daily_time_end: '07:00'
}
```

### **3. 灵活期限的重复任务**
```typescript
{
  title: "一个月内健身10次",
  repeat_frequency: 'daily',           // 每日重复（但不要求每天）
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: 10,                  // 需要完成10次
  task_deadline: '2024-01-31T23:59:59Z', // 31天内完成
  
  // 不限制每日时间
  daily_time_start: null,
  daily_time_end: null
}
```

### **4. 永远重复的任务**
```typescript
{
  title: "每日洗碗",
  repeat_frequency: 'forever',         // 🔑 永远重复
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: null,                // 没有完成次数限制
  task_deadline: null,                 // 没有截止时间
  daily_time_start: '19:00',
  daily_time_end: '21:00'
}
```

### **5. 每周固定日期的永远重复任务**
```typescript
{
  title: "每周一三五跑步",
  repeat_frequency: 'forever',         // 永远重复
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: null,
  task_deadline: null,
  repeat_weekdays: [1, 3, 5],          // 周一、三、五
  daily_time_start: '18:00',
  daily_time_end: '20:00'
}
```

---

## 🔧 **优化后的业务逻辑**

### **1. 任务类型判断**
```typescript
function getTaskType(task: Task): 'once' | 'limited_repeat' | 'forever_repeat' {
  if (task.repeat_frequency === 'never') {
    return 'once';
  } else if (task.repeat_frequency === 'forever') {
    return 'forever_repeat';
  } else {
    return 'limited_repeat';
  }
}
```

### **2. 任务完成状态判断**
```typescript
function getTaskCompletionStatus(task: Task): 'not_started' | 'in_progress' | 'completed' | 'overdue' {
  const taskType = getTaskType(task);
  
  switch (taskType) {
    case 'once':
      if (task.completed_count >= 1) return 'completed';
      if (task.task_deadline && new Date() > new Date(task.task_deadline)) return 'overdue';
      if (task.completed_count > 0) return 'in_progress';
      return 'not_started';
      
    case 'limited_repeat':
      if (task.completed_count >= task.required_count!) return 'completed';
      if (task.task_deadline && new Date() > new Date(task.task_deadline)) return 'overdue';
      if (task.completed_count > 0) return 'in_progress';
      return 'not_started';
      
    case 'forever_repeat':
      // 永远重复的任务永远不会"完成"，只有进行中或未开始
      if (task.completed_count > 0) return 'in_progress';
      return 'not_started';
  }
}
```

### **3. 今日是否可以完成任务**
```typescript
function canCompleteTaskToday(task: Task): boolean {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // 检查是否已经开始
  if (task.earliest_start_time && now < new Date(task.earliest_start_time)) {
    return false;
  }
  
  // 检查是否已过期（永远重复的任务不会过期）
  if (task.repeat_frequency !== 'forever' && task.task_deadline && now > new Date(task.task_deadline)) {
    return false;
  }
  
  // 检查今天是否已经完成
  if (task.completion_record[today]) {
    return false;
  }
  
  // 检查是否已经达到完成次数（永远重复的任务没有限制）
  if (task.repeat_frequency !== 'forever' && task.required_count && task.completed_count >= task.required_count) {
    return false;
  }
  
  // 检查每日时间窗口
  if (task.daily_time_start && task.daily_time_end) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < task.daily_time_start || currentTime > task.daily_time_end) {
      return false;
    }
  }
  
  // 检查重复日期限制
  if (task.repeat_weekdays && task.repeat_weekdays.length > 0) {
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    if (!task.repeat_weekdays.includes(dayOfWeek)) {
      return false;
    }
  }
  
  return true;
}
```

### **4. 计算任务进度**
```typescript
function getTaskProgress(task: Task): {
  completed: number;
  total: number | null;
  percentage: number | null;
  isCompleted: boolean;
} {
  const taskType = getTaskType(task);
  
  switch (taskType) {
    case 'once':
      return {
        completed: task.completed_count,
        total: 1,
        percentage: task.completed_count >= 1 ? 100 : 0,
        isCompleted: task.completed_count >= 1
      };
      
    case 'limited_repeat':
      return {
        completed: task.completed_count,
        total: task.required_count!,
        percentage: (task.completed_count / task.required_count!) * 100,
        isCompleted: task.completed_count >= task.required_count!
      };
      
    case 'forever_repeat':
      return {
        completed: task.completed_count,
        total: null,  // 永远重复任务没有总数限制
        percentage: null,
        isCompleted: false  // 永远重复任务永远不会"完成"
      };
  }
}
```

---

## 🗄️ **数据库约束和验证**

```sql
-- 添加约束确保数据一致性
ALTER TABLE tasks 
  -- 一次性任务和有限重复任务必须有required_count
  ADD CONSTRAINT check_required_count_consistency 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly') AND required_count > 0) OR
      (repeat_frequency = 'forever' AND required_count IS NULL)
    ),
  
  -- 永远重复任务不能有截止时间
  ADD CONSTRAINT check_forever_task_deadline 
    CHECK (
      (repeat_frequency = 'forever' AND task_deadline IS NULL) OR
      (repeat_frequency != 'forever')
    ),
  
  -- 一次性任务的required_count必须是1
  ADD CONSTRAINT check_once_task_count 
    CHECK (
      (repeat_frequency = 'never' AND required_count = 1) OR
      (repeat_frequency != 'never')
    );
```

---

## 📊 **TypeScript 接口定义**

```typescript
interface OptimizedTask {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  points: number;
  creator_id: string;
  couple_id: string;
  
  // 任务分类
  task_type: 'daily' | 'habit' | 'special';
  repeat_frequency: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever';
  
  // 时间配置
  earliest_start_time?: string;
  required_count?: number;      // forever任务为null
  task_deadline?: string;       // forever任务为null
  
  // 重复细节
  repeat_weekdays?: number[];
  daily_time_start?: string;
  daily_time_end?: string;
  
  // 状态和执行
  status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned';
  assignee_id?: string;
  
  // 完成跟踪
  completed_count: number;
  current_streak: number;
  longest_streak: number;
  completion_record: Record<string, boolean>;
  
  // 其他
  requires_proof: boolean;
  proof_url?: string;
  review_comment?: string;
  created_at: string;
  updated_at: string;
}

// 任务类型
type TaskType = 'once' | 'limited_repeat' | 'forever_repeat';

// 任务完成状态
type TaskCompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';
```

---

## ✅ **优化后的优势**

### **1. 字段简化**
- ✅ 将两个字段合并为一个，减少复杂性
- ✅ 通过枚举值清晰表达所有任务类型
- ✅ 减少了数据不一致的可能性

### **2. 永远重复任务支持**
- ✅ 明确支持永远重复的任务（如每日家务）
- ✅ 这类任务没有完成次数限制和截止时间
- ✅ 适合长期的生活习惯和日常任务

### **3. 逻辑清晰**
- ✅ 每种任务类型有明确的数据约束
- ✅ 业务逻辑更加简单直观
- ✅ 前端显示逻辑更容易实现

### **4. 向后兼容**
- ✅ 可以通过数据迁移脚本平滑升级
- ✅ 现有的任务逻辑基本不需要改动
- ✅ API接口保持稳定

这个优化设计既简化了数据结构，又完整支持了所有任务类型，包括永远重复的任务，非常适合情侣应用的实际使用场景。
