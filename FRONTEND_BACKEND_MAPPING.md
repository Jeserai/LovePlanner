# 前后端字段映射关系分析

## 📊 数据结构对比

### 1. 基础字段映射

| 前端字段 (Task) | 数据库字段 (tasks) | 映射关系 | 问题 |
|---|---|---|---|
| `id` | `id` | ✅ 1:1 直接映射 | - |
| `title` | `title` | ✅ 1:1 直接映射 | - |
| `description` | `description` | ✅ 1:1 直接映射，DB可空 | - |
| `points` | `points` | ✅ 1:1 直接映射 | - |
| `creator` | `creator_id` | ❌ 字符串 vs ID | 前端存用户名，DB存ID |
| `assignee` | `assignee_id` | ❌ 字符串 vs ID | 前端存用户名，DB存ID |
| `createdAt` | `created_at` | ✅ 1:1 直接映射 | - |
| `requiresProof` | `requires_proof` | ✅ 1:1 直接映射 | - |
| `proof` | `proof_url` | ✅ 1:1 直接映射 | - |
| `taskType` | `task_type` | ✅ 1:1 直接映射 | - |
| `repeatType` | `repeat_type` | ✅ 1:1 直接映射 | - |
| `reviewComment` | `review_comment` | ✅ 1:1 直接映射 | - |
| `submittedAt` | `submitted_at` | ✅ 1:1 直接映射 | - |

### 2. 状态字段映射

| 前端字段 | 数据库字段 | 映射关系 | 问题 |
|---|---|---|---|
| `status` | `status` | ❌ 类型不匹配 | **严重问题** |

#### 状态枚举对比
```typescript
// 前端：8种状态（包含不存在的状态）
'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review' | 'interrupted' | 'waiting_to_start'

// 数据库：6种状态
'recruiting' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'abandoned'

// ❌ 问题：'interrupted', 'waiting_to_start' 在数据库中不存在
```

### 3. 时间字段映射（重大问题区域）

| 前端字段 | 数据库字段 | 映射关系 | 问题 |
|---|---|---|---|
| `deadline` | `deadline` | ❌ 可空性冲突 | **前端nullable，DB必填** |
| `taskStartTime` | `task_start_time` | ✅ 1:1 直接映射 | - |
| `taskEndTime` | `task_end_time` | ✅ 1:1 直接映射 | - |
| `startDate` | `start_date` | ✅ 1:1 直接映射 | - |
| `endDate` | `end_date` | ✅ 1:1 直接映射 | - |
| `repeatTime` | `repeat_time` | ✅ 1:1 直接映射 | - |
| `repeatWeekdays` | `repeat_weekdays` | ✅ 1:1 直接映射 | - |
| `repeatFrequency` | `repeat_frequency` | ✅ 1:1 直接映射 | - |

#### 时间字段逻辑问题
```typescript
// 前端逻辑：deadline可以为null（不限时任务）
deadline: string | null

// 数据库定义：deadline必填
deadline: string

// ❌ 冲突：前端设置null时，数据库会报错
```

### 4. 连续任务字段（架构严重问题）

| 前端字段 | 数据库字段 | 映射关系 | 问题 |
|---|---|---|---|
| `consecutiveCount` | ❌ **不存在** | 无映射 | **数据库中没有此字段** |
| `currentStreak` | ❌ **不存在** | 无映射 | **数据库中没有此字段** |
| `streakStartDate` | ❌ **不存在** | 无映射 | **数据库中没有此字段** |
| `completionRecord` | ❌ **不存在** | 无映射 | **数据库中没有此字段** |

#### 连续任务功能问题
```typescript
// 前端代码尝试保存连续任务字段
dbTaskData.consecutive_count = newTask.consecutiveCount;     // ❌ 数据库字段不存在
dbTaskData.current_streak = 0;                              // ❌ 数据库字段不存在
dbTaskData.completion_record = JSON.stringify([]);          // ❌ 数据库字段不存在

// 这会导致数据库保存失败！
```

### 5. 前端独有字段（数据库中不存在）

| 前端字段 | 用途 | 问题 |
|---|---|---|
| `consecutiveCount` | 连续次数设置 | 无数据库支持 |
| `currentStreak` | 当前连续完成次数 | 无数据库支持 |
| `streakStartDate` | 连续开始日期 | 无数据库支持 |
| `completionRecord` | 完成记录JSON | 无数据库支持 |

### 6. 数据库独有字段（前端未映射）

| 数据库字段 | 类型 | 前端映射 | 问题 |
|---|---|---|---|
| `couple_id` | string | ❌ 无映射 | 前端不存储情侣关系ID |
| `has_specific_time` | boolean | ❌ 无映射 | 前端不使用此标志 |
| `duration` | enum | ❌ 无映射 | 前端用number，DB用枚举 |
| `proof_type` | string | ❌ 无映射 | 前端不存储凭证类型 |
| `completed_at` | string | ❌ 无映射 | 前端不跟踪完成时间 |
| `updated_at` | string | ❌ 无映射 | 前端不跟踪更新时间 |

## 🚨 严重问题汇总

### 1. **连续任务功能架构缺陷**
```sql
-- 数据库中缺失的必要字段
ALTER TABLE tasks ADD COLUMN consecutive_count INTEGER;
ALTER TABLE tasks ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN streak_start_date DATE;
ALTER TABLE tasks ADD COLUMN completion_record JSONB;
```

### 2. **deadline字段类型冲突**
```typescript
// 问题：前端可空，数据库必填
// 前端
deadline: string | null

// 数据库
deadline: string  // 必填

// 解决方案：修改数据库为可空
deadline: string | null
```

### 3. **duration字段类型不匹配**
```typescript
// 前端：数字类型（天数）
duration: number

// 数据库：枚举类型
duration: '21days' | '1month' | '6months' | '1year' | null

// 需要转换函数进行映射
```

### 4. **用户字段映射混乱**
```typescript
// 前端存储用户名字符串
creator: string
assignee: string

// 数据库存储用户ID
creator_id: string
assignee_id: string

// 需要userMap进行转换，增加复杂度
```

## 📝 EditTaskState vs newTask State 对比

### EditTaskState字段（20个）
```typescript
interface EditTaskState {
  title?: string;
  description?: string;
  taskType?: 'daily' | 'habit' | 'special';
  points?: number;
  requiresProof?: boolean;
  isUnlimited?: boolean;           // UI逻辑字段
  repeat?: 'never' | 'daily'...;  // UI逻辑字段
  taskStartTime?: string;
  taskEndTime?: string;
  repeatStartDate?: string;
  endRepeat?: 'never' | 'on_date'; // UI逻辑字段
  endRepeatDate?: string;
  taskTimeStart?: string;
  taskTimeEnd?: string;
  duration?: number;
  consecutiveCount?: number;
}
```

### newTask State字段（15个）
```typescript
const newTask = {
  title: '',
  description: '',
  taskType: 'daily',
  points: 50,
  requiresProof: false,
  isUnlimited: false,             // UI逻辑字段
  repeat: 'never',                // UI逻辑字段
  taskStartTime: '',
  taskEndTime: '',
  repeatStartDate: '',
  endRepeat: 'never',             // UI逻辑字段
  endRepeatDate: '',
  taskTimeStart: '',
  taskTimeEnd: '',
  duration: 0,
  consecutiveCount: 7
}
```

### UI逻辑字段问题
```typescript
// 这些字段只存在于前端表单中，不映射到数据库
isUnlimited: boolean     // 用于控制UI显示
repeat: 'never' | ...    // 转换为repeat_type和repeat_frequency
endRepeat: 'never' | ... // 控制是否设置end_date
duration: number         // 计算字段，不直接存储
```

## 🔧 数据转换函数分析

### 1. 数据库到前端转换 (convertDatabaseTaskToTask)
```typescript
const convertDatabaseTaskToTask = (dbTask: DatabaseTask): Task => {
  return {
    // ✅ 正确映射
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    deadline: dbTask.deadline,  // ❌ 类型冲突问题
    
    // ❌ 用户字段转换（需要userMap）
    creator: userMap[dbTask.creator_id] || dbTask.creator_id,
    assignee: dbTask.assignee_id ? (userMap[dbTask.assignee_id] || dbTask.assignee_id) : undefined,
    
    // ❌ 连续任务字段缺失，返回undefined
    consecutiveCount: undefined,  // dbTask.consecutive_count不存在
    currentStreak: undefined,     // dbTask.current_streak不存在
    streakStartDate: undefined,   // dbTask.streak_start_date不存在
    completionRecord: undefined   // dbTask.completion_record不存在
  };
};
```

### 2. 前端到数据库转换 (handleCreateTask)
```typescript
// 根据UI状态构建数据库对象
const dbTaskData: any = {
  title: newTask.title,
  deadline: newTask.isUnlimited ? null : new Date(newTask.taskEndTime).toISOString(),
  // ❌ 类型冲突：DB定义deadline为必填，但这里可能传null
  
  // ❌ 连续任务字段映射到不存在的DB字段
  consecutive_count: newTask.consecutiveCount,     // 数据库字段不存在
  current_streak: 0,                              // 数据库字段不存在
  completion_record: JSON.stringify([])           // 数据库字段不存在
};
```

## 🎯 优化建议

### 1. **立即修复架构问题**
```sql
-- 添加缺失的连续任务字段
ALTER TABLE tasks ADD COLUMN consecutive_count INTEGER;
ALTER TABLE tasks ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN streak_start_date DATE;
ALTER TABLE tasks ADD COLUMN completion_record JSONB;

-- 修复deadline字段类型
ALTER TABLE tasks ALTER COLUMN deadline DROP NOT NULL;
```

### 2. **简化数据结构**
```typescript
// 统一时间概念
interface SimplifiedTask {
  // 核心字段
  id: string;
  title: string;
  description: string;
  
  // 统一时间字段
  start_time: string | null;      // 可选开始时间
  end_time: string | null;        // 可选结束时间（原deadline）
  
  // 重复设置
  repeat_type: 'once' | 'repeat';
  repeat_frequency?: string;
  repeat_start_date?: string;
  repeat_end_date?: string;
  
  // 连续任务字段
  consecutive_count?: number;
  current_streak?: number;
  completion_record?: string;
  
  // 移除的冗余字段
  // ❌ taskStartTime (合并到start_time)
  // ❌ taskEndTime (合并到end_time)  
  // ❌ startDate (重命名为repeat_start_date)
  // ❌ endDate (重命名为repeat_end_date)
}
```

### 3. **统一转换层**
```typescript
// 创建专门的数据转换服务
class TaskDataMapper {
  static toFrontend(dbTask: DatabaseTask): Task {
    // 统一的DB到前端转换逻辑
  }
  
  static toDatabase(frontendTask: NewTaskData): DatabaseInsert {
    // 统一的前端到DB转换逻辑
  }
  
  static validateMapping(task: any): boolean {
    // 验证数据映射的完整性
  }
}
```

这个映射分析暴露了当前架构的严重问题，特别是连续任务功能完全基于不存在的数据库字段。需要立即进行架构修复。
