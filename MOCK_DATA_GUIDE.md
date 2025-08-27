# 模拟数据插入指南

## 概述

这个指南将帮你在LovePlanner应用中插入一些模拟的任务和日程数据，用于测试和演示。

## 文件说明

### 1. `insert-mock-data.sql` (完整版)
- 包含任务、日程事件、积分交易和商店物品的完整模拟数据
- **需要先确保所有表结构都已创建**
- 适用于完整功能测试

### 2. `insert-simple-mock-data.sql` (简化版)
- **推荐使用**：只包含日程事件数据
- 兼容当前的简化事件表结构
- 更安全，不会因为缺少表而失败

## 使用步骤

### 步骤1: 确保数据库已初始化

首先确保你已经运行了以下脚本：
```sql
-- 1. 用户和情侣数据初始化
-- 2. redesign-events-table.sql（事件表结构）
-- 3. database-minimal-color-migration.sql（颜色配置）
```

### 步骤2: 检查现有数据

在Supabase SQL编辑器中运行：
```sql
-- 检查是否有情侣数据
SELECT 
    c.id as couple_id,
    u1.display_name as user1_name,
    u2.display_name as user2_name,
    c.is_active
FROM couples c
LEFT JOIN user_profiles u1 ON c.user1_id = u1.id
LEFT JOIN user_profiles u2 ON c.user2_id = u2.id
WHERE c.is_active = true;
```

### 步骤3: 插入模拟数据

**推荐方式**：在Supabase SQL编辑器中复制并运行：
```sql
-- 复制 insert-simple-mock-data.sql 的全部内容并执行
```

**或者如果你想要完整数据**：
```sql
-- 复制 insert-mock-data.sql 的全部内容并执行
-- 注意：需要确保tasks表等都已创建
```

### 步骤4: 验证数据

运行以下查询验证数据是否正确插入：

```sql
-- 检查事件统计
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN includes_user1 AND includes_user2 THEN 1 END) as shared_events,
    COUNT(CASE WHEN includes_user1 AND NOT includes_user2 THEN 1 END) as user1_events,
    COUNT(CASE WHEN includes_user2 AND NOT includes_user1 THEN 1 END) as user2_events
FROM events;

-- 查看最近的事件
SELECT 
    title,
    event_date,
    start_time,
    CASE 
        WHEN includes_user1 AND includes_user2 THEN 'shared'
        WHEN includes_user1 THEN 'user1'
        ELSE 'user2'
    END as event_type
FROM events 
ORDER BY event_date, start_time;
```

## 插入的数据概览

### 简化版包含的事件：

1. **今天**：
   - 19:00 浪漫晚餐（共同）

2. **明天**：
   - 08:00 瑜伽课程（用户1）
   - 21:00 在线学习（用户2）

3. **后天**：
   - 14:00 团队会议（用户2）

4. **本周末**：
   - 20:00 电影之夜（共同）

5. **下周**：
   - 10:00 客户演示（用户1）
   - 18:30 夫妻健身时间（共同，重复事件）

6. **下个月**：
   - 全天 我们的纪念日（共同）

### 事件类型分布：
- **共同事件**：4个（浪漫晚餐、电影之夜、健身时间、纪念日）
- **用户1个人事件**：2个（瑜伽、客户演示）
- **用户2个人事件**：2个（会议、学习）
- **重复事件**：1个（每周健身）
- **全天事件**：1个（纪念日）

## 故障排除

### 错误1: "未找到活跃的情侣关系"
**解决方案**：
```sql
-- 检查是否有用户数据
SELECT * FROM user_profiles;

-- 检查是否有情侣关系
SELECT * FROM couples;

-- 如果没有，需要先运行用户初始化脚本
```

### 错误2: "表不存在"
**解决方案**：
确保先运行了 `redesign-events-table.sql` 创建事件表结构。

### 错误3: "函数不存在"
**解决方案**：
这是正常的，脚本会自动降级到直接插入模式。

## 测试建议

插入数据后，在LovePlanner应用中测试：

1. **登录为Cat用户**：
   - 查看"我的日历"应该显示用户1的事件
   - 查看"伴侣日历"应该显示用户2的事件
   - 查看"共同日历"应该只显示共同事件

2. **登录为Cow用户**：
   - 验证视图切换是否正确
   - 确认颜色区分是否清晰

3. **功能测试**：
   - 事件详情查看
   - 事件编辑（如果有权限）
   - 新建事件
   - 重复事件显示

## 清理数据

如果需要重新开始：
```sql
-- 小心！这会删除所有事件数据
DELETE FROM events WHERE couple_id IN (
    SELECT id FROM couples WHERE is_active = true
);
```

## 下一步

数据插入成功后，你可以：
1. 测试Calendar组件的所有功能
2. 验证不同主题下的显示效果
3. 测试用户权限和事件过滤
4. 开发更多功能模块
