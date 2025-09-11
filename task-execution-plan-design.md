# 📚 任务执行计划设计方案

## 🎯 问题分析

### 场景描述
- **任务类型**：单次任务（一次性完成）
- **执行方式**：分段进行（每天一点）
- **典型例子**：
  - 📖 一周内读完一本书（每天1小时）
  - 🏃 一个月减重5公斤（每天运动30分钟）
  - 📝 两周完成报告（每天写1小时）
  - 🎨 学会画画（每天练习45分钟）

### 设计挑战
1. **任务完整性**：保持单一任务的概念
2. **执行灵活性**：支持灵活的时间安排
3. **进度可视化**：清晰显示总体和分段进度
4. **状态管理**：处理部分完成、跳过、补充等情况

## 🏗 执行计划机制设计

### 1. 数据结构扩展

#### A. 任务执行计划表
```typescript
interface TaskExecutionPlan {
  id: string;
  taskId: string;                    // 关联的主任务
  title: string;                     // 执行计划名称
  totalEstimatedHours: number;       // 总预估工时
  plannedSessions: ExecutionSession[]; // 计划的执行时段
  actualSessions: ExecutionSession[];  // 实际的执行记录
  createdAt: string;
  updatedAt: string;
}

interface ExecutionSession {
  id: string;
  planId: string;
  date: string;                      // 计划日期
  startTime: string;                 // 开始时间
  endTime: string;                   // 结束时间
  estimatedDuration: number;         // 预估时长（分钟）
  actualDuration?: number;           // 实际时长（分钟）
  status: 'planned' | 'in_progress' | 'completed' | 'skipped' | 'postponed';
  notes?: string;                    // 执行笔记
  completedAt?: string;              // 完成时间
}
```

#### B. 任务类型扩展
```typescript
interface Task {
  // ... 现有字段
  
  // 新增字段
  allowExecutionPlan: boolean;       // 是否允许创建执行计划
  executionPlans: TaskExecutionPlan[]; // 关联的执行计划
  totalProgress: number;             // 总体进度百分比
  estimatedTotalHours?: number;      // 总预估工时
}
```

### 2. 执行计划创建流程

#### A. 智能建议系统
```typescript
const executionPlanSuggestions = {
  // 根据任务特点生成建议
  generateSuggestions: (task: Task) => {
    const suggestions = [];
    
    // 基于截止时间的建议
    if (task.task_deadline) {
      const daysAvailable = getDaysUntilDeadline(task.task_deadline);
      const estimatedHours = task.estimatedTotalHours || 10;
      
      suggestions.push({
        type: 'even_distribution',
        name: '平均分配',
        description: `每天 ${(estimatedHours / daysAvailable).toFixed(1)} 小时`,
        sessions: generateEvenSessions(estimatedHours, daysAvailable)
      });
      
      suggestions.push({
        type: 'workday_focus',
        name: '工作日集中',
        description: '工作日多做一些，周末轻松',
        sessions: generateWorkdayFocusSessions(estimatedHours, daysAvailable)
      });
    }
    
    // 基于任务类型的建议
    if (task.task_type === 'habit') {
      suggestions.push({
        type: 'short_daily',
        name: '每日短时',
        description: '每天30分钟，培养习惯',
        sessions: generateShortDailySessions()
      });
    }
    
    return suggestions;
  }
};
```

#### B. 执行计划创建器
```typescript
const ExecutionPlanCreator = ({ task, onSave }) => {
  const [planType, setPlanType] = useState('custom');
  const [sessions, setSessions] = useState([]);
  
  return (
    <div className="execution-plan-creator">
      <h3>📅 为任务创建执行计划</h3>
      
      {/* 快速模板 */}
      <div className="plan-templates">
        <h4>🚀 快速模板</h4>
        <div className="template-grid">
          <TemplateButton 
            icon="📚"
            title="每日学习"
            description="每天固定时间段"
            onClick={() => applyTemplate('daily_learning')}
          />
          <TemplateButton 
            icon="🏃"
            title="工作日集中"
            description="周一到周五执行"
            onClick={() => applyTemplate('workdays')}
          />
          <TemplateButton 
            icon="⚡"
            title="冲刺模式"
            description="短时间高强度"
            onClick={() => applyTemplate('sprint')}
          />
        </div>
      </div>
      
      {/* 自定义设置 */}
      <div className="custom-settings">
        <h4>⚙️ 自定义设置</h4>
        
        <FormField label="总预估工时">
          <input 
            type="number"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
            placeholder="例如：10小时"
          />
        </FormField>
        
        <FormField label="执行频率">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">每天</option>
            <option value="workdays">工作日</option>
            <option value="weekends">周末</option>
            <option value="custom">自定义</option>
          </select>
        </FormField>
        
        <FormField label="每次时长">
          <input 
            type="number"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(e.target.value)}
            placeholder="例如：60分钟"
          />
        </FormField>
      </div>
      
      {/* 时间表预览 */}
      <div className="schedule-preview">
        <h4>📋 执行时间表</h4>
        <ExecutionSchedulePreview sessions={sessions} />
      </div>
    </div>
  );
};
```

### 3. 日历显示策略

#### A. 分段事件显示
```typescript
const renderExecutionPlanEvents = (executionPlan: TaskExecutionPlan) => {
  return executionPlan.plannedSessions.map(session => ({
    id: `execution-${session.id}`,
    title: `📚 ${executionPlan.title} (${session.estimatedDuration}min)`,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    color: getExecutionStatusColor(session.status),
    category: 'task-execution',
    
    // 显示进度信息
    description: `总进度: ${calculateOverallProgress(executionPlan)}%`,
    
    // 特殊标记
    badge: getExecutionBadge(session),
    
    // 关联信息
    originalTaskId: executionPlan.taskId,
    executionPlanId: executionPlan.id,
    sessionId: session.id
  }));
};

const getExecutionStatusColor = (status: ExecutionSessionStatus) => {
  const colorMap = {
    'planned': '#6b7280',      // 灰色：计划中
    'in_progress': '#3b82f6',  // 蓝色：进行中
    'completed': '#10b981',    // 绿色：已完成
    'skipped': '#f59e0b',      // 橙色：已跳过
    'postponed': '#8b5cf6'     // 紫色：已延期
  };
  return colorMap[status];
};
```

#### B. 进度可视化
```typescript
const ExecutionProgressBar = ({ executionPlan }) => {
  const overallProgress = calculateOverallProgress(executionPlan);
  const completedSessions = getCompletedSessions(executionPlan);
  const totalSessions = executionPlan.plannedSessions.length;
  
  return (
    <div className="execution-progress">
      <div className="progress-header">
        <span className="task-title">{executionPlan.title}</span>
        <span className="progress-text">{overallProgress}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${overallProgress}%` }}
        />
      </div>
      
      <div className="progress-details">
        <span>✅ {completedSessions}/{totalSessions} 次完成</span>
        <span>⏱️ 预计还需 {getRemainingHours(executionPlan)} 小时</span>
      </div>
    </div>
  );
};
```

### 4. 执行过程管理

#### A. 执行会话控制
```typescript
const ExecutionSessionController = ({ session, onUpdate }) => {
  const [status, setStatus] = useState(session.status);
  const [actualDuration, setActualDuration] = useState(0);
  const [notes, setNotes] = useState('');
  
  const handleStartSession = () => {
    setStatus('in_progress');
    startTimer();
    onUpdate(session.id, { 
      status: 'in_progress', 
      startedAt: new Date().toISOString() 
    });
  };
  
  const handleCompleteSession = () => {
    setStatus('completed');
    stopTimer();
    onUpdate(session.id, {
      status: 'completed',
      actualDuration: actualDuration,
      completedAt: new Date().toISOString(),
      notes: notes
    });
  };
  
  const handleSkipSession = (reason: string) => {
    setStatus('skipped');
    onUpdate(session.id, {
      status: 'skipped',
      skipReason: reason,
      skippedAt: new Date().toISOString()
    });
  };
  
  return (
    <div className="session-controller">
      <div className="session-info">
        <h4>{session.date} {session.startTime}-{session.endTime}</h4>
        <p>预计 {session.estimatedDuration} 分钟</p>
      </div>
      
      <div className="session-actions">
        {status === 'planned' && (
          <>
            <Button onClick={handleStartSession}>🚀 开始执行</Button>
            <Button variant="outline" onClick={() => handleSkipSession('今天没时间')}>
              ⏭️ 跳过
            </Button>
          </>
        )}
        
        {status === 'in_progress' && (
          <>
            <Timer duration={actualDuration} />
            <Button onClick={handleCompleteSession}>✅ 完成</Button>
            <Button variant="outline" onClick={() => setStatus('planned')}>
              ⏸️ 暂停
            </Button>
          </>
        )}
        
        {status === 'completed' && (
          <div className="completed-info">
            ✅ 已完成 ({actualDuration} 分钟)
            <Button variant="ghost" onClick={() => setStatus('planned')}>
              🔄 重新执行
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### B. 智能调整建议
```typescript
const SmartAdjustmentSuggestions = ({ executionPlan }) => {
  const analysis = analyzeExecutionPattern(executionPlan);
  const suggestions = generateAdjustmentSuggestions(analysis);
  
  return (
    <div className="smart-suggestions">
      <h4>💡 智能建议</h4>
      
      {suggestions.map(suggestion => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
};

const generateAdjustmentSuggestions = (analysis: ExecutionAnalysis) => {
  const suggestions = [];
  
  // 如果经常跳过某个时间段
  if (analysis.frequentlySkippedTimeSlot) {
    suggestions.push({
      type: 'time_adjustment',
      icon: '⏰',
      title: '调整执行时间',
      description: `你在 ${analysis.frequentlySkippedTimeSlot} 经常跳过，要不要换个时间？`,
      action: () => suggestAlternativeTimeSlots(analysis.frequentlySkippedTimeSlot)
    });
  }
  
  // 如果实际时长总是超出预期
  if (analysis.averageOverrun > 15) {
    suggestions.push({
      type: 'duration_adjustment',
      icon: '⏱️',
      title: '调整时长设置',
      description: `平均每次超时 ${analysis.averageOverrun} 分钟，建议增加预设时长`,
      action: () => adjustSessionDuration(analysis.averageOverrun)
    });
  }
  
  // 如果进度落后
  if (analysis.progressBehindSchedule) {
    suggestions.push({
      type: 'catch_up_plan',
      icon: '🚀',
      title: '追赶计划',
      description: '进度有点落后，要不要加几次额外的执行时间？',
      action: () => generateCatchUpPlan(executionPlan)
    });
  }
  
  return suggestions;
};
```

### 5. 与现有系统的整合

#### A. 任务状态同步
```typescript
const syncTaskStatusWithExecutionPlan = (executionPlan: TaskExecutionPlan) => {
  const overallProgress = calculateOverallProgress(executionPlan);
  const originalTask = getTask(executionPlan.taskId);
  
  // 更新主任务进度
  updateTask(originalTask.id, {
    totalProgress: overallProgress,
    status: overallProgress >= 100 ? 'completed' : 'in_progress'
  });
  
  // 如果所有执行计划都完成，标记主任务完成
  if (overallProgress >= 100) {
    completeTask(originalTask.id);
    awardTaskPoints(originalTask);
  }
};
```

#### B. 日历事件联动
```typescript
const handleExecutionPlanEventClick = (event: CalendarEvent) => {
  if (event.category === 'task-execution') {
    showExecutionSessionDialog({
      sessionId: event.sessionId,
      executionPlanId: event.executionPlanId,
      actions: [
        '🚀 开始执行',
        '✅ 标记完成', 
        '⏭️ 跳过这次',
        '📝 添加笔记',
        '⚙️ 调整时间'
      ]
    });
  }
};
```

## 🎨 用户界面设计

### 任务详情页面增强
```typescript
const EnhancedTaskDetail = ({ task }) => {
  const [showExecutionPlan, setShowExecutionPlan] = useState(false);
  
  return (
    <div className="task-detail">
      {/* 原有的任务信息 */}
      <TaskBasicInfo task={task} />
      
      {/* 执行计划区域 */}
      <div className="execution-plan-section">
        <div className="section-header">
          <h3>📅 执行计划</h3>
          {!task.executionPlans?.length && (
            <Button onClick={() => setShowExecutionPlan(true)}>
              ➕ 创建执行计划
            </Button>
          )}
        </div>
        
        {task.executionPlans?.map(plan => (
          <ExecutionPlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      
      {showExecutionPlan && (
        <ExecutionPlanCreator 
          task={task}
          onSave={(plan) => createExecutionPlan(task.id, plan)}
          onCancel={() => setShowExecutionPlan(false)}
        />
      )}
    </div>
  );
};
```

## 🎯 使用场景示例

### 场景1：读书任务
```
任务：一周内读完《时间管理》
执行计划：
- 每天晚上8-9点阅读
- 总共7次，每次1小时
- 目标：每天20-30页

日历显示：
📚 《时间管理》阅读 (60min) 
总进度: 42% | 第3/7次
```

### 场景2：健身计划
```
任务：一个月减重5公斤
执行计划：
- 周一三五：有氧运动45分钟
- 周二四：力量训练30分钟
- 总共20次训练

日历显示：
🏃 减重计划 - 有氧 (45min)
总进度: 65% | 第13/20次
```

### 场景3：技能学习
```
任务：学会使用Photoshop
执行计划：
- 每天练习1小时
- 连续14天
- 每天不同的功能模块

日历显示：
🎨 PS学习 - 图层操作 (60min)
总进度: 35% | 第5/14天
```

这个设计完美解决了"单次任务，分段执行"的问题，既保持了任务的完整性，又提供了灵活的执行安排和清晰的进度跟踪！
