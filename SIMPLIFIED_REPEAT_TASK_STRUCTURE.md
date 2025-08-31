# 🔄 简化的重复任务数据结构（情侣应用）

## 🎯 **核心理念**

1. **情侣应用**：只有两个用户，任务领取者只有一个
2. **时间逻辑清晰**：通过开始时间、持续次数、截止时间来确定任务性质
3. **简单实用**：不需要复杂的多用户参与机制

---

## 📊 **简化的数据结构**

### **主表：tasks（简化扩展）**

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
  
  -- 🎯 重复任务的时间配置
  repeat_frequency TEXT CHECK (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  earliest_start_time TIMESTAMPTZ,      -- 🆕 最早开始时间
  required_count INTEGER,               -- 🆕 需要完成的次数
  task_deadline TIMESTAMPTZ,            -- 🆕 任务截止时间
  
  -- 🎯 重复细节配置
  repeat_weekdays INTEGER[],            -- [1,2,5] 周一、周二、周五
  daily_time_start TIME,                -- 每日任务时间窗口开始
  daily_time_end TIME,                  -- 每日任务时间窗口结束
  
  -- 🎯 任务状态
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned')),
  assignee_id UUID REFERENCES auth.users(id),
  
  -- 🎯 完成跟踪
  completed_count INTEGER DEFAULT 0,    -- 已完成次数
  current_streak INTEGER DEFAULT 0,     -- 当前连续次数
  completion_record JSONB,              -- 完成记录 {"2024-01-01": true, "2024-01-02": false, ...}
  
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

## 🕐 **时间逻辑设计**

### **核心时间字段**
1. **`earliest_start_time`** - 最早开始时间
2. **`required_count`** - 需要完成的次数  
3. **`task_deadline`** - 任务截止时间
4. **`repeat_frequency`** - 重复频率

### **时间计算逻辑**

```typescript
// 计算理论完成时间
function calculateTheoreticalDuration(
  startTime: Date, 
  requiredCount: number, 
  frequency: 'daily' | 'weekly' | 'monthly'
): Date {
  const start = new Date(startTime);
  
  switch (frequency) {
    case 'daily':
      return new Date(start.getTime() + (requiredCount - 1) * 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(start.getTime() + (requiredCount - 1) * 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const result = new Date(start);
      result.setMonth(result.getMonth() + (requiredCount - 1));
      return result;
  }
}

// 判断任务时间类型
function getTaskTimeType(task: Task): 'fixed_schedule' | 'flexible_range' {
  const theoreticalEnd = calculateTheoreticalDuration(
    new Date(task.earliest_start_time),
    task.required_count,
    task.repeat_frequency
  );
  
  const actualDeadline = new Date(task.task_deadline);
  
  // 如果理论完成时间 = 截止时间，说明是固定时间完成
  if (Math.abs(theoreticalEnd.getTime() - actualDeadline.getTime()) < 24 * 60 * 60 * 1000) {
    return 'fixed_schedule';
  } else {
    return 'flexible_range';
  }
}
```

---

## 📋 **任务类型示例**

### **示例1: 固定时间的重复任务**
```typescript
{
  title: "连续21天早起打卡",
  repeat_frequency: 'daily',
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: 21,
  task_deadline: '2024-01-21T23:59:59Z',     // 正好21天
  daily_time_start: '06:00',
  daily_time_end: '07:00',
  
  // 计算结果：fixed_schedule
  // 用户必须从1月1日开始，连续21天，每天6-7点完成
}
```

### **示例2: 灵活时间的重复任务**
```typescript
{
  title: "一个月内完成10次健身",
  repeat_frequency: 'daily',
  earliest_start_time: '2024-01-01T00:00:00Z',
  required_count: 10,
  task_deadline: '2024-01-31T23:59:59Z',     // 31天内完成10次
  daily_time_start: null,                    // 不限制每日时间
  daily_time_end: null,
  
  // 计算结果：flexible_range
  // 用户可以在1月1日-31日期间，任选10天完成健身
}
```

### **示例3: 每周固定的重复任务**
```typescript
{
  title: "每周一三五跑步，持续4周",
  repeat_frequency: 'weekly',
  earliest_start_time: '2024-01-01T00:00:00Z',  // 周一开始
  required_count: 12,                           // 4周 × 3次/周 = 12次
  task_deadline: '2024-01-28T23:59:59Z',        // 正好4周
  repeat_weekdays: [1, 3, 5],                   // 周一、三、五
  daily_time_start: '18:00',
  daily_time_end: '20:00',
  
  // 计算结果：fixed_schedule
  // 用户必须在指定的12个时间点完成
}
```

---

## 🎯 **TypeScript 接口**

```typescript
interface SimplifiedRepeatTask {
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
  
  // 🎯 核心时间配置
  repeat_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  earliest_start_time: string;      // 最早开始时间
  required_count: number;           // 需要完成的次数
  task_deadline: string;            // 任务截止时间
  
  // 重复细节
  repeat_weekdays?: number[];       // 每周重复的日子
  daily_time_start?: string;        // 每日时间窗口开始
  daily_time_end?: string;          // 每日时间窗口结束
  
  // 状态和执行
  status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned';
  assignee_id?: string;
  
  // 完成跟踪
  completed_count: number;
  current_streak: number;
  completion_record: Record<string, boolean>;  // {"2024-01-01": true, ...}
  
  // 其他
  requires_proof: boolean;
  proof_url?: string;
  review_comment?: string;
  created_at: string;
  updated_at: string;
}

// 任务时间类型
type TaskTimeType = 'fixed_schedule' | 'flexible_range';

// 任务时间信息
interface TaskTimeInfo {
  type: TaskTimeType;
  theoretical_duration_days: number;
  available_days: number;
  flexibility_days: number;  // available_days - theoretical_duration_days
}
```

---

## 🔧 **核心业务逻辑**

### **1. 任务创建验证**
```typescript
function validateRepeatTask(task: Partial<SimplifiedRepeatTask>): boolean {
  // 验证时间逻辑合理性
  const startTime = new Date(task.earliest_start_time!);
  const deadline = new Date(task.task_deadline!);
  
  if (startTime >= deadline) {
    throw new Error('开始时间不能晚于截止时间');
  }
  
  const theoreticalEnd = calculateTheoreticalDuration(
    startTime, 
    task.required_count!, 
    task.repeat_frequency!
  );
  
  if (theoreticalEnd > deadline) {
    throw new Error('时间不足以完成所需次数');
  }
  
  return true;
}
```

### **2. 任务完成检查**
```typescript
function canCompleteTaskToday(task: SimplifiedRepeatTask): boolean {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // 检查是否在任务期间内
  if (now < new Date(task.earliest_start_time) || now > new Date(task.task_deadline)) {
    return false;
  }
  
  // 检查今天是否已经完成
  if (task.completion_record[today]) {
    return false;
  }
  
  // 检查是否在每日时间窗口内（如果有限制）
  if (task.daily_time_start && task.daily_time_end) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < task.daily_time_start || currentTime > task.daily_time_end) {
      return false;
    }
  }
  
  // 检查是否在指定的重复日期（如果有限制）
  if (task.repeat_weekdays && task.repeat_weekdays.length > 0) {
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 转换为1-7
    if (!task.repeat_weekdays.includes(dayOfWeek)) {
      return false;
    }
  }
  
  return true;
}
```

### **3. 进度更新**
```typescript
function updateTaskProgress(task: SimplifiedRepeatTask, completionDate: string): SimplifiedRepeatTask {
  const updatedRecord = {
    ...task.completion_record,
    [completionDate]: true
  };
  
  const completedCount = Object.values(updatedRecord).filter(Boolean).length;
  
  // 计算连续天数
  const currentStreak = calculateCurrentStreak(updatedRecord, completionDate);
  
  return {
    ...task,
    completion_record: updatedRecord,
    completed_count: completedCount,
    current_streak: currentStreak,
    status: completedCount >= task.required_count ? 'completed' : 'in_progress'
  };
}
```

---

## ✅ **简化设计的优势**

1. **符合应用场景**：专为情侣应用设计，不需要复杂的多用户机制
2. **时间逻辑清晰**：通过三个核心时间字段就能表达所有时间需求
3. **实现简单**：不需要额外的参与表和完成记录表
4. **性能优良**：所有数据都在主表中，查询效率高
5. **易于理解**：开发和维护都更加简单

这个简化的设计既满足了重复任务和习惯任务的所有需求，又保持了系统的简洁性和高效性。
