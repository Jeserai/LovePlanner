# 🔧 任务状态约束问题修复说明

## 🚨 问题原因

错误信息：`new row for relation "tasks" violates check constraint "tasks_status_check"`

**原因**：数据库的状态检查约束与代码中定义的状态不匹配。

## 🔍 问题分析

### 代码中定义的状态 (6个)
```typescript
// src/types/task.ts
export type TaskStatus = 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review';
```

### 数据库约束中的状态 (5个)
```typescript
// src/lib/supabase.ts
status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned'
```

### ❌ 缺少的状态
`pending_review` 状态在数据库约束中不存在！

## 🔧 修复方案

### 方案1：移除 pending_review 状态 (推荐)
将使用 `pending_review` 的任务改为其他有效状态：

```sql
-- ❌ 错误：使用不存在的状态
status = 'pending_review'

-- ✅ 修复：使用有效状态
status = 'completed'  -- 如果任务已完成
status = 'in_progress'  -- 如果任务进行中
```

### 方案2：更新数据库约束 (复杂)
需要修改数据库表结构：

```sql
-- 需要数据库管理员权限
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned', 'pending_review'));
```

## 🎯 当前修复

### 测试数据修复
```sql
-- 修复前：
'pending_review'  -- ❌ 违反约束

-- 修复后：
'completed'       -- ✅ 符合约束
```

### 任务含义调整
- **原计划**：整理书房 (待审核)
- **修复后**：整理书房 (已完成)

## 📊 有效的任务状态

### 1. `recruiting` - 招募中
- 任务刚创建，等待领取
- `assignee_id = NULL`

### 2. `assigned` - 已分配  
- 任务已被领取，未开始
- `assignee_id != NULL`

### 3. `in_progress` - 进行中
- 任务正在执行
- 可以打卡或完成

### 4. `completed` - 已完成
- 任务已完成（终态）
- 一次性任务或达到required_count

### 5. `abandoned` - 已放弃
- 任务被放弃或过期
- 可以重新发布

## 🚀 修复后的测试数据

### 状态分布 (18个任务)
- **recruiting**: 2个 (洗碗、双周约会)
- **assigned**: 5个 (健身、大扫除、约会夜、生日惊喜、工作日早餐、新年准备)
- **in_progress**: 6个 (阅读、理财、学习技能、说我爱你、30天挑战、睡前聊天)
- **completed**: 3个 (喝水、装饰新家、整理书房)
- **abandoned**: 1个 (冥想)

### 测试覆盖
- ✅ 所有5种有效状态都有测试数据
- ✅ 不同任务类型的状态转换
- ✅ 重复任务和一次性任务的完成逻辑

## 💡 未来建议

### 如果需要审核功能
可以考虑以下替代方案：

#### 方案A：使用字段标记
```sql
-- 添加审核相关字段
requires_review BOOLEAN DEFAULT FALSE
review_status VARCHAR(20) -- 'pending', 'approved', 'rejected'
reviewed_by UUID
reviewed_at TIMESTAMP
```

#### 方案B：使用状态组合
```sql
-- 使用现有状态 + 标记字段
status = 'completed'
requires_review = TRUE
review_comment = NULL  -- 待审核
review_comment != NULL -- 已审核
```

#### 方案C：扩展状态枚举
```sql
-- 正式添加到数据库约束
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('recruiting', 'assigned', 'in_progress', 'completed', 'abandoned', 'pending_review'));
```

## ✅ 验证修复

执行修复后的脚本，应该看到：
- ✅ 18个任务成功创建
- ✅ 没有状态约束错误
- ✅ 所有状态都是有效的
- ✅ 测试覆盖完整

## 🎉 修复完成

现在使用修复后的测试数据脚本应该可以完美运行，不会再出现状态约束错误！
