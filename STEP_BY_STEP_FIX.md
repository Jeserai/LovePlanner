# 🔧 分步修复指南：处理 NULL 值错误

## 🚨 错误原因

你遇到的错误是因为：
1. 有些任务的 `completion_record` 字段是 `NULL`（这是正常的，表示还没有完成记录）
2. 修复脚本试图对所有记录进行操作，包括 `NULL` 值
3. 数据库约束不允许将 `NULL` 值写入该字段

## ✅ 解决方案：分步安全修复

### 第一步：查看数据状态
```sql
-- 查看所有数据的分布情况
SELECT 
    CASE 
        WHEN completion_record IS NULL THEN 'NULL (正常)'
        WHEN completion_record::text LIKE '{%' THEN '对象格式 (需修复)'
        WHEN completion_record::text LIKE '[%' THEN '数组格式 (正确)'
        ELSE '其他格式'
    END as format_type,
    COUNT(*) as count
FROM tasks 
GROUP BY format_type
ORDER BY count DESC;
```

### 第二步：只修复有问题的记录
```sql
-- 安全修复：只处理对象格式的非空记录
UPDATE tasks 
SET completion_record = (
    SELECT jsonb_agg(key ORDER BY key)
    FROM jsonb_object_keys(completion_record) AS key
    WHERE (completion_record ->> key)::boolean = true
)
WHERE completion_record IS NOT NULL 
AND completion_record::text LIKE '{%'
AND jsonb_typeof(completion_record) = 'object';
```

### 第三步：修复计数字段
```sql
-- 修复 completed_count，只处理有记录的任务
UPDATE tasks 
SET completed_count = jsonb_array_length(completion_record)
WHERE completion_record IS NOT NULL
AND jsonb_typeof(completion_record) = 'array';
```

### 第四步：清理不一致的数据
```sql
-- 修复那些 completion_record 为 NULL 但 completed_count > 0 的记录
UPDATE tasks 
SET completed_count = 0
WHERE completion_record IS NULL 
AND completed_count > 0;
```

### 第五步：验证修复结果
```sql
-- 验证所有数据是否一致
SELECT 
    id,
    title,
    completion_record,
    completed_count,
    CASE 
        WHEN completion_record IS NULL AND completed_count = 0 THEN '✅ NULL记录正确'
        WHEN completion_record IS NOT NULL AND completed_count = jsonb_array_length(completion_record) THEN '✅ 数据一致'
        ELSE '❌ 需要检查'
    END as status
FROM tasks 
WHERE completion_record IS NOT NULL OR completed_count > 0
ORDER BY status;
```

## 🎯 关键要点

### NULL 值是正常的
- `completion_record = NULL` 表示任务还没有完成记录
- 这种情况下 `completed_count` 应该为 0
- **不需要修复 NULL 值**

### 只修复对象格式
- 只有 `{"2024-01-01": true}` 这种格式需要转换
- `["2024-01-01"]` 格式已经正确
- `NULL` 值保持不变

### 数据一致性规则
```
如果 completion_record = NULL，则 completed_count = 0
如果 completion_record = ["2024-01-01", "2024-01-02"]，则 completed_count = 2
```

## 🚀 一键安全修复脚本

如果你想一次性执行所有步骤，使用 `supabase_fix_safe.sql` 文件：

```bash
# 在 Supabase Dashboard 的 SQL Editor 中
# 复制粘贴 supabase_fix_safe.sql 的内容并执行
```

## 📊 修复后的数据状态

修复完成后，你应该看到：
- ✅ 所有对象格式 `{...}` 都转换为数组格式 `[...]`
- ✅ `NULL` 值保持不变（这是正常的）
- ✅ `completed_count` 与实际记录数一致
- ✅ 没有数据丢失

## 🔍 常见问题

**Q: 为什么有些 completion_record 是 NULL？**
A: 这是正常的！表示任务还没有任何完成记录。

**Q: NULL 值需要修复吗？**
A: 不需要！NULL 值是正确的状态。

**Q: 修复后还会有兼容性问题吗？**
A: 不会！代码已经能够正确处理 NULL 值和数组格式。

**Q: 如何确认修复成功？**
A: 运行验证查询，确保没有对象格式 `{...}` 的记录，且数据一致性为 100%。
