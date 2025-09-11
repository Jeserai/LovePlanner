# 🎯 任务拖拽机制 + Dashboard 设计方案

## 📋 问题1：任务拖拽机制设计

### 现状分析
- **现有待办事项**：简单的备忘录功能，轻量级
- **任务系统**：复杂的状态管理、积分、截止时间等
- **需求冲突**：既要保持简单性，又要支持复杂任务管理

### 🏗 建议方案：混合式任务板块

#### A. 保留现有待办事项
```typescript
// 继续保持轻量级的快速备忘录功能
interface SimpleTodo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// 用途：
// - 快速记录灵感
// - 简单的提醒事项  
// - 临时备忘录
// - 购物清单等
```

#### B. 新增"我的任务"板块
```typescript
// 专门用于管理正式任务的板块
interface MyTaskItem {
  id: string;
  taskId: string;           // 关联的正式任务ID
  title: string;
  description: string;
  points: number;
  deadline: string | null;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // 预估耗时（分钟）
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  lastScheduledDate: string | null;  // 上次安排的日期
  scheduledCount: number;            // 被安排的次数
  originalTask: Task;                // 原始任务数据
}
```

### 📱 界面布局设计

#### 日历页面新布局（桌面端）
```
┌─────────────────────┬─────────────────┐
│                     │ 📝 快速备忘      │
│                     │ ├─ 待办事项1     │
│                     │ ├─ 待办事项2     │
│                     │ └─ + 添加备忘    │
│                     ├─────────────────┤
│     📅 日历主区域     │ 📋 我的任务      │
│                     │ ├─ 紧急任务1     │
│                     │ ├─ 今日任务2     │
│                     │ ├─ 本周任务3     │
│                     │ └─ 过期任务4     │
│                     ├─────────────────┤
│                     │ ⏰ 任务提醒      │
│                     │ └─ 截止日期警报   │
└─────────────────────┴─────────────────┘
```

#### 移动端布局
```
📅 日历 | 📋 我的任务 | 📝 备忘录
─────────────────────────────────
[当前激活的视图内容]
```

### 🔄 任务拖拽机制详细设计

#### 1. 任务状态生命周期
```typescript
const taskDragLifecycle = {
  // 1. 任务被领取后自动进入"我的任务"
  onTaskAssigned: (task: Task) => {
    const myTaskItem = createMyTaskItem(task);
    addToMyTaskBoard(myTaskItem);
  },
  
  // 2. 用户拖拽任务到日历
  onDragToCalendar: (myTaskItem: MyTaskItem, calendarSlot: TimeSlot) => {
    // 创建日历事件
    const event = createTaskEvent(myTaskItem, calendarSlot);
    
    // 更新任务状态
    updateMyTaskStatus(myTaskItem.id, 'scheduled');
    
    // 记录安排历史
    recordScheduleHistory(myTaskItem.id, calendarSlot);
  },
  
  // 3. 任务未完成的处理
  onTaskNotCompleted: (myTaskItem: MyTaskItem, scheduledDate: string) => {
    // 检查是否过期
    if (isOverdue(scheduledDate)) {
      // 自动回到"我的任务"板块
      returnToTaskBoard(myTaskItem, 'overdue');
      
      // 发送通知
      sendTaskOverdueNotification(myTaskItem);
      
      // 提升紧急程度
      increaseUrgencyLevel(myTaskItem);
    }
  }
};
```

#### 2. 智能重现机制
```typescript
const smartTaskReappearance = {
  // 任务重现策略
  getReappearanceStrategy: (myTaskItem: MyTaskItem) => {
    const { scheduledCount, lastScheduledDate, urgencyLevel } = myTaskItem;
    
    if (scheduledCount === 0) {
      return 'first_time'; // 首次安排
    }
    
    if (scheduledCount >= 3) {
      return 'persistent_procrastination'; // 持续拖延
    }
    
    if (urgencyLevel === 'urgent') {
      return 'urgent_reminder'; // 紧急提醒
    }
    
    return 'normal_retry'; // 正常重试
  },
  
  // 根据策略调整显示方式
  adjustDisplayBasedOnStrategy: (strategy: string, myTaskItem: MyTaskItem) => {
    switch (strategy) {
      case 'urgent_reminder':
        return {
          ...myTaskItem,
          displayStyle: 'pulsing-red',
          position: 'top-priority',
          showWarning: true,
          warningText: '⚠️ 紧急：任务即将过期！'
        };
        
      case 'persistent_procrastination':
        return {
          ...myTaskItem,
          displayStyle: 'gentle-reminder',
          showSuggestion: true,
          suggestionText: '💡 建议分解这个任务或调整截止时间'
        };
        
      default:
        return myTaskItem;
    }
  }
};
```

#### 3. 拖拽交互增强
```typescript
const enhancedDragExperience = {
  // 拖拽时显示建议时间槽
  onDragStart: (myTaskItem: MyTaskItem) => {
    const suggestions = getOptimalTimeSlots(myTaskItem);
    highlightCalendarSlots(suggestions);
    showDragHelper(myTaskItem);
  },
  
  // 拖拽悬停时显示预览
  onDragHover: (myTaskItem: MyTaskItem, timeSlot: TimeSlot) => {
    const preview = generateTaskEventPreview(myTaskItem, timeSlot);
    showCalendarPreview(preview);
    
    // 检查冲突
    const conflicts = checkTimeConflicts(timeSlot);
    if (conflicts.length > 0) {
      showConflictWarning(conflicts);
    }
  },
  
  // 拖拽放置时确认
  onDrop: (myTaskItem: MyTaskItem, timeSlot: TimeSlot) => {
    showScheduleConfirmDialog({
      task: myTaskItem,
      timeSlot: timeSlot,
      estimatedDuration: myTaskItem.estimatedDuration,
      conflicts: checkTimeConflicts(timeSlot),
      onConfirm: () => scheduleTask(myTaskItem, timeSlot),
      onCancel: () => returnTaskToBoard(myTaskItem)
    });
  }
};
```

## 🏠 问题2：Dashboard 页面设计

### 需求分析
作为情侣应用，Dashboard应该突出：
1. **双方数据对比**
2. **共同目标进展**
3. **互动激励元素**
4. **时间管理概览**

### 🎨 Dashboard 页面布局

#### 桌面端布局
```
┌─────────────────────────────────────────┐
│          🏠 情侣仪表板                    │
├─────────────────┬───────────────────────┤
│ 👥 我们的状态    │  📊 本周数据对比       │
│ ├─ 积分排行     │  ├─ 任务完成: 我 vs TA │
│ ├─ 连续天数     │  ├─ 积分获得: 我 vs TA │
│ └─ 共同目标     │  └─ 习惯坚持: 我 vs TA │
├─────────────────┼───────────────────────┤
│ 📅 今日安排      │  🎯 近期任务           │
│ ├─ 我的事件     │  ├─ 即将截止          │
│ ├─ TA的事件     │  ├─ 进行中            │
│ └─ 共同活动     │  └─ 等待安排          │
├─────────────────┼───────────────────────┤
│ 🏆 成就展示      │  💡 今日建议           │
│ ├─ 最新徽章     │  ├─ 推荐任务时间       │
│ ├─ 里程碑       │  ├─ 习惯提醒          │
│ └─ 情侣互动     │  └─ 共同活动建议       │
└─────────────────┴───────────────────────┘
```

#### 移动端布局（卡片流）
```
🏠 情侣仪表板
┌─────────────────┐
│ 👥 我们的状态    │
│ 积分: 我520 TA480│
│ 连续: 15天      │
└─────────────────┘
┌─────────────────┐
│ 📊 本周对比      │
│ [进度条图表]     │
└─────────────────┘
┌─────────────────┐
│ 📅 今日安排      │
│ 3个事件 2个任务  │
└─────────────────┘
┌─────────────────┐
│ 🎯 紧急提醒      │
│ 2个任务即将截止  │
└─────────────────┘
```

### 🧩 Dashboard 核心组件

#### 1. 情侣状态概览
```typescript
const CoupleStatusOverview = () => {
  const { user1Stats, user2Stats, coupleStats } = useCoupleStats();
  
  return (
    <Card className="couple-status">
      <h3>👥 我们的状态</h3>
      
      <div className="stats-grid">
        <StatItem 
          icon="🏆"
          label="总积分"
          user1Value={user1Stats.totalPoints}
          user2Value={user2Stats.totalPoints}
        />
        
        <StatItem 
          icon="🔥"
          label="连续天数"
          user1Value={user1Stats.currentStreak}
          user2Value={user2Stats.currentStreak}
        />
        
        <StatItem 
          icon="✅"
          label="本周完成"
          user1Value={user1Stats.weeklyCompleted}
          user2Value={user2Stats.weeklyCompleted}
        />
      </div>
      
      <div className="couple-goals">
        <h4>🎯 共同目标</h4>
        <GoalProgress 
          goal={coupleStats.monthlyGoal}
          current={coupleStats.monthlyProgress}
        />
      </div>
    </Card>
  );
};
```

#### 2. 智能数据对比
```typescript
const WeeklyComparison = () => {
  const weeklyData = useWeeklyComparison();
  
  return (
    <Card className="weekly-comparison">
      <h3>📊 本周数据对比</h3>
      
      <ComparisonChart
        title="任务完成情况"
        user1Data={weeklyData.user1.tasksCompleted}
        user2Data={weeklyData.user2.tasksCompleted}
        chartType="bar"
      />
      
      <ComparisonChart
        title="积分获得趋势"
        user1Data={weeklyData.user1.pointsEarned}
        user2Data={weeklyData.user2.pointsEarned}
        chartType="line"
      />
      
      <div className="insights">
        <InsightBadge 
          type="achievement"
          message="🏆 本周你们完成了15个共同任务！"
        />
        <InsightBadge 
          type="encouragement"
          message="💪 TA最近在健身方面很努力，给个鼓励吧！"
        />
      </div>
    </Card>
  );
};
```

#### 3. 今日安排预览
```typescript
const TodaySchedulePreview = () => {
  const todaySchedule = useTodaySchedule();
  
  return (
    <Card className="today-schedule">
      <h3>📅 今日安排</h3>
      
      <div className="schedule-sections">
        <ScheduleSection 
          title="我的安排"
          events={todaySchedule.myEvents}
          tasks={todaySchedule.myTasks}
          color="blue"
        />
        
        <ScheduleSection 
          title="TA的安排"
          events={todaySchedule.partnerEvents}
          tasks={todaySchedule.partnerTasks}
          color="pink"
        />
        
        <ScheduleSection 
          title="共同活动"
          events={todaySchedule.sharedEvents}
          tasks={todaySchedule.sharedTasks}
          color="green"
        />
      </div>
      
      <div className="quick-actions">
        <QuickActionButton 
          icon="➕"
          label="添加事件"
          onClick={() => navigateToCalendar()}
        />
        <QuickActionButton 
          icon="📋"
          label="查看任务"
          onClick={() => navigateToTasks()}
        />
      </div>
    </Card>
  );
};
```

#### 4. 智能建议系统
```typescript
const SmartSuggestions = () => {
  const suggestions = useSmartSuggestions();
  
  return (
    <Card className="smart-suggestions">
      <h3>💡 今日建议</h3>
      
      {suggestions.map(suggestion => (
        <SuggestionItem 
          key={suggestion.id}
          type={suggestion.type}
          icon={suggestion.icon}
          title={suggestion.title}
          description={suggestion.description}
          actionText={suggestion.actionText}
          onAction={suggestion.onAction}
        />
      ))}
      
      <div className="ai-insights">
        <h4>🤖 AI 洞察</h4>
        <p>{suggestions.aiInsight}</p>
      </div>
    </Card>
  );
};
```

### 🔧 Dashboard 作为首页的考虑

#### 方案对比
```typescript
// 方案A：Dashboard 作为首页
const AppWithDashboardHome = () => (
  <Router>
    <Route path="/" component={DashboardPage} />
    <Route path="/calendar" component={CalendarPage} />
    <Route path="/tasks" component={TasksPage} />
    <Route path="/settings" component={SettingsPage} />
  </Router>
);

// 方案B：保持现有结构，Dashboard 作为独立页面
const AppWithSeparateDashboard = () => (
  <Router>
    <Route path="/" component={CalendarPage} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/tasks" component={TasksPage} />
    <Route path="/settings" component={SettingsPage} />
  </Router>
);
```

#### 建议：Dashboard 作为独立页面
原因：
1. **保持现有用户习惯**：日历作为主要工作页面
2. **避免信息过载**：Dashboard信息丰富，不适合频繁访问
3. **渐进式增强**：作为可选的数据总览页面

### 📱 导航结构调整

```typescript
const updatedTabs = [
  { id: 'dashboard', name: '总览', icon: 'home' },
  { id: 'calendar', name: '日历', icon: 'calendar' },
  { id: 'tasks', name: '任务', icon: 'list' },
  { id: 'shop', name: '商店', icon: 'shopping-bag' },
  { id: 'settings', name: '设置', icon: 'settings' }
];
```

## 🎯 总结

### 任务拖拽机制
- **保留现有待办事项**：轻量级备忘录
- **新增"我的任务"板块**：专业任务管理
- **智能重现机制**：未完成任务自动回归，智能调整显示
- **增强拖拽体验**：时间建议、冲突检测、确认对话框

### Dashboard 页面
- **定位**：独立的数据总览页面
- **特色**：情侣数据对比、智能建议、成就展示
- **布局**：响应式设计，桌面端网格，移动端卡片流

您觉得这个设计方案如何？有哪些地方需要调整或详细说明？
