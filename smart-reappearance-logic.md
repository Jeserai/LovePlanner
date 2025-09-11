# 🧠 智能重现逻辑详细设计

## 🎯 核心概念

### 什么是智能重现？
当用户将任务从"我的任务"板块拖拽到日历后，如果这个任务没有按时完成，系统会**智能地**让任务重新出现在任务板块中，并根据历史行为调整显示方式和优先级。

## 🕐 触发时机

### 1. 自动触发条件
```typescript
const autoTriggerConditions = {
  // 时间过期触发
  timeExpired: {
    condition: '计划执行时间已过',
    checkInterval: '每小时检查一次',
    example: '用户安排下午2-4点做任务，现在已经5点了'
  },
  
  // 截止日期临近
  deadlineApproaching: {
    condition: '距离任务截止时间不足24小时',
    checkInterval: '每4小时检查一次',
    example: '任务明天就要截止，但还没开始执行'
  },
  
  // 日期结束未标记完成
  dayEndNotCompleted: {
    condition: '当天23:59分，安排的任务仍未完成',
    checkInterval: '每日23:59自动检查',
    example: '安排今天完成的任务，到了晚上还没做'
  }
};
```

### 2. 手动触发条件
```typescript
const manualTriggerConditions = {
  // 用户主动放弃
  userAbandon: {
    action: '用户在日历中删除了任务事件',
    effect: '立即回到任务板块'
  },
  
  // 用户重新安排
  userReschedule: {
    action: '用户拖拽日历事件到新时间',
    effect: '更新安排记录，继续跟踪'
  },
  
  // 用户标记延期
  userDefer: {
    action: '用户点击"延期"按钮',
    effect: '回到任务板块，标记为延期状态'
  }
};
```

## 🎨 重现策略详解

### 策略1：首次安排失败
```typescript
const firstTimeFailure = {
  displayStyle: {
    position: '保持原位置',
    appearance: '正常显示',
    badge: '无特殊标记'
  },
  
  userExperience: {
    message: '💡 没关系，重新安排一个时间吧',
    tone: '鼓励性',
    suggestion: '建议稍后的时间段'
  },
  
  systemBehavior: {
    urgencyLevel: '不变',
    priority: '不变',
    notifications: '无额外通知'
  }
};
```

### 策略2：重复拖延（2-3次）
```typescript
const repeatedProcrastination = {
  displayStyle: {
    position: '稍微提前',
    appearance: '添加橙色边框',
    badge: '🔄 重试',
    animation: '轻微呼吸效果'
  },
  
  userExperience: {
    message: '🤔 这个任务似乎有点困难，要不要分解一下？',
    tone: '友善建议',
    suggestion: [
      '分解成更小的子任务',
      '调整预估时间',
      '选择更合适的时间段'
    ]
  },
  
  systemBehavior: {
    urgencyLevel: '提升一级',
    priority: '稍微提高',
    notifications: '温和提醒',
    smartSuggestions: '分析用户空闲时间，主动建议'
  }
};
```

### 策略3：持续拖延（4+次）
```typescript
const persistentProcrastination = {
  displayStyle: {
    position: '置顶显示',
    appearance: '红色脉冲边框',
    badge: '⚠️ 需要关注',
    animation: '缓慢呼吸脉冲'
  },
  
  userExperience: {
    message: '😅 这个任务很重要！让我们一起想办法完成它',
    tone: '关怀但坚定',
    actionButtons: [
      '🔄 重新安排',
      '✂️ 分解任务', 
      '⏰ 延长截止时间',
      '🤝 寻求帮助',
      '🗑️ 取消任务'
    ]
  },
  
  systemBehavior: {
    urgencyLevel: '最高级',
    priority: '置顶',
    notifications: '每日提醒',
    interventions: [
      '分析用户习惯，建议最佳时间',
      '检查是否任务过于困难',
      '建议寻求伴侣帮助'
    ]
  }
};
```

### 策略4：紧急状态
```typescript
const emergencyState = {
  trigger: '距离截止时间不足6小时',
  
  displayStyle: {
    position: '锁定在顶部',
    appearance: '红色背景 + 白色文字',
    badge: '🚨 紧急',
    animation: '快速闪烁'
  },
  
  userExperience: {
    message: '🚨 紧急：任务即将过期！',
    tone: '紧急但不焦虑',
    immediateActions: [
      '⚡ 立即执行',
      '📞 通知伴侣',
      '⏰ 申请延期',
      '❌ 确认放弃'
    ]
  },
  
  systemBehavior: {
    notifications: [
      '立即推送通知',
      '发送邮件提醒',
      '通知伴侣（如果是共同任务）'
    ],
    restrictions: [
      '阻止创建新任务',
      '在所有页面显示紧急提醒条'
    ]
  }
};
```

## 🧮 智能分析算法

### 1. 拖延模式识别
```typescript
const procrastinationPatternAnalysis = {
  // 分析用户的拖延模式
  analyzePattern: (taskHistory: TaskScheduleHistory[]) => {
    const patterns = {
      timeOfDay: analyzePreferredTime(taskHistory),
      dayOfWeek: analyzePreferredDays(taskHistory),
      taskType: analyzeTaskTypeDifficulty(taskHistory),
      duration: analyzeOptimalDuration(taskHistory)
    };
    
    return {
      insights: generateInsights(patterns),
      recommendations: generateRecommendations(patterns)
    };
  },
  
  // 生成个性化建议
  generatePersonalizedSuggestions: (analysis: PatternAnalysis) => [
    {
      type: 'time_optimization',
      message: '你在上午9-11点的执行率最高',
      action: '建议将重要任务安排在此时间段'
    },
    {
      type: 'task_sizing',
      message: '超过2小时的任务完成率较低',
      action: '建议将大任务分解为1小时以内的小块'
    },
    {
      type: 'energy_management', 
      message: '周一和周五的完成率偏低',
      action: '这两天建议安排简单任务'
    }
  ]
};
```

### 2. 情境感知调整
```typescript
const contextAwareAdjustment = {
  // 根据当前情境调整重现策略
  adjustByContext: (task: Task, context: CurrentContext) => {
    const adjustments = [];
    
    // 伴侣在线状态
    if (context.partnerOnline && task.canInvolvePartner) {
      adjustments.push({
        type: 'partner_support',
        message: 'TA现在在线，要不要一起完成这个任务？',
        action: 'invite_partner'
      });
    }
    
    // 当前时间段
    if (context.currentTimeSlot === 'focus_time') {
      adjustments.push({
        type: 'focus_optimization',
        message: '现在是你的专注时间段，很适合处理这个任务',
        action: 'suggest_immediate_execution'
      });
    }
    
    // 日历空闲度
    if (context.calendarAvailability === 'high') {
      adjustments.push({
        type: 'schedule_opportunity',
        message: '今天日程比较宽松，很适合安排这个任务',
        action: 'highlight_available_slots'
      });
    }
    
    return adjustments;
  }
};
```

## 🎭 用户体验设计

### 1. 渐进式提醒
```typescript
const progressiveReminders = {
  // 第一次：温和提醒
  gentle: {
    timing: '任务过期后1小时',
    message: '📝 "{taskName}" 还在等你呢～',
    tone: '轻松友好',
    actions: ['稍后提醒', '重新安排', '暂时跳过']
  },
  
  // 第二次：友好建议
  friendly: {
    timing: '任务过期后4小时',
    message: '🤔 要不要试试把 "{taskName}" 分解成小块？',
    tone: '建议性',
    actions: ['分解任务', '调整时间', '寻求帮助']
  },
  
  // 第三次：关怀提醒
  caring: {
    timing: '任务过期后12小时',
    message: '💙 我知道 "{taskName}" 很重要，我们一起想办法吧',
    tone: '关怀支持',
    actions: ['详细规划', '降低难度', '延期处理']
  }
};
```

### 2. 视觉反馈系统
```typescript
const visualFeedbackSystem = {
  // 颜色编码
  colorCoding: {
    normal: '#3b82f6',      // 蓝色：正常状态
    retry: '#f59e0b',       // 橙色：重试状态  
    concern: '#ef4444',     // 红色：需要关注
    emergency: '#dc2626'    // 深红：紧急状态
  },
  
  // 动画效果
  animations: {
    normal: 'none',
    retry: 'pulse 2s ease-in-out infinite',
    concern: 'bounce 1s ease-in-out 3',
    emergency: 'flash 0.5s linear infinite'
  },
  
  // 图标变化
  iconEvolution: {
    normal: '📋',
    retry: '🔄', 
    concern: '⚠️',
    emergency: '🚨'
  }
};
```

## 🛡️ 边界情况处理

### 1. 避免过度骚扰
```typescript
const antiHarassmentRules = {
  // 通知频率限制
  notificationLimits: {
    maxPerDay: 3,
    minInterval: 4 * 60 * 60 * 1000, // 4小时
    quietHours: ['22:00', '08:00']
  },
  
  // 自适应退避
  adaptiveBackoff: {
    rule: '用户连续忽略3次提醒后，降低提醒频率',
    implementation: '从每4小时改为每12小时',
    recovery: '用户主动操作任务后恢复正常频率'
  }
};
```

### 2. 用户控制权
```typescript
const userControlMechanisms = {
  // 暂停提醒
  snoozeOptions: [
    { label: '1小时后提醒', value: 1 * 60 * 60 * 1000 },
    { label: '明天提醒', value: 24 * 60 * 60 * 1000 },
    { label: '下周提醒', value: 7 * 24 * 60 * 60 * 1000 },
    { label: '暂时不提醒', value: null }
  ],
  
  // 彻底取消
  permanentDismissal: {
    action: '用户可以选择"我不想做这个任务了"',
    effect: '任务标记为已放弃，不再重现',
    confirmation: '需要二次确认，避免误操作'
  }
};
```

## 📊 效果监控

### 1. 成功指标
```typescript
const successMetrics = {
  // 重现成功率
  reappearanceSuccess: {
    definition: '重现后24小时内任务被重新安排的比例',
    target: '> 70%'
  },
  
  // 最终完成率
  ultimateCompletion: {
    definition: '经过重现机制后最终完成的任务比例',
    target: '> 85%'
  },
  
  // 用户满意度
  userSatisfaction: {
    definition: '用户对智能提醒系统的满意度评分',
    target: '> 4.0/5.0'
  }
};
```

### 2. 优化反馈循环
```typescript
const optimizationLoop = {
  // 数据收集
  dataCollection: [
    '任务重现次数分布',
    '不同策略的成功率',
    '用户交互行为模式',
    '放弃任务的原因分析'
  ],
  
  // 机器学习优化
  mlOptimization: {
    purpose: '根据用户行为优化提醒策略',
    features: [
      '用户历史行为',
      '任务类型特征',
      '时间上下文',
      '成功率反馈'
    ],
    goal: '个性化最优重现策略'
  }
};
```

## 🎯 实施步骤

### 第一阶段：基础重现（1周）
- [ ] 实现基本的时间触发检测
- [ ] 设计简单的重现机制  
- [ ] 添加基础的视觉反馈

### 第二阶段：智能策略（1周）
- [ ] 实现拖延次数统计
- [ ] 添加渐进式提醒策略
- [ ] 设计用户控制选项

### 第三阶段：个性化优化（1周）
- [ ] 添加模式识别算法
- [ ] 实现情境感知调整
- [ ] 优化视觉和交互体验

### 第四阶段：数据驱动改进（持续）
- [ ] 收集用户行为数据
- [ ] 分析策略有效性
- [ ] 持续优化算法

这个智能重现逻辑的核心是"渐进式关怀"——既不过度打扰用户，又能有效地帮助用户完成重要任务。它会根据用户的行为模式不断学习和调整，最终形成个性化的任务管理助手。
