# 重复事件规则设计

## 🔄 recurrence_rule 字段设计

基于 RFC 5545 (iCalendar) 标准，使用 JSON 格式存储重复规则。

### 基础格式
```json
{
  "freq": "weekly",           // 重复频率：daily, weekly, monthly, yearly
  "interval": 1,              // 间隔：每1周、每2周等
  "count": 10,                // 总次数（与until互斥）
  "until": "2025-12-31",      // 结束日期（与count互斥）
  "byday": ["MO", "WE", "FR"], // 星期几：MO,TU,WE,TH,FR,SA,SU
  "bymonthday": [1, 15],      // 每月的第几天
  "bymonth": [1, 6, 12],      // 月份
  "byhour": [9, 14],          // 小时
  "byminute": [0, 30]         // 分钟
}
```

## 📅 常见场景示例

### 1. 每日重复
```json
{
  "freq": "daily",
  "interval": 1,
  "until": "2025-12-31"
}
```

### 2. 工作日重复
```json
{
  "freq": "weekly",
  "interval": 1,
  "byday": ["MO", "TU", "WE", "TH", "FR"]
}
```

### 3. 每两周的周一和周三
```json
{
  "freq": "weekly",
  "interval": 2,
  "byday": ["MO", "WE"]
}
```

### 4. 每月第一个和第三个周五
```json
{
  "freq": "monthly",
  "interval": 1,
  "byday": ["1FR", "3FR"]
}
```

### 5. 每季度最后一天
```json
{
  "freq": "monthly",
  "interval": 3,
  "bymonthday": [-1]
}
```

### 6. 复杂例子：跨天的重复事件
```json
// 每周五晚上11点到周六凌晨2点的聚会
{
  "freq": "weekly",
  "interval": 1,
  "byday": ["FR"]
}
```

对应的事件数据：
```sql
start_datetime: "2025-09-05T23:00:00+00:00"  -- 周五晚上11点
end_datetime: "2025-09-06T02:00:00+00:00"    -- 周六凌晨2点
is_multi_day: true
recurrence_rule: {"freq": "weekly", "byday": ["FR"]}
```

## 🎯 重复事件实例生成逻辑

### 原始事件 vs 事件实例

#### 原始事件（模板）
```sql
id: "550e8400-e29b-41d4-a716-446655440000"
title: "周末聚会"
start_datetime: "2025-09-05T23:00:00+00:00"
end_datetime: "2025-09-06T02:00:00+00:00"
is_recurring: true
recurrence_rule: {"freq": "weekly", "byday": ["FR"]}
original_event_id: NULL
instance_date: NULL
```

#### 事件实例（具体发生）
```sql
-- 第二次发生 (2025-09-12)
id: "550e8400-e29b-41d4-a716-446655440001"
title: "周末聚会"
start_datetime: "2025-09-12T23:00:00+00:00"
end_datetime: "2025-09-13T02:00:00+00:00"
is_recurring: false
recurrence_rule: NULL
original_event_id: "550e8400-e29b-41d4-a716-446655440000"
instance_date: "2025-09-12"

-- 第三次发生 (2025-09-19)
id: "550e8400-e29b-41d4-a716-446655440002"
title: "周末聚会"
start_datetime: "2025-09-19T23:00:00+00:00"
end_datetime: "2025-09-20T02:00:00+00:00"
is_recurring: false
recurrence_rule: NULL
original_event_id: "550e8400-e29b-41d4-a716-446655440000"
instance_date: "2025-09-19"
```

## 🚫 例外处理

### 排除特定日期
```sql
-- 跳过某些特定日期
excluded_dates: ['2025-09-19', '2025-10-03']
```

### 修改特定实例
```json
// 修改2025-09-26这一次的时间
{
  "2025-09-26": {
    "start_datetime": "2025-09-26T22:00:00+00:00",
    "end_datetime": "2025-09-27T01:00:00+00:00",
    "title": "周末聚会（提前1小时）"
  }
}
```

## 🔍 查询示例

### 查询某个日期范围的所有事件实例
```sql
-- 查询2025年9月的所有事件（包括重复事件的实例）
WITH RECURSIVE event_instances AS (
  -- 基础事件（非重复 + 重复事件的原始记录）
  SELECT 
    id, title, start_datetime, end_datetime, 
    event_date, is_multi_day, is_recurring,
    recurrence_rule, original_event_id, instance_date
  FROM events_new
  WHERE event_date BETWEEN '2025-09-01' AND '2025-09-30'
    AND original_event_id IS NULL
  
  UNION ALL
  
  -- 重复事件的实例（这里需要应用recurrence_rule逻辑）
  -- 实际实现会在应用层处理复杂的重复规则
  SELECT 
    gen_random_uuid() as id,
    e.title,
    e.start_datetime + (INTERVAL '7 days' * generate_series(1, 4)) as start_datetime,
    e.end_datetime + (INTERVAL '7 days' * generate_series(1, 4)) as end_datetime,
    (e.start_datetime + (INTERVAL '7 days' * generate_series(1, 4)))::date as event_date,
    e.is_multi_day,
    false as is_recurring,
    NULL as recurrence_rule,
    e.id as original_event_id,
    (e.start_datetime + (INTERVAL '7 days' * generate_series(1, 4)))::date as instance_date
  FROM events_new e
  WHERE e.is_recurring = true 
    AND e.recurrence_rule->>'freq' = 'weekly'
    AND e.event_date <= '2025-09-01'
)
SELECT * FROM event_instances
ORDER BY start_datetime;
```

## 💡 实施建议

1. **渐进式迁移**：先创建新表结构，保持旧表运行
2. **数据迁移工具**：编写脚本将现有数据转换到新格式
3. **应用层适配**：更新前端和后端代码以支持新的数据结构
4. **重复事件生成**：实现智能的重复事件实例生成算法
5. **性能优化**：为常见查询创建适当的索引
