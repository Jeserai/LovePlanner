# 📅 任务-日历混合设计方案

## 🎯 核心设计理念

### 问题分析
1. **任务时间 ≠ 日历时间**
   - 任务：期限导向（deadline-oriented）
   - 日历：事件导向（event-oriented）

2. **用户需求矛盾**
   - 希望日历保持纯净（记事本功能）
   - 又希望在日历页面了解任务时间概念

3. **设计目标**
   - 保持日历的"记事本"本质
   - 提供任务时间的可视化
   - 两者既独立又关联

## 🏗 混合架构设计

### 方案1：分层显示架构

```
┌─────────────────────────────────────┐
│           日历页面布局               │
├─────────────────────────────────────┤
│  📅 日历区域 (纯净的事件记录)        │
│  ├─ 个人事件                        │
│  ├─ 伴侣事件                        │
│  ├─ 共同活动                        │
│  └─ 习惯提醒（仅限很短的定时任务）    │
├─────────────────────────────────────┤
│  📊 任务时间轴区域 (项目管理视图)     │
│  ├─ 当前任务进度条                   │
│  ├─ 截止日期提醒                     │
│  ├─ 时间压力指示                     │
│  └─ 任务依赖关系                     │
└─────────────────────────────────────┘
```

### 方案2：智能分类显示

#### A. 进入日历的任务（作为真正的"事件"）
```typescript
const calendarSuitableTasks = {
  // 短时间明确任务（≤ 4小时）
  shortDefiniteTasks: {
    criteria: `
      task_deadline - earliest_start_time <= 4 hours &&
      earliest_start_time && task_deadline
    `,
    display: '作为时间块事件显示',
    example: '下午2-4点：准备会议材料'
  },
  
  // 定时习惯任务
  scheduledHabits: {
    criteria: `
      daily_time_start && daily_time_end &&
      (task_type === 'habit' || repeat_frequency === 'daily')
    `,
    display: '作为重复事件显示',
    example: '每天晚上8-9点：运动'
  },
  
  // 关键截止点
  criticalDeadlines: {
    criteria: `
      task_deadline && 
      points >= 高积分阈值 &&
      task_deadline - now <= 24 hours
    `,
    display: '作为截止提醒事件',
    example: '明天下午5点截止：提交报告'
  }
};
```

#### B. 显示在任务时间轴的任务
```typescript
const timelineDisplayTasks = {
  // 长期项目任务
  longTermTasks: {
    criteria: `
      task_deadline - earliest_start_time > 4 hours ||
      repeat_frequency !== 'never'
    `,
    display: '在时间轴显示进度条',
    example: '本周内完成的装修计划'
  },
  
  // 无明确时间的任务
  flexibleTasks: {
    criteria: `
      !earliest_start_time && task_deadline
    `,
    display: '显示截止倒计时',
    example: '三天后截止：学习新技能'
  }
};
```

## 🎨 界面设计详情

### 1. 日历主区域（保持纯净）

```typescript
// 只显示真正的"事件"
const CalendarMainArea = () => (
  <FullCalendar
    events={[
      ...personalEvents,      // 个人记事
      ...coupleEvents,        // 伴侣事件  
      ...sharedEvents,        // 共同活动
      ...shortTaskEvents,     // 短时间明确任务
      ...habitEvents,         // 定时习惯
      ...urgentDeadlines      // 紧急截止提醒
    ]}
  />
);
```

### 2. 任务时间轴区域（新增）

```typescript
const TaskTimelineArea = () => (
  <div className="task-timeline-area">
    {/* 今日任务概览 */}
    <TodayTaskSummary />
    
    {/* 本周任务进度 */}
    <WeeklyTaskProgress />
    
    {/* 截止日期时间轴 */}
    <DeadlineTimeline />
    
    {/* 长期任务甘特图 */}
    <TaskGanttChart />
  </div>
);
```

### 3. 混合布局模式

#### A. 桌面端布局
```css
.calendar-page-desktop {
  display: grid;
  grid-template-areas: 
    "toolbar toolbar"
    "calendar timeline"
    "calendar timeline";
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 1rem;
  height: 100vh;
}

.calendar-area { grid-area: calendar; }
.timeline-area { grid-area: timeline; }
```

#### B. 移动端布局
```css
.calendar-page-mobile {
  display: flex;
  flex-direction: column;
}

/* 可切换的标签页 */
.view-tabs {
  display: flex;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.tab-calendar { /* 日历视图 */ }
.tab-timeline { /* 时间轴视图 */ }
.tab-hybrid   { /* 混合视图 */ }
```

## 🧩 具体组件设计

### 1. 今日任务概览组件

```typescript
const TodayTaskSummary = () => {
  const todayTasks = useTodayTasks();
  
  return (
    <Card className="today-task-summary">
      <h3>📋 今日任务</h3>
      
      <div className="task-progress-ring">
        <CircularProgress 
          value={completionPercentage} 
          label={`${completed}/${total}`}
        />
      </div>
      
      <div className="urgent-tasks">
        {urgentTasks.map(task => (
          <TaskUrgentItem key={task.id} task={task} />
        ))}
      </div>
      
      <div className="deadline-alerts">
        {nearDeadlines.map(task => (
          <DeadlineAlert key={task.id} task={task} />
        ))}
      </div>
    </Card>
  );
};
```

### 2. 任务时间轴组件

```typescript
const TaskTimeline = () => {
  const timelineTasks = useTimelineTasks();
  
  return (
    <div className="task-timeline">
      <div className="timeline-header">
        <h3>📊 任务时间轴</h3>
        <TimeRangeSelector />
      </div>
      
      <div className="timeline-content">
        {timelineTasks.map(task => (
          <TaskTimelineItem 
            key={task.id} 
            task={task}
            startDate={task.earliest_start_time}
            endDate={task.task_deadline}
            progress={task.progress}
          />
        ))}
      </div>
    </div>
  );
};

const TaskTimelineItem = ({ task, startDate, endDate, progress }) => (
  <div className="timeline-item">
    <div className="task-info">
      <span className="task-title">{task.title}</span>
      <span className="task-points">{task.points}分</span>
    </div>
    
    <div className="time-bar">
      <div className="time-range">
        <span className="start-time">{formatDate(startDate)}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="end-time">{formatDate(endDate)}</span>
      </div>
    </div>
    
    <div className="urgency-indicator">
      {getUrgencyLevel(task)}
    </div>
  </div>
);
```

### 3. 截止日期警报组件

```typescript
const DeadlineAlert = ({ task }) => {
  const timeRemaining = useTimeRemaining(task.task_deadline);
  const urgencyLevel = getUrgencyLevel(timeRemaining);
  
  return (
    <div className={`deadline-alert urgency-${urgencyLevel}`}>
      <div className="alert-icon">
        {urgencyLevel === 'critical' ? '🚨' : 
         urgencyLevel === 'warning' ? '⚠️' : '⏰'}
      </div>
      
      <div className="alert-content">
        <div className="task-name">{task.title}</div>
        <div className="time-remaining">
          {formatTimeRemaining(timeRemaining)}
        </div>
      </div>
      
      <div className="alert-actions">
        <QuickCompleteButton taskId={task.id} />
        <ViewTaskButton taskId={task.id} />
      </div>
    </div>
  );
};
```

## 🔄 交互设计

### 1. 任务到日历的"升级"

```typescript
const promoteTaskToEvent = async (task: Task, proposedTime: TimeSlot) => {
  // 将长期任务的某个时间段转换为具体的日历事件
  const event = {
    title: `📋 ${task.title}`,
    description: `任务：${task.description}\n计划执行时间段`,
    startTime: proposedTime.start,
    endTime: proposedTime.end,
    color: getTaskColor(task),
    category: 'task-execution',
    linkedTaskId: task.id
  };
  
  await eventService.createEvent(event);
  
  // 可选：在任务中记录这个计划
  await taskService.addExecutionPlan(task.id, {
    plannedStart: proposedTime.start,
    plannedEnd: proposedTime.end,
    eventId: event.id
  });
};
```

### 2. 智能时间建议

```typescript
const SuggestTaskTime = ({ task }) => {
  const suggestions = useTaskTimeSpaceAI(task);
  
  return (
    <div className="time-suggestions">
      <h4>💡 建议执行时间</h4>
      
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="suggestion-item">
          <div className="time-slot">
            {formatTimeSlot(suggestion.timeSlot)}
          </div>
          <div className="reason">
            {suggestion.reason}
          </div>
          <button 
            onClick={() => promoteTaskToEvent(task, suggestion.timeSlot)}
            className="btn-adopt"
          >
            添加到日历
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. 双向同步机制

```typescript
const TaskCalendarSync = {
  // 任务完成后，自动更新相关的日历事件
  onTaskComplete: async (taskId: string) => {
    const linkedEvents = await getLinkedEvents(taskId);
    
    for (const event of linkedEvents) {
      await eventService.updateEvent(event.id, {
        color: '#10b981', // 绿色表示完成
        title: `✅ ${event.title.replace('📋', '')}`,
        description: `${event.description}\n\n✅ 任务已完成`
      });
    }
  },
  
  // 日历事件变化时，询问是否影响任务计划
  onEventChange: async (eventId: string, changes: EventChanges) => {
    const linkedTask = await getLinkedTask(eventId);
    
    if (linkedTask && changes.timeChanged) {
      const shouldUpdateTask = await confirmDialog(
        '日历事件时间已修改，是否同步更新任务计划？'
      );
      
      if (shouldUpdateTask) {
        await taskService.updateExecutionPlan(linkedTask.id, {
          plannedStart: changes.newStartTime,
          plannedEnd: changes.newEndTime
        });
      }
    }
  }
};
```

## 📱 响应式适配

### 移动端标签切换

```typescript
const MobileCalendarTabs = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  
  return (
    <div className="mobile-calendar-page">
      <div className="tab-header">
        <TabButton 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')}
        >
          📅 日历
        </TabButton>
        <TabButton 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')}
        >
          📋 任务
        </TabButton>
        <TabButton 
          active={activeTab === 'hybrid'} 
          onClick={() => setActiveTab('hybrid')}
        >
          🔗 混合
        </TabButton>
      </div>
      
      <div className="tab-content">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'tasks' && <TaskTimelineView />}
        {activeTab === 'hybrid' && <HybridView />}
      </div>
    </div>
  );
};
```

## 🎯 最终效果

### 用户体验流程

1. **日历保持纯净**
   - 主要显示真正的"事件"
   - 短时间任务和习惯可以进入日历
   - 截止日期作为提醒点显示

2. **任务有独立的时间可视化**
   - 任务时间轴显示项目进度
   - 截止日期警报系统
   - 任务完成度环形图

3. **灵活的任务-事件转换**
   - 用户可以将任务的某个时间段"升级"为日历事件
   - 智能建议最佳执行时间
   - 双向同步保持一致性

4. **多设备适配**
   - 桌面端：并排显示日历和任务时间轴
   - 移动端：标签切换不同视图
   - 混合视图：按需显示任务信息

这样的设计既保持了日历的"记事本"本质，又为任务管理提供了清晰的时间概念，您觉得这个方案如何？
