# 时区处理策略设计文档

## 问题背景

LovePlanner 需要处理跨时区用户的任务管理，特别是打卡类任务的时间计算和显示。

## 当前问题

1. **显示错误**: 9月1日打卡显示为8月31日
2. **时区混乱**: 不同时区用户看到不同的任务时间
3. **周期计算**: 每日/每周任务的周期边界模糊

## 设计选项

### 选项1: 发布者时区为准 ⭐ (推荐)

**原理**: 所有任务时间以发布者的时区为基准

**优点**:
- 任务逻辑一致性强
- 发布者对任务时间有准确预期
- 避免多接受者时区冲突

**缺点**:
- 接受者需要适应发布者时区
- 跨时区体验不够自然

**实现**:
```typescript
// 1. 存储发布者时区
interface Task {
  creator_timezone: string; // 'Asia/Shanghai'
  // ...
}

// 2. 时间计算统一使用发布者时区
function getTaskLocalTime(task: Task, currentUTC: Date): Date {
  return convertUTCToTimezone(currentUTC, task.creator_timezone);
}

// 3. 周期计算
function calculatePeriodKey(task: Task, currentUTC: Date): string {
  const taskLocalTime = getTaskLocalTime(task, currentUTC);
  // 使用任务本地时间计算周期
}
```

### 选项2: 接受者时区为准

**原理**: 每个用户看到的都是自己时区的任务时间

**优点**:
- 用户体验最自然
- 符合用户习惯

**缺点**:
- 多个接受者时区不同时逻辑复杂
- 发布者和接受者看到不同时间

### 选项3: UTC统一时区 (当前)

**原理**: 所有时间计算都使用UTC，显示时转换

**优点**:
- 实现简单
- 数据一致性好

**缺点**:
- 用户体验不直观
- 边界时间容易混乱

## 推荐实施方案

### 阶段1: 即时修复 (本次)
1. 修复当前的时区显示问题
2. 添加详细的时区调试信息
3. 确保周期计算的一致性

### 阶段2: 中期改进
1. 在数据库中添加 `creator_timezone` 字段
2. 实现时区转换工具函数
3. 任务创建时记录发布者时区

### 阶段3: 长期优化
1. 用户设置中添加时区选择
2. 任务详情显示多时区信息
3. 智能时区提醒功能

## 具体实现

### 数据库扩展
```sql
ALTER TABLE tasks ADD COLUMN creator_timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE user_profiles ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
```

### 前端工具函数
```typescript
// 时区转换工具
export class TimezoneManager {
  static convertUTCToTimezone(utcDate: Date, timezone: string): Date {
    return new Date(utcDate.toLocaleString("en-US", {timeZone: timezone}));
  }
  
  static getTaskLocalTime(task: Task, currentUTC: Date): Date {
    return this.convertUTCToTimezone(currentUTC, task.creator_timezone || 'UTC');
  }
  
  static calculateTaskPeriodKey(task: Task, currentUTC: Date): string {
    const taskLocalTime = this.getTaskLocalTime(task, currentUTC);
    // 使用任务本地时间计算周期标识符
    // ...
  }
}
```

### 用户界面改进
```typescript
// 任务详情显示多时区信息
{task.creator_timezone !== userTimezone && (
  <div className="text-sm text-gray-500">
    发布者时间: {formatTime(taskTime, task.creator_timezone)}
    我的时间: {formatTime(taskTime, userTimezone)}
  </div>
)}
```

## 注意事项

1. **向后兼容**: 确保现有任务不受影响
2. **性能考虑**: 时区转换不要过于频繁
3. **用户教育**: 清楚说明时区逻辑
4. **边界情况**: 处理夏令时等特殊情况

## 结论

推荐采用 "发布者时区为准" 的策略，既保证逻辑一致性，又相对容易实现。通过分阶段实施，逐步改善用户体验。
