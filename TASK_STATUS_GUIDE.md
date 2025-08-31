# 📋 任务状态详细说明

## 🎯 任务状态定义

系统中定义了6种任务状态：

```typescript
export type TaskStatus = 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review';
```

## 📊 状态详细说明

### 1. `recruiting` - 招募中
**含义：** 任务已创建，等待其他用户领取
**判断条件：**
- 任务刚创建时的初始状态
- 任务被重新发布时恢复此状态
- `assignee_id` 为 `null`

**可执行操作：**
- ✅ 其他用户可以领取任务
- ✅ 创建者可以编辑任务
- ✅ 创建者可以删除任务
- ✅ 系统可以自动将过期任务转为 `abandoned`

**UI显示：**
- 蓝色边框 (`border-blue-300 bg-blue-50`)
- 显示"招募中"标签

### 2. `assigned` - 已分配
**含义：** 任务已被用户领取，但尚未开始执行
**状态转换：** `recruiting` → `assigned`
**触发条件：** 用户点击"领取任务"

**判断逻辑：**
```typescript
// 在 assignTask 方法中
await supabase
  .from('tasks')
  .update({ 
    assignee_id: assigneeId,
    status: 'assigned'
  })
```

**可执行操作：**
- ✅ 领取者可以开始任务 (`assigned` → `in_progress`)
- ✅ 领取者可以放弃任务 (`assigned` → `abandoned`)
- ✅ 系统可以自动将过期任务转为 `abandoned`

**UI显示：**
- 黄色边框 (`border-yellow-300 bg-yellow-50`)
- 显示"已分配"标签
- 显示"开始任务"和"放弃任务"按钮

### 3. `in_progress` - 进行中
**含义：** 任务正在执行中
**状态转换：** `assigned` → `in_progress`
**触发条件：** 用户点击"开始任务"

**判断逻辑：**
```typescript
// 在 startTask 方法中
await supabase
  .from('tasks')
  .update({ status: 'in_progress' })
```

**可执行操作：**
- ✅ 领取者可以完成任务 (`in_progress` → `completed` 或保持 `in_progress`)
- ✅ 领取者可以放弃任务 (`in_progress` → `abandoned`)
- ✅ 系统可以自动将过期任务转为 `abandoned`

**UI显示：**
- 蓝色边框 (`border-blue-300 bg-blue-50`)
- 显示"进行中"标签
- 显示"完成任务"和"放弃任务"按钮

### 4. `completed` - 已完成
**含义：** 任务已完成（一次性任务或重复任务达到要求次数）
**状态转换：** `in_progress` → `completed`
**触发条件：** 满足完成条件时自动转换

**判断逻辑：**
```typescript
// 在 completeTask 方法中
let newStatus = currentTask.status;
if (currentTask.repeat_frequency === 'never' || 
    (currentTask.required_count && newCompletedCount >= currentTask.required_count)) {
  newStatus = 'completed';
}
```

**完成条件：**
- **一次性任务** (`repeat_frequency === 'never'`)：执行一次即完成
- **重复任务**：完成次数达到 `required_count`
- **永远重复任务** (`repeat_frequency === 'forever'`)：永远不会自动变为 `completed`

**可执行操作：**
- ❌ 无法再执行任何操作（终态）
- ✅ 可以查看任务详情和完成记录

**UI显示：**
- 绿色边框 (`border-green-300 bg-green-50`)
- 显示"已完成"标签
- 显示完成时间和统计信息

### 5. `abandoned` - 已关闭
**含义：** 任务被放弃或因过期被系统关闭
**状态转换：** 任何状态 → `abandoned`
**触发条件：**

1. **手动放弃：** 用户主动放弃任务
2. **系统自动：** 任务过期时自动转换

**判断逻辑：**
```typescript
// 手动放弃
await supabase
  .from('tasks')
  .update({ 
    status: 'abandoned',
    assignee_id: null
  })

// 自动过期检查
const overdueTasksUpdates = tasks.filter(task => 
  (task.status === 'in_progress' && isTaskOverdue(task)) ||
  (task.status === 'assigned' && isTaskOverdue(task)) ||
  (task.status === 'recruiting' && isTaskOverdue(task))
);
```

**可执行操作：**
- ✅ 创建者可以重新发布任务 (`abandoned` → `recruiting`)
- ✅ 创建者可以删除任务

**UI显示：**
- 红色边框 (`border-red-300 bg-red-50`)
- 显示"已关闭"标签
- 显示"重新发布"按钮（仅创建者）

### 6. `pending_review` - 待审核
**含义：** 任务已提交，等待审核（当任务需要凭证时）
**状态转换：** `in_progress` → `pending_review`
**触发条件：** 提交需要审核的任务完成凭证

**注意：** 这个状态在当前代码中已定义但似乎未完全实现使用逻辑

## 🔄 状态转换图

```
创建任务
    ↓
recruiting (招募中)
    ↓ (用户领取)
assigned (已分配)
    ↓ (开始任务)
in_progress (进行中)
    ↓ (完成任务)
completed (已完成)

任何状态都可以转换为：
    ↓ (放弃/过期)
abandoned (已关闭)
    ↓ (重新发布)
recruiting (招募中)
```

## 🎨 UI状态显示

### 状态颜色编码
```typescript
const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'recruiting': return 'border-blue-300 bg-blue-50';    // 蓝色
    case 'assigned': return 'border-yellow-300 bg-yellow-50';  // 黄色  
    case 'in_progress': return 'border-blue-300 bg-blue-50';   // 蓝色
    case 'completed': return 'border-green-300 bg-green-50';   // 绿色
    case 'abandoned': return 'border-red-300 bg-red-50';       // 红色
    case 'pending_review': return 'border-purple-300 bg-purple-50'; // 紫色
  }
};
```

### 状态文本显示
```typescript
const getStatusName = (status: TaskStatus) => {
  const statusNames = {
    'recruiting': '招募中',
    'assigned': '已分配', 
    'in_progress': '进行中',
    'completed': '已完成',
    'abandoned': '已关闭',
    'pending_review': '待审核'
  };
  return statusNames[status];
};
```

## 🔍 状态过滤和分组

### 任务列表分组
系统按状态对任务进行分组显示：

**我发布的任务：**
- 活跃任务：`recruiting` + `in_progress`
- 已完成任务：`completed`
- 已关闭任务：`abandoned`

**我领取的任务：**
- 未开始：`assigned`
- 进行中：`in_progress`
- 已完成：`completed`
- 已放弃：`abandoned`

**可领取的任务：**
- 仅显示：`recruiting` 状态且非自己创建的任务

## ⚠️ 特殊情况处理

### 过期任务自动处理
```typescript
const moveOverdueTasksToAbandoned = async () => {
  const overdueTasksUpdates = tasks.filter(task => 
    (task.status === 'in_progress' && isTaskOverdue(task)) ||
    (task.status === 'assigned' && isTaskOverdue(task)) ||
    (task.status === 'recruiting' && isTaskOverdue(task))
  );
  
  // 批量更新为 abandoned 状态
  for (const task of overdueTasksUpdates) {
    await updateTaskInDatabase(task.id, { status: 'abandoned' });
  }
};
```

### 重复任务的特殊逻辑
- **永远重复任务** (`repeat_frequency: 'forever'`)：永远保持 `in_progress`，不会自动变为 `completed`
- **限次重复任务**：达到 `required_count` 后自动变为 `completed`
- **一次性任务**：完成一次后立即变为 `completed`

## 🐛 潜在问题

1. **`pending_review` 状态未完全实现**：虽然在类型定义中存在，但实际业务逻辑中未使用
2. **状态转换权限控制**：需要确保只有相关用户才能执行状态转换操作
3. **并发问题**：多用户同时操作同一任务时可能出现状态冲突

这就是当前系统中任务状态的完整说明！每个状态都有明确的含义和转换条件。
