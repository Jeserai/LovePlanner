# Event表结构重新设计分析

## 🚨 当前表结构的问题

### 1. 跨天事件问题
```sql
-- 当前结构
event_date: "2025-09-02"     -- 只有一个日期
start_time: "23:00:00"       -- 开始时间
end_time: "02:00:00"         -- 结束时间（第二天凌晨2点）
```

**问题**：无法表示结束时间是第二天！

### 2. 重复事件的复杂性
```sql
-- 当前处理重复事件的方式
original_date: "2025-09-02"     -- 原始日期
recurrence_type: "weekly"       -- 重复类型
recurrence_end: "2025-12-02"    -- 重复结束日期
```

**问题**：
- 跨天的重复事件如何处理？
- 时区变化时重复事件如何计算？
- 夏令时切换时如何处理？

## 🎯 重新设计的核心思路

### 1. 使用完整的时间戳
```sql
start_datetime: timestamptz     -- 2025-09-02T23:00:00+00:00
end_datetime: timestamptz       -- 2025-09-03T02:00:00+00:00
```

### 2. 重复事件的规则存储
```sql
-- 重复规则以JSON格式存储，支持复杂规则
recurrence_rule: jsonb  -- {"freq": "weekly", "interval": 1, "byday": ["MO","WE"]}
```

### 3. 派生字段用于查询优化
```sql
-- 为了查询性能，保留一些派生字段
event_date: date        -- 从start_datetime派生，用于日历视图查询
duration_minutes: int   -- 事件持续时间（分钟）
is_multi_day: boolean   -- 是否跨天事件
```

## 📊 具体场景分析

### 场景1：跨天事件
```sql
-- 晚上11点到第二天凌晨2点的聚会
start_datetime: "2025-09-02T23:00:00+00:00"
end_datetime: "2025-09-03T02:00:00+00:00"
event_date: "2025-09-02"  -- 按开始日期
is_multi_day: true
duration_minutes: 180
```

### 场景2：多天事件
```sql
-- 3天的旅行
start_datetime: "2025-09-02T09:00:00+00:00"
end_datetime: "2025-09-04T18:00:00+00:00"
event_date: "2025-09-02"  -- 按开始日期
is_multi_day: true
duration_minutes: 3060  -- 51小时
```

### 场景3：重复的跨天事件
```sql
-- 每周五晚上的聚会（23:00-02:00）
start_datetime: "2025-09-05T23:00:00+00:00"  -- 第一次发生
end_datetime: "2025-09-06T02:00:00+00:00"
recurrence_rule: {"freq": "weekly", "byday": ["FR"]}
is_multi_day: true
```
