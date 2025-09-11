# 📅 任务-日历联动详细方案

## 🎯 总体设计思路

### 核心原则
1. **智能过滤**：只有有时间意义的任务才显示在日历上
2. **清晰区分**：任务事件与普通事件在视觉上有明显区别
3. **双向同步**：任务状态变化自动反映到日历，日历操作可以影响任务
4. **用户控制**：用户可以选择是否显示任务事件

## 📊 任务分类与显示策略

### 🟢 一级显示（高优先级）

#### A. 截止日期任务
```typescript
显示条件: task_deadline !== null
显示方式: 在截止日期显示红色提醒事件
图标: 📅
颜色: #ef4444 (红色)
标题格式: "📅 [任务名] - 截止"
```

#### B. 固定时间任务
```typescript
显示条件: daily_time_start && daily_time_end
显示方式: 在指定时间段显示蓝色时间块
图标: ⏰
颜色: #3b82f6 (蓝色)
标题格式: "⏰ [任务名]"
```

#### C. 固定星期重复任务
```typescript
显示条件: repeat_weekdays.length > 0
显示方式: 在指定星期几显示紫色事件
图标: 🔄
颜色: #8b5cf6 (紫色)
标题格式: "🔄 [任务名] - 每周[星期几]"
```

### 🟡 二级显示（中优先级）

#### D. 每日习惯任务
```typescript
显示条件: repeat_frequency === 'daily' || task_type === 'habit'
显示方式: 每天显示绿色全天提醒条
图标: 🌱
颜色: #10b981 (绿色)
标题格式: "🌱 [任务名] - 习惯"
位置: 日历顶部作为全天事件
```

#### E. 开始时间提醒
```typescript
显示条件: earliest_start_time !== null
显示方式: 在开始时间显示黄色提醒
图标: 🔔
颜色: #f59e0b (黄色)
标题格式: "🔔 [任务名] - 开始提醒"
```

### 🔴 不显示的任务

```typescript
不显示条件:
- status === 'recruiting' (未被领取)
- status === 'abandoned' (已放弃)
- 无任何时间信息的任务
- 纯粹的任务池任务（等待分配）
```

## 🎨 视觉设计方案

### 事件样式区分
```css
/* 普通事件 */
.calendar-event {
  border-left: 4px solid var(--event-color);
  background: var(--event-bg);
}

/* 任务事件 */
.calendar-task-event {
  border-left: 4px solid var(--task-color);
  background: linear-gradient(135deg, var(--task-bg) 0%, var(--task-bg-light) 100%);
  border-radius: 6px;
  position: relative;
}

/* 任务状态指示器 */
.task-status-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-completed { background: #10b981; }
.task-in-progress { background: #f59e0b; }
.task-overdue { background: #ef4444; }
```

### 任务类型图标映射
```typescript
const taskIconMap = {
  'deadline': '📅',
  'scheduled': '⏰', 
  'repeat': '🔄',
  'habit': '🌱',
  'reminder': '🔔'
};

const statusIconMap = {
  'completed': '✅',
  'in_progress': '🔄',
  'pending_review': '👀',
  'overdue': '⚠️'
};
```

## 🔧 功能实现细节

### 1. 日历视图增强

#### A. 任务筛选器
```typescript
interface TaskCalendarFilter {
  showTasks: boolean;              // 是否显示任务
  showTaskTypes: TaskDisplayType[]; // 显示的任务类型
  showOnlyMyTasks: boolean;        // 只显示我的任务
  showCompletedTasks: boolean;     // 显示已完成任务
}

const defaultFilter: TaskCalendarFilter = {
  showTasks: true,
  showTaskTypes: ['deadline', 'scheduled', 'habit'],
  showOnlyMyTasks: false,
  showCompletedTasks: false
};
```

#### B. 日历工具栏扩展
```typescript
// 在现有的日历工具栏添加任务控制
const CalendarToolbar = () => (
  <div className="calendar-toolbar">
    {/* 现有的视图切换按钮 */}
    <ViewSwitcher />
    
    {/* 新增：任务显示控制 */}
    <div className="task-controls">
      <TaskFilterToggle />
      <TaskTypeSelector />
      <TaskStatusFilter />
    </div>
  </div>
);
```

### 2. 任务事件交互

#### A. 点击事件处理
```typescript
const handleTaskEventClick = (taskEvent: TaskCalendarEvent) => {
  const actions = [
    { label: '查看任务详情', action: () => showTaskDetail(taskEvent.taskId) },
    { label: '标记完成', action: () => completeTask(taskEvent.taskId), 
      show: taskEvent.canComplete },
    { label: '编辑任务', action: () => editTask(taskEvent.taskId),
      show: taskEvent.originalTask.creator_id === currentUserId },
    { label: '添加到我的日历', action: () => convertToEvent(taskEvent) }
  ];
  
  showContextMenu(actions);
};
```

#### B. 拖拽支持
```typescript
const handleTaskEventDrop = (taskEvent: TaskCalendarEvent, newDate: string, newTime?: string) => {
  // 只允许调整时间安排类的任务
  if (taskEvent.taskType === 'scheduled') {
    updateTaskSchedule(taskEvent.taskId, newDate, newTime);
  } else {
    showMessage('此类型任务无法调整时间');
  }
};
```

### 3. 状态同步机制

#### A. 任务状态变化监听
```typescript
// 监听任务状态变化
const useTaskStatusSync = () => {
  useEffect(() => {
    const subscription = supabase
      .channel('task-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        // 重新生成日历事件
        refreshCalendarEvents();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);
};
```

#### B. 完成状态实时更新
```typescript
const updateTaskCompletion = async (taskId: string, date: string, completed: boolean) => {
  // 更新任务完成状态
  await taskService.updateTaskCompletion(taskId, date, completed);
  
  // 立即更新日历显示
  updateCalendarEvent(`task-${taskId}-${date}`, {
    color: completed ? '#10b981' : originalColor,
    title: completed ? `✅ ${originalTitle}` : originalTitle
  });
};
```

## 🎮 用户界面增强

### 1. 设置页面新增选项

```typescript
// Settings.tsx 中添加
const TaskCalendarSettings = () => (
  <Card className="task-calendar-settings">
    <h3>任务-日历联动</h3>
    
    <div className="setting-group">
      <label>
        <input type="checkbox" checked={showTasksInCalendar} />
        在日历中显示任务
      </label>
    </div>
    
    <div className="setting-group">
      <label>任务显示类型</label>
      <MultiSelect
        options={taskDisplayTypes}
        value={selectedTaskTypes}
        onChange={setSelectedTaskTypes}
      />
    </div>
    
    <div className="setting-group">
      <label>
        <input type="checkbox" checked={showCompletedTasks} />
        显示已完成的任务
      </label>
    </div>
    
    <div className="setting-group">
      <label>
        <input type="checkbox" checked={autoCreateEvents} />
        自动将重要任务转为日历事件
      </label>
    </div>
  </Card>
);
```

### 2. 任务事件详情弹窗

```typescript
const TaskEventDetail = ({ taskEvent }: { taskEvent: TaskCalendarEvent }) => (
  <Modal>
    <div className="task-event-detail">
      <div className="event-header">
        <span className="task-type-icon">{getTaskTypeIcon(taskEvent.taskType)}</span>
        <h2>{taskEvent.title}</h2>
        <TaskStatusBadge status={taskEvent.taskStatus} />
      </div>
      
      <div className="event-info">
        <InfoRow label="积分奖励" value={`${taskEvent.originalTask.points} 分`} />
        <InfoRow label="创建者" value={getUserName(taskEvent.createdBy)} />
        <InfoRow label="负责人" value={getUserName(taskEvent.originalTask.assignee_id)} />
        
        {taskEvent.originalTask.task_deadline && (
          <InfoRow label="截止时间" value={formatDateTime(taskEvent.originalTask.task_deadline)} />
        )}
      </div>
      
      <div className="event-actions">
        {taskEvent.canComplete && (
          <Button onClick={() => completeTaskFromCalendar(taskEvent.taskId)}>
            标记完成
          </Button>
        )}
        
        <Button variant="outline" onClick={() => viewTaskDetail(taskEvent.taskId)}>
          查看任务详情
        </Button>
        
        <Button variant="outline" onClick={() => convertTaskToEvent(taskEvent)}>
          转为日历事件
        </Button>
      </div>
    </div>
  </Modal>
);
```

## 🔄 高级功能

### 1. 智能建议系统

```typescript
const TaskSchedulingSuggestion = {
  // 根据任务特点建议最佳时间
  suggestOptimalTime: (task: Task) => {
    const suggestions = [];
    
    if (task.task_type === 'habit') {
      suggestions.push({
        time: '08:00',
        reason: '习惯任务建议在早上进行，有利于养成规律'
      });
    }
    
    if (task.points >= 50) {
      suggestions.push({
        time: '14:00-16:00', 
        reason: '高积分任务建议在精力充沛的下午时段完成'
      });
    }
    
    return suggestions;
  },
  
  // 检测时间冲突
  detectConflicts: (task: Task, proposedTime: string) => {
    // 检查同时间段是否有其他重要任务或事件
    const conflicts = getEventsAtTime(proposedTime);
    return conflicts.filter(event => event.priority >= task.priority);
  }
};
```

### 2. 任务-事件转换

```typescript
const convertTaskToEvent = async (taskEvent: TaskCalendarEvent) => {
  const event = {
    title: taskEvent.originalTask.title,
    description: `从任务转换: ${taskEvent.originalTask.description}`,
    date: taskEvent.date,
    time: taskEvent.time,
    isAllDay: taskEvent.isAllDay,
    color: taskEvent.color,
    category: 'converted-task',
    originalTaskId: taskEvent.taskId
  };
  
  await eventService.createEvent(event);
  
  // 询问是否隐藏原任务事件
  const hideOriginal = await confirmDialog('是否在日历中隐藏原任务显示？');
  if (hideOriginal) {
    updateTaskCalendarVisibility(taskEvent.taskId, false);
  }
};
```

### 3. 批量操作

```typescript
const BatchTaskOperations = {
  // 批量标记完成
  markMultipleComplete: async (taskIds: string[], date: string) => {
    for (const taskId of taskIds) {
      await taskService.completeTask(taskId, date);
    }
    refreshCalendarEvents();
  },
  
  // 批量调整时间
  rescheduleMultiple: async (taskIds: string[], newTimeSlot: TimeSlot) => {
    for (const taskId of taskIds) {
      await taskService.updateTaskSchedule(taskId, newTimeSlot);
    }
    refreshCalendarEvents();
  }
};
```

## 📱 响应式适配

### 移动端优化
```typescript
const MobileTaskCalendarView = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`calendar-container ${isMobile ? 'mobile' : 'desktop'}`}>
      {isMobile ? (
        <CompactTaskCalendar />
      ) : (
        <FullTaskCalendar />
      )}
    </div>
  );
};

const CompactTaskCalendar = () => (
  <div className="compact-calendar">
    {/* 移动端简化显示 */}
    <TaskCountIndicator />
    <SimplifiedEventList />
    <QuickActions />
  </div>
);
```

## 🎯 实施计划

### 阶段1：基础联动（1-2周）
- [ ] 实现 TaskCalendarService 核心逻辑
- [ ] 在现有日历中集成任务事件显示
- [ ] 添加基本的任务事件交互

### 阶段2：界面优化（1周）
- [ ] 设计任务事件的视觉样式
- [ ] 添加任务筛选和控制选项
- [ ] 实现任务事件详情弹窗

### 阶段3：高级功能（1-2周）
- [ ] 实现任务-事件转换功能
- [ ] 添加智能时间建议
- [ ] 实现批量操作功能

### 阶段4：优化完善（1周）
- [ ] 性能优化和缓存
- [ ] 移动端适配
- [ ] 用户体验优化

## 🧪 测试策略

### 单元测试
- TaskCalendarService 的各个判断逻辑
- 时间计算和日期处理
- 任务状态转换

### 集成测试  
- 任务状态变化的日历同步
- 拖拽操作的数据一致性
- 实时更新的准确性

### 用户测试
- 不同类型任务的显示效果
- 操作流程的直观性
- 性能在大量任务时的表现

这个方案提供了完整的任务-日历联动设计，既保持了系统的简洁性，又充分利用了两个模块的优势。您觉得哪个部分需要进一步详细说明或调整？
