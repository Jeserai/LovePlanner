# 🔧 PostgreSQL 数组格式修复说明

## 🚨 问题原因

错误信息：`malformed array literal: "[1]"`

**原因**：PostgreSQL 的整数数组字段不接受 JSON 字符串格式。

### ❌ 错误格式
```sql
repeat_weekdays = '[1]'          -- JSON 字符串格式
repeat_weekdays = '[1,2,3,4,5]'  -- JSON 字符串格式
```

### ✅ 正确格式
```sql
repeat_weekdays = ARRAY[1]          -- PostgreSQL 数组格式
repeat_weekdays = ARRAY[1,2,3,4,5]  -- PostgreSQL 数组格式
```

## 🔧 修复方案

### 方案1：使用修复版脚本
使用 `quick_test_data_fixed.sql` 替代 `quick_test_data.sql`

### 方案2：手动修复原脚本
在 `quick_test_data.sql` 中查找并替换：

```sql
-- 查找这些行并替换：
'[1]'         → ARRAY[1]
'[5]'         → ARRAY[5]  
'[1,2,3,4,5]' → ARRAY[1,2,3,4,5]
```

### 方案3：简化版本（无工作日限制）
如果不需要工作日限制，可以将所有 `repeat_weekdays` 设为 `NULL`：

```sql
-- 将所有数组字段改为 NULL
repeat_weekdays = NULL
```

## 📊 PostgreSQL 数组语法说明

### 基本语法
```sql
-- 空数组
ARRAY[]

-- 单个元素
ARRAY[1]

-- 多个元素  
ARRAY[1,2,3,4,5]

-- 字符串数组
ARRAY['monday', 'tuesday']
```

### 在我们的场景中
```sql
-- 周一到周五 (工作日)
repeat_weekdays = ARRAY[1,2,3,4,5]

-- 仅周一
repeat_weekdays = ARRAY[1]

-- 仅周五  
repeat_weekdays = ARRAY[5]

-- 周末
repeat_weekdays = ARRAY[6,0]  -- 周六和周日

-- 无限制
repeat_weekdays = NULL
```

## 🎯 修复后的测试任务

修复版脚本包含以下工作日限制任务：

1. **每周大扫除**: `ARRAY[1]` (仅周一)
2. **每周约会夜**: `ARRAY[5]` (仅周五)  
3. **工作日早餐**: `ARRAY[1,2,3,4,5]` (周一到周五)

## ✅ 验证修复结果

执行修复版脚本后，运行以下查询验证：

```sql
-- 检查数组字段是否正确
SELECT 
    title,
    repeat_weekdays,
    CASE 
        WHEN repeat_weekdays = ARRAY[1] THEN '仅周一'
        WHEN repeat_weekdays = ARRAY[5] THEN '仅周五'
        WHEN repeat_weekdays = ARRAY[1,2,3,4,5] THEN '工作日'
        WHEN repeat_weekdays IS NULL THEN '无限制'
        ELSE '其他限制'
    END as weekday_description
FROM tasks 
WHERE repeat_weekdays IS NOT NULL;
```

预期结果：
```
title        | repeat_weekdays | weekday_description
-------------|-----------------|-------------------
每周大扫除    | {1}            | 仅周一
每周约会夜    | {5}            | 仅周五  
工作日早餐    | {1,2,3,4,5}    | 工作日
```

## 🚀 现在可以正常使用

使用 `quick_test_data_fixed.sql` 脚本应该可以成功执行，不会再出现数组格式错误！
