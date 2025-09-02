# Calendar 组件优化方案

## 🚨 当前问题分析

### 问题1: 文件过大 (2783行)
- **单一文件包含所有逻辑**
- **大量重复代码**
- **职责不明确**

### 问题2: 功能混合
- 日历渲染逻辑
- 事件CRUD操作
- 时区转换逻辑
- UI状态管理
- 数据格式转换
- 样式计算

### 问题3: 重复和冗余代码
- 多个时区转换函数
- 重复的数据转换逻辑
- 复杂的条件渲染

## 🎯 优化方案

### 1. 文件拆分策略
```
Calendar/
├── Calendar.tsx           (主组件，200-300行)
├── hooks/
│   ├── useCalendarData.ts (日历数据逻辑)
│   ├── useEventActions.ts (事件操作逻辑)
│   └── useEventDisplay.ts (事件显示逻辑)
├── components/
│   ├── CalendarGrid.tsx   (日历网格)
│   ├── EventCard.tsx      (事件卡片)
│   ├── EventModal.tsx     (事件弹窗)
│   └── EventForm.tsx      (事件表单)
└── utils/
    ├── eventConverters.ts (数据转换)
    ├── calendarHelpers.ts (辅助函数)
    └── eventValidation.ts (验证逻辑)
```

### 2. 逻辑分层
- **Presentation Layer**: 纯UI组件
- **Business Logic Layer**: Hooks处理业务逻辑
- **Data Layer**: 数据转换和API调用
- **Utility Layer**: 纯函数工具

## 🚀 实施步骤

1. **第一阶段**: 提取事件转换逻辑
2. **第二阶段**: 提取Hooks
3. **第三阶段**: 拆分UI组件
4. **第四阶段**: 优化性能和类型安全
