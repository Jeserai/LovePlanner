# 📅 任务截止日期在日历上的显示方案

## 🎯 核心思路

将任务的截止日期转换为日历事件，与现有的个人事件、伴侣事件一起显示，但通过颜色、图标、样式等方式进行区分。

## 🏗 实现方案

### 方案一：直接集成到现有FullCalendar

#### 1. 任务转日历事件的转换函数
```typescript
// 在 FullCalendarComponent.tsx 中添加
const convertTasksToCalendarEvents = (tasks: Task[]) => {
  return tasks
    .filter(task => task.task_deadline) // 只显示有截止日期的任务
    .map(task => {
      const deadline = new Date(task.task_deadline!)
      
      return {
        id: `task-deadline-${task.id}`,
        title: `⏰ ${task.title}`,
        start: task.task_deadline,
        allDay: !task.task_deadline.includes('T'), // 如果没有具体时间，显示为全天
        
        // 视觉样式
        backgroundColor: getTaskDeadlineColor(task),
        borderColor: getTaskDeadlineColor(task),
        textColor: '#ffffff',
        
        // 自定义样式类
        className: ['task-deadline-event', `priority-${task.task_type}`],
        
        // 扩展属性
        extendedProps: {
          type: 'task-deadline',
          taskId: task.id,
          assignee: task.assignee_id,
          points: task.points,
          status: task.status,
          isOverdue: deadline < new Date(),
          urgencyLevel: getUrgencyLevel(task.task_deadline),
          originalTask: task
        }
      }
    })
}

// 颜色配置
const getTaskDeadlineColor = (task: Task) => {
  const deadline = new Date(task.task_deadline!)
  const now = new Date()
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  // 根据紧急程度和任务类型返回颜色
  if (hoursUntilDeadline < 0) {
    return '#dc2626' // 红色：已过期
  } else if (hoursUntilDeadline < 6) {
    return '#ea580c' // 橙红：6小时内
  } else if (hoursUntilDeadline < 24) {
    return '#f59e0b' // 橙色：24小时内
  } else if (hoursUntilDeadline < 72) {
    return '#3b82f6' // 蓝色：3天内
  } else {
    return '#6b7280' // 灰色：较远的截止时间
  }
}

// 紧急程度计算
const getUrgencyLevel = (deadline: string): 'critical' | 'urgent' | 'normal' | 'low' => {
  const hoursUntil = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)
  
  if (hoursUntil < 0) return 'critical'      // 已过期
  if (hoursUntil < 6) return 'urgent'        // 6小时内
  if (hoursUntil < 24) return 'normal'       // 24小时内
  return 'low'                               // 更远的将来
}
```

#### 2. 修改FullCalendarComponent以包含任务截止日期
```typescript
// 在 FullCalendarComponent.tsx 中修改
const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({
  events,
  tasks, // 新增：传入任务数据
  // ... 其他props
}) => {
  // 合并事件和任务截止日期
  const allCalendarEvents = useMemo(() => {
    const regularEvents = events.map(event => ({
      ...event,
      extendedProps: {
        ...event.extendedProps,
        type: 'regular-event'
      }
    }))
    
    const taskDeadlineEvents = convertTasksToCalendarEvents(tasks || [])
    
    return [...regularEvents, ...taskDeadlineEvents]
  }, [events, tasks])

  // 处理任务截止日期事件点击
  const handleTaskDeadlineClick = useCallback((eventInfo: EventClickArg) => {
    const { type, taskId, originalTask } = eventInfo.event.extendedProps
    
    if (type === 'task-deadline') {
      showTaskDeadlineDialog({
        task: originalTask,
        onViewTask: () => navigateToTask(taskId),
        onCompleteTask: () => completeTask(taskId),
        onReschedule: () => rescheduleTask(taskId),
        onExtendDeadline: () => extendDeadline(taskId)
      })
    }
  }, [])

  // 事件点击处理
  const handleEventClick = useCallback((eventInfo: EventClickArg) => {
    const eventType = eventInfo.event.extendedProps.type
    
    if (eventType === 'task-deadline') {
      handleTaskDeadlineClick(eventInfo)
    } else {
      // 处理普通事件点击
      onEventClick?.(eventInfo.event as any)
    }
  }, [handleTaskDeadlineClick, onEventClick])

  return (
    <FullCalendar
      // ... 其他配置
      events={allCalendarEvents}
      eventClick={handleEventClick}
      eventContent={renderEventContent} // 自定义事件内容渲染
    />
  )
}

// 自定义事件内容渲染
const renderEventContent = (eventInfo: EventContentArg) => {
  const { type, urgencyLevel, isOverdue } = eventInfo.event.extendedProps
  
  if (type === 'task-deadline') {
    return (
      <div className={`task-deadline-content ${urgencyLevel} ${isOverdue ? 'overdue' : ''}`}>
        <div className="task-deadline-icon">
          {isOverdue ? '🚨' : getUrgencyIcon(urgencyLevel)}
        </div>
        <div className="task-deadline-text">
          {eventInfo.event.title}
        </div>
        {isOverdue && <div className="overdue-badge">已过期</div>}
      </div>
    )
  }
  
  // 普通事件的默认渲染
  return null
}

const getUrgencyIcon = (urgencyLevel: string) => {
  const icons = {
    critical: '🚨',
    urgent: '⚠️',
    normal: '⏰',
    low: '📅'
  }
  return icons[urgencyLevel] || '📅'
}
```

#### 3. 样式设计
```css
/* 在 src/styles/fullcalendar.css 中添加 */

/* 任务截止日期事件样式 */
.fc-event.task-deadline-event {
  border-radius: 6px;
  border-width: 2px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.task-deadline-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  position: relative;
}

.task-deadline-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.task-deadline-text {
  flex: 1;
  font-size: 11px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 紧急程度样式 */
.task-deadline-content.critical {
  animation: pulse-critical 1s infinite;
}

.task-deadline-content.urgent {
  animation: pulse-urgent 2s infinite;
}

.task-deadline-content.overdue {
  background: linear-gradient(45deg, #dc2626, #b91c1c);
}

.overdue-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #fca5a5;
  color: #dc2626;
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: bold;
}

/* 动画效果 */
@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulse-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 优先级样式 */
.task-deadline-event.priority-hard {
  border-left: 4px solid #dc2626;
}

.task-deadline-event.priority-normal {
  border-left: 4px solid #f59e0b;
}

.task-deadline-event.priority-easy {
  border-left: 4px solid #10b981;
}
```

### 方案二：任务截止日期弹窗处理

#### 1. 任务截止详情弹窗
```typescript
const TaskDeadlineDialog = ({ task, isOpen, onClose, onAction }) => {
  const { t } = useTranslation()
  const deadline = new Date(task.task_deadline)
  const now = new Date()
  const isOverdue = deadline < now
  const timeRemaining = deadline.getTime() - now.getTime()
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="task-deadline-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOverdue ? '🚨' : '⏰'}
            任务截止提醒
          </DialogTitle>
        </DialogHeader>
        
        <div className="task-deadline-info">
          <div className="task-basic-info">
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
          </div>
          
          <div className="deadline-details">
            <div className={`deadline-time ${isOverdue ? 'overdue' : ''}`}>
              <span className="label">截止时间：</span>
              <span className="time">{formatDateTime(deadline)}</span>
            </div>
            
            <div className="time-remaining">
              {isOverdue ? (
                <span className="overdue-text">
                  ⚠️ 已过期 {formatTimeElapsed(Math.abs(timeRemaining))}
                </span>
              ) : (
                <span className="remaining-text">
                  ⏰ 还剩 {formatTimeRemaining(timeRemaining)}
                </span>
              )}
            </div>
          </div>
          
          <div className="task-meta">
            <div className="points">💎 {task.points} 积分</div>
            <div className="assignee">
              👤 {task.assignee_id === currentUserId ? '我的任务' : 'TA的任务'}
            </div>
            <div className="status">
              📊 {getStatusText(task.status)}
            </div>
          </div>
        </div>
        
        <div className="dialog-actions">
          <Button 
            variant="default" 
            onClick={() => onAction('view')}
          >
            📋 查看详情
          </Button>
          
          {task.assignee_id === currentUserId && task.status !== 'completed' && (
            <Button 
              variant="default" 
              onClick={() => onAction('complete')}
            >
              ✅ 标记完成
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => onAction('reschedule')}
          >
            📅 调整时间
          </Button>
          
          {isOverdue && (
            <Button 
              variant="outline" 
              onClick={() => onAction('extend')}
            >
              ⏰ 延长截止时间
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### 2. 快速操作处理
```typescript
const useTaskDeadlineActions = () => {
  const completeTask = useCallback(async (taskId: string) => {
    try {
      await taskService.completeTask(taskId)
      toast.success('🎉 任务完成！获得积分奖励！')
      // 刷新日历事件
      refreshCalendarEvents()
    } catch (error) {
      toast.error('完成任务失败，请重试')
    }
  }, [])

  const rescheduleTask = useCallback((taskId: string) => {
    // 打开任务编辑弹窗，聚焦到时间设置
    openTaskEditDialog(taskId, { focusField: 'deadline' })
  }, [])

  const extendDeadline = useCallback(async (taskId: string) => {
    // 显示快速延期选项
    const newDeadline = await showQuickExtendDialog({
      options: [
        { label: '延期1小时', value: 1 * 60 * 60 * 1000 },
        { label: '延期1天', value: 24 * 60 * 60 * 1000 },
        { label: '延期3天', value: 3 * 24 * 60 * 60 * 1000 },
        { label: '延期1周', value: 7 * 24 * 60 * 60 * 1000 },
        { label: '自定义时间', value: 'custom' }
      ]
    })
    
    if (newDeadline) {
      await taskService.updateTask(taskId, { 
        task_deadline: newDeadline 
      })
      toast.success('⏰ 截止时间已延长')
      refreshCalendarEvents()
    }
  }, [])

  return {
    completeTask,
    rescheduleTask,
    extendDeadline
  }
}
```

### 方案三：日历工具栏的任务筛选器

#### 1. 任务显示控制
```typescript
const CalendarTaskControls = () => {
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true)
  const [taskFilter, setTaskFilter] = useState({
    showOverdue: true,
    showUrgent: true,
    showNormal: true,
    showLow: false,
    assignee: 'all' // 'me', 'partner', 'all'
  })

  return (
    <div className="calendar-task-controls">
      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={showTaskDeadlines}
            onChange={(e) => setShowTaskDeadlines(e.target.checked)}
          />
          显示任务截止日期
        </label>
      </div>
      
      {showTaskDeadlines && (
        <div className="task-filter-group">
          <div className="filter-section">
            <span className="filter-label">紧急程度：</span>
            <div className="filter-options">
              <FilterCheckbox
                label="🚨 已过期"
                checked={taskFilter.showOverdue}
                onChange={(checked) => setTaskFilter(prev => ({
                  ...prev, showOverdue: checked
                }))}
              />
              <FilterCheckbox
                label="⚠️ 紧急"
                checked={taskFilter.showUrgent}
                onChange={(checked) => setTaskFilter(prev => ({
                  ...prev, showUrgent: checked
                }))}
              />
              <FilterCheckbox
                label="⏰ 普通"
                checked={taskFilter.showNormal}
                onChange={(checked) => setTaskFilter(prev => ({
                  ...prev, showNormal: checked
                }))}
              />
              <FilterCheckbox
                label="📅 较远"
                checked={taskFilter.showLow}
                onChange={(checked) => setTaskFilter(prev => ({
                  ...prev, showLow: checked
                }))}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <span className="filter-label">负责人：</span>
            <select
              value={taskFilter.assignee}
              onChange={(e) => setTaskFilter(prev => ({
                ...prev, assignee: e.target.value
              }))}
            >
              <option value="all">全部</option>
              <option value="me">我的任务</option>
              <option value="partner">TA的任务</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 方案四：任务截止日期侧边栏

#### 1. 日历页面布局调整
```typescript
const CalendarWithTaskDeadlines = () => {
  return (
    <div className="calendar-with-tasks">
      <div className="calendar-main">
        <FullCalendar
          // ... 现有配置
          events={allEvents}
        />
      </div>
      
      <div className="task-deadlines-sidebar">
        <UpcomingDeadlines />
        <OverdueTasks />
        <TodayTasks />
      </div>
    </div>
  )
}

const UpcomingDeadlines = () => {
  const upcomingTasks = useTaskStore(state => 
    state.tasks.filter(task => {
      if (!task.task_deadline) return false
      const deadline = new Date(task.task_deadline)
      const now = new Date()
      const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysUntil > 0 && daysUntil <= 7 // 未来7天内
    }).sort((a, b) => 
      new Date(a.task_deadline!).getTime() - new Date(b.task_deadline!).getTime()
    )
  )

  return (
    <div className="upcoming-deadlines">
      <h3>📅 即将截止</h3>
      <div className="deadline-list">
        {upcomingTasks.map(task => (
          <TaskDeadlineItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

const TaskDeadlineItem = ({ task }) => {
  const deadline = new Date(task.task_deadline!)
  const timeRemaining = deadline.getTime() - new Date().getTime()
  const urgencyLevel = getUrgencyLevel(task.task_deadline!)

  return (
    <div className={`deadline-item ${urgencyLevel}`}>
      <div className="deadline-icon">
        {getUrgencyIcon(urgencyLevel)}
      </div>
      <div className="deadline-content">
        <div className="task-title">{task.title}</div>
        <div className="deadline-time">
          {formatTimeRemaining(timeRemaining)}后截止
        </div>
      </div>
      <div className="deadline-actions">
        <Button size="sm" onClick={() => viewTask(task.id)}>
          查看
        </Button>
      </div>
    </div>
  )
}
```

## 🎨 最终集成效果

### 在现有Calendar.tsx中的集成
```typescript
// 修改 Calendar.tsx
const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true)
  
  // 获取任务数据
  useEffect(() => {
    const fetchTasks = async () => {
      if (userProfile?.couple_id) {
        const tasksData = await taskService.getTasks(userProfile.couple_id)
        setTasks(tasksData)
      }
    }
    fetchTasks()
  }, [userProfile])

  return (
    <Layout activeTab="calendar" onTabChange={onTabChange}>
      <div className="calendar-page">
        {/* 任务控制面板 */}
        <CalendarTaskControls 
          showTaskDeadlines={showTaskDeadlines}
          onToggleTaskDeadlines={setShowTaskDeadlines}
        />
        
        {/* 主日历 */}
        <FullCalendarComponent
          events={events}
          tasks={showTaskDeadlines ? tasks : []} // 传入任务数据
          onEventClick={handleEventClick}
          onTaskDeadlineAction={handleTaskAction}
          // ... 其他props
        />
        
        {/* 任务截止侧边栏 */}
        {showTaskDeadlines && (
          <TaskDeadlinesSidebar tasks={tasks} />
        )}
      </div>
    </Layout>
  )
}
```

## 🎯 效果预览

```
📅 2024年3月15日 周五
┌─────────────────────────────────┐
│ 09:00  💼 工作会议              │
│ 14:00  ⏰ 报告截止 (2小时后)    │
│ 18:00  💕 和TA约会              │
│ 全天   🚨 旅行计划 (已过期1天)  │
└─────────────────────────────────┘

侧边栏：
📅 即将截止
├─ ⚠️ 买生日礼物 (明天截止)
├─ ⏰ 学习新技能 (3天后)
└─ 📅 季度总结 (下周)

🚨 已过期
└─ 🚨 整理房间 (过期2天)
```

这样的实现既保持了日历的清晰性，又能让用户清楚地看到任务的时间安排！您觉得哪种方案最适合？
