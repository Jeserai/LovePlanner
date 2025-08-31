# 📊 一次性任务与重复性任务：单表 vs 分表分析

## 🤔 **核心问题**
是否需要将一次性任务和重复性任务分开为两个表？

---

## 📋 **方案对比**

### **方案A: 单表设计（当前方案）**

```sql
-- 所有任务都在一个表中
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  repeat_frequency TEXT CHECK (repeat_frequency IN ('never', 'daily', 'weekly', 'forever')),
  
  -- 一次性任务字段
  required_count INTEGER,           -- never: 1, 其他: >1 或 null
  task_deadline TIMESTAMPTZ,        -- never: 必填, forever: null
  
  -- 重复任务字段
  earliest_start_time TIMESTAMPTZ,  -- 重复任务使用
  repeat_weekdays INTEGER[],        -- 重复任务使用
  daily_time_start TIME,            -- 重复任务使用
  
  -- 共同字段
  completed_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  completion_record JSONB DEFAULT '{}'
);
```

### **方案B: 分表设计**

```sql
-- 基础任务表
CREATE TABLE base_tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  creator_id UUID NOT NULL,
  couple_id UUID NOT NULL,
  task_type TEXT CHECK (task_type IN ('daily', 'habit', 'special')),
  requires_proof BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'recruiting',
  assignee_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 一次性任务表
CREATE TABLE once_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,           -- 可选开始时间
  deadline TIMESTAMPTZ NOT NULL,    -- 必填截止时间
  completed_at TIMESTAMPTZ,
  proof_url TEXT
);

-- 重复任务表
CREATE TABLE repeat_tasks (
  id UUID PRIMARY KEY REFERENCES base_tasks(id) ON DELETE CASCADE,
  repeat_frequency TEXT NOT NULL CHECK (repeat_frequency IN ('daily', 'weekly', 'monthly', 'forever')),
  earliest_start_time TIMESTAMPTZ,
  required_count INTEGER,           -- forever任务为null
  task_deadline TIMESTAMPTZ,        -- forever任务为null
  repeat_weekdays INTEGER[],
  daily_time_start TIME,
  daily_time_end TIME,
  completed_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  completion_record JSONB DEFAULT '{}'
);
```

---

## ⚖️ **详细对比分析**

### **🟢 单表设计的优势**

#### **1. 简单性**
- ✅ **代码简单**: 只需要操作一个表
- ✅ **查询简单**: 不需要JOIN操作
- ✅ **维护简单**: 只有一个表结构需要维护

#### **2. 性能优势**
- ✅ **查询性能**: 单表查询比JOIN查询快
- ✅ **索引效率**: 单表索引更直接
- ✅ **缓存友好**: 数据局部性更好

#### **3. 开发效率**
- ✅ **API统一**: 一套CRUD接口处理所有任务
- ✅ **前端简单**: 不需要区分任务类型的不同接口
- ✅ **业务逻辑统一**: 状态管理、权限检查等逻辑统一

#### **4. 数据一致性**
- ✅ **事务简单**: 单表操作，事务边界清晰
- ✅ **约束统一**: 所有任务遵循相同的业务规则

### **🔴 单表设计的劣势**

#### **1. 字段冗余**
- ❌ **NULL字段多**: 一次性任务不需要repeat相关字段
- ❌ **存储浪费**: 每行都包含所有可能的字段

#### **2. 约束复杂**
- ❌ **条件约束**: 需要复杂的CHECK约束来保证数据一致性
- ❌ **验证逻辑**: 应用层需要复杂的验证逻辑

---

### **🟢 分表设计的优势**

#### **1. 数据纯净**
- ✅ **无冗余字段**: 每个表只包含相关字段
- ✅ **存储效率**: 减少NULL字段，节省存储空间
- ✅ **类型安全**: 每种任务类型有专门的约束

#### **2. 扩展性**
- ✅ **独立扩展**: 可以为不同任务类型添加专门字段
- ✅ **性能优化**: 可以为不同表采用不同的优化策略

#### **3. 业务清晰**
- ✅ **概念分离**: 一次性任务和重复任务在概念上完全分离
- ✅ **专门优化**: 可以为不同任务类型实现专门的业务逻辑

### **🔴 分表设计的劣势**

#### **1. 复杂性增加**
- ❌ **JOIN查询**: 需要JOIN操作获取完整信息
- ❌ **代码复杂**: 需要不同的DAO/Service处理不同表
- ❌ **维护成本**: 多个表结构需要同步维护

#### **2. 性能问题**
- ❌ **JOIN开销**: 获取任务列表需要JOIN操作
- ❌ **查询复杂**: 统一查询需要UNION操作

#### **3. 开发复杂**
- ❌ **API分离**: 需要不同的API处理不同任务类型
- ❌ **前端复杂**: 需要处理不同的数据结构
- ❌ **事务复杂**: 跨表操作需要更复杂的事务管理

---

## 📊 **实际使用场景分析**

### **情侣应用的特点**
1. **用户量小**: 只有两个用户，数据量不大
2. **功能简单**: 主要是任务分配和完成跟踪
3. **查询模式**: 主要是"获取我的任务列表"这类简单查询
4. **开发资源**: 通常开发资源有限，需要快速迭代

### **数据量估算**
```
假设一对情侣一年创建的任务：
- 一次性任务: 100个/年
- 重复任务: 20个/年
- 总数据量: 120行/年

即使10年也只有1200行数据，数据量很小
```

### **查询模式分析**
```sql
-- 最常见的查询：获取用户的任务列表
-- 单表设计
SELECT * FROM tasks WHERE assignee_id = ? ORDER BY created_at DESC;

-- 分表设计
SELECT bt.*, ot.deadline, ot.completed_at, NULL as repeat_frequency
FROM base_tasks bt JOIN once_tasks ot ON bt.id = ot.id 
WHERE bt.assignee_id = ?
UNION ALL
SELECT bt.*, rt.task_deadline, rt.completed_at, rt.repeat_frequency
FROM base_tasks bt JOIN repeat_tasks rt ON bt.id = rt.id 
WHERE bt.assignee_id = ?
ORDER BY created_at DESC;
```

---

## 🎯 **推荐方案**

### **推荐：继续使用单表设计**

基于以下理由：

#### **1. 符合应用特点**
- 情侣应用数据量小，字段冗余的影响微乎其微
- 查询模式简单，不需要复杂的数据分析
- 开发资源有限，需要快速迭代

#### **2. 实际优势明显**
- 开发效率高，维护成本低
- 查询性能好（无JOIN开销）
- 代码简单，bug少

#### **3. 未来扩展考虑**
- 如果未来数据量增长，可以考虑分表
- 如果业务复杂度增加，可以重构
- 当前阶段，简单性比纯净性更重要

### **优化建议**

即使使用单表，也可以通过以下方式优化：

#### **1. 视图分离**
```sql
-- 创建专门的视图
CREATE VIEW once_tasks_view AS
SELECT * FROM tasks WHERE repeat_frequency = 'never';

CREATE VIEW repeat_tasks_view AS
SELECT * FROM tasks WHERE repeat_frequency != 'never';
```

#### **2. 服务层分离**
```typescript
// 在服务层提供专门的接口
class TaskService {
  async getOnceTasks(userId: string) {
    return this.getTasks(userId, { repeat_frequency: 'never' });
  }
  
  async getRepeatTasks(userId: string) {
    return this.getTasks(userId, { repeat_frequency: ['daily', 'weekly', 'forever'] });
  }
}
```

#### **3. 类型分离**
```typescript
// TypeScript中使用联合类型
type OnceTask = Task & { repeat_frequency: 'never' };
type RepeatTask = Task & { repeat_frequency: 'daily' | 'weekly' | 'forever' };
```

---

## 🔄 **何时考虑分表**

如果出现以下情况，可以考虑分表：

1. **数据量大**: 单表超过10万行
2. **性能问题**: 查询性能明显下降
3. **业务复杂**: 不同任务类型的业务逻辑差异很大
4. **团队规模**: 有足够的开发资源维护复杂架构

---

## ✅ **结论**

对于当前的情侣应用，**建议继续使用单表设计**：

1. **简单实用**: 符合应用规模和复杂度
2. **开发高效**: 减少开发和维护成本
3. **性能良好**: 在当前数据量下性能更好
4. **易于扩展**: 未来可以根据需要重构

**核心原则**: 在正确的时间做正确的事。当前阶段，简单性比完美的数据模型更重要。
