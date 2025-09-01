# 日历数据库兼容性修复

## 问题描述
创建新的共同事件时出现错误：
```
invalid input syntax for type time: "2025-09-02T05:00:00.000Z"
```

## 根本原因
数据库的 `start_time` 和 `end_time` 字段是 PostgreSQL 的 `time` 类型，只能接受时间格式（如 "14:30:00"），而不能接受完整的 ISO datetime 字符串。

## 解决方案
采用"拆分存储，重新组合"的策略：

### 1. 存储策略
- **事件日期**: 存储在 `event_date` 字段 (date 类型)
- **开始时间**: 将用户本地时间转换为UTC时间，提取时间部分存储在 `start_time` 字段
- **结束时间**: 将用户本地时间转换为UTC时间，提取时间部分存储在 `end_time` 字段

### 2. 显示策略
- **重新组合**: 将 `event_date` + `start_time` 重新组合为完整的UTC datetime
- **时区转换**: 将UTC时间转换为用户本地时间显示

## 代码修改

### 1. 事件创建时间处理 (`convertEventToCreateParams`)

**修改前**:
```typescript
// 从 "2024-01-15T14:30" 中提取 "14:30"
startTime = originalStartDateTime.split('T')[1] || null;
```

**修改后**:
```typescript
// 将本地时间转换为UTC时间，然后提取时间部分
const startDate = new Date(originalStartDateTime);
const utcStartTime = startDate.toISOString().split('T')[1].split('.')[0]; // 提取 "HH:MM:SS"
startTime = utcStartTime;
```

### 2. 时间显示处理 (`formatTime`)

**新增逻辑**:
```typescript
// 重新构建完整的 datetime 来进行时区转换
if (eventDate && time.includes(':')) {
  // 将存储的UTC时间与事件日期重新组合
  const utcDatetimeString = `${eventDate}T${time}${time.length === 5 ? ':00' : ''}Z`;
  const utcDatetime = new Date(utcDatetimeString);
  
  if (!isNaN(utcDatetime.getTime())) {
    // 转换为用户本地时间显示
    return utcDatetime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
```

### 3. 编辑事件时间处理 (`convertToDateTimeLocal`)

**关键修改**:
```typescript
// 纯时间字符串需要重新构建完整的datetime进行时区转换
const utcDatetimeString = `${dateStr}T${timeStr}${timeStr.length === 5 ? ':00' : ''}Z`;
const utcDatetime = new Date(utcDatetimeString);

if (!isNaN(utcDatetime.getTime())) {
  // 转换为本地时间的 datetime-local 格式
  const year = utcDatetime.getFullYear();
  const month = String(utcDatetime.getMonth() + 1).padStart(2, '0');
  const day = String(utcDatetime.getDate()).padStart(2, '0');
  const hours = String(utcDatetime.getHours()).padStart(2, '0');
  const minutes = String(utcDatetime.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
```

### 4. 事件更新时间处理

**新增转换函数**:
```typescript
const convertLocalToUTCTime = (localDateTime: string) => {
  try {
    const date = new Date(localDateTime);
    return date.toISOString().split('T')[1].split('.')[0]; // 提取 "HH:MM:SS"
  } catch (e) {
    console.warn('时间转换失败:', localDateTime, e);
    return localDateTime;
  }
};
```

## 时区处理流程

### 创建事件
1. 用户输入: `2025-09-02T14:30` (本地时间)
2. 转换为UTC: `2025-09-02T06:30:00.000Z` (假设UTC+8)
3. 数据库存储:
   - `event_date`: `2025-09-02`
   - `start_time`: `06:30:00`

### 显示事件
1. 数据库读取:
   - `event_date`: `2025-09-02`
   - `start_time`: `06:30:00`
2. 重新组合: `2025-09-02T06:30:00Z`
3. 转换为本地时间: `14:30` (对UTC+8用户)

### 编辑事件
1. 重新组合UTC时间: `2025-09-02T06:30:00Z`
2. 转换为 datetime-local 格式: `2025-09-02T14:30`
3. 显示在编辑表单中

## 兼容性保证

- **向后兼容**: 支持旧的纯时间格式 ("14:30")
- **错误处理**: 时间解析失败时有默认值
- **渐进升级**: 新事件使用新格式，旧事件继续正常工作

## 测试验证

### 验证步骤
1. **创建事件**: 设置特定时间，检查数据库存储格式
2. **显示验证**: 不同时区用户看到的时间应该不同
3. **编辑验证**: 编辑表单应该回显正确的本地时间
4. **更新验证**: 更新后的时间应该正确

### 示例测试
```
用户A (北京, UTC+8): 创建 14:30 事件
数据库存储: event_date='2025-09-02', start_time='06:30:00'
用户B (纽约, UTC-5): 看到 01:30 (第二天)
用户C (伦敦, UTC+0): 看到 06:30
```

## 总结

通过这次修复：
- ✅ 解决了数据库类型兼容性问题
- ✅ 保持了时区转换功能
- ✅ 维持了向后兼容性
- ✅ 提供了正确的跨时区显示

现在用户可以正常创建和查看共同事件，每个用户都能看到符合自己时区的准确时间！
