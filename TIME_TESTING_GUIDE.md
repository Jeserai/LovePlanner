# ⏰ 重复任务时间测试解决方案

## 🚨 问题描述

测试重复任务的打卡功能面临的时间限制：
- 每日任务：需要等到第二天才能再次打卡
- 每周任务：需要等到下周才能测试
- 每月任务：需要等到下个月
- 连续打卡：需要连续多天才能看到效果

## 🎯 解决方案

### 方案1：历史时间测试任务 (推荐)

使用 `testing_time_solutions.sql` 创建预设历史记录的任务：

```sql
-- 执行此脚本创建5个特殊测试任务
-- 这些任务有预设的历史完成记录，可以立即测试
```

**包含的测试任务：**
- ✅ **每日测试任务**: 有3天历史记录，今天可以继续打卡
- ✅ **每周测试任务**: 有2周记录，本周可以打卡
- ✅ **即将完成任务**: 只差1次就完成，测试完成逻辑
- ✅ **连续中断任务**: 测试连续次数重置
- ✅ **Forever任务**: 测试无限重复和重复打卡防护

### 方案2：开发测试工具组件

使用 `DevTestingTools.tsx` 组件提供的功能：

#### 🕐 时间模拟功能
- **+1天**: 为所有重复任务添加1天的模拟记录
- **+3天**: 添加3天记录，测试连续打卡
- **+1周**: 添加1周记录，测试周任务
- **+1月**: 添加1月记录，测试月任务

#### 🎯 快速测试任务
- **每日任务**: 创建有昨天记录的每日任务
- **每周任务**: 创建有上周记录的每周任务
- **即将完成**: 创建只差1次完成的任务
- **Forever任务**: 创建有历史记录的无限任务

### 方案3：手动数据库操作

直接修改数据库记录来模拟时间：

```sql
-- 为特定任务添加历史完成记录
UPDATE tasks 
SET completion_record = '["2025-01-01", "2025-01-02", "2025-01-03"]',
    completed_count = 3,
    current_streak = 3,
    longest_streak = 3
WHERE id = 'your-task-id';
```

## 🧪 测试场景覆盖

### 基础打卡测试
1. **首次打卡**: 使用新创建的测试任务
2. **连续打卡**: 使用有历史记录的任务
3. **重复打卡防护**: 今天已打卡的任务再次打卡
4. **跨期打卡**: 每周/每月任务的跨期测试

### 高级功能测试
1. **连续次数计算**: 
   - 连续记录 → current_streak 增加
   - 中断记录 → current_streak 重置
   - 历史最高 → longest_streak 更新

2. **任务完成逻辑**:
   - current_streak 达到 required_count
   - 状态自动变为 completed
   - Forever任务永不完成

3. **时间窗口限制**:
   - 在时间窗口内打卡成功
   - 在时间窗口外打卡失败

4. **工作日限制**:
   - 工作日任务在周末无法打卡
   - 周末任务在工作日无法打卡

## 🚀 推荐测试流程

### 第一步：准备测试数据
```sql
-- 1. 运行基础测试数据
-- 执行 quick_test_data.sql

-- 2. 运行时间测试数据
-- 执行 testing_time_solutions.sql
```

### 第二步：集成开发工具
```tsx
// 在你的应用中添加开发工具组件
import DevTestingTools from './components/DevTestingTools';

// 在设置页面或开发页面中使用
<DevTestingTools />
```

### 第三步：执行测试用例

#### 测试1：基础打卡
1. 找到"测试每日打卡"任务
2. 点击打卡 → 应该成功
3. 再次点击打卡 → 应该提示"今日已打卡"

#### 测试2：连续打卡
1. 使用时间模拟工具 "+1天"
2. 再次打卡 → current_streak 应该增加
3. 重复几次测试连续效果

#### 测试3：任务完成
1. 找到"即将完成任务"
2. 打卡一次 → 任务应该自动完成
3. 状态变为 "completed"

#### 测试4：Forever任务
1. 找到"Forever测试任务"
2. 多次打卡（使用时间模拟）
3. 任务永远不会完成

#### 测试5：连续中断
1. 找到"连续中断测试"任务
2. 查看 current_streak 和 longest_streak
3. 使用时间模拟测试中断恢复

## 🔧 开发工具使用说明

### 添加到应用
```tsx
// 在 TaskBoard.tsx 或 Settings.tsx 中添加
{process.env.NODE_ENV === 'development' && (
  <DevTestingTools />
)}
```

### 时间模拟原理
```typescript
// 为任务添加历史完成记录
const simulateTimeProgress = (days: number) => {
  // 1. 获取所有重复任务
  // 2. 为每个任务添加过去N天的记录
  // 3. 重新计算 completed_count 和 current_streak
  // 4. 更新任务状态
};
```

### 快速任务创建
```typescript
// 创建有初始记录的测试任务
const createQuickTestTask = (type) => {
  // 1. 设置任务基本信息
  // 2. 添加昨天的完成记录
  // 3. 设置正确的统计数据
  // 4. 今天可以立即测试打卡
};
```

## 📊 验证测试结果

### 检查数据一致性
```sql
-- 验证 completed_count 与记录数匹配
SELECT 
    title,
    completed_count,
    jsonb_array_length(completion_record) as record_count,
    current_streak,
    longest_streak
FROM tasks 
WHERE title LIKE '%测试%'
ORDER BY title;
```

### 检查连续次数计算
```sql
-- 验证连续次数逻辑
SELECT 
    title,
    completion_record,
    current_streak,
    CASE 
        WHEN required_count IS NULL THEN 'Forever任务'
        WHEN current_streak >= required_count THEN '应该已完成'
        ELSE '进行中'
    END as expected_status,
    status as actual_status
FROM tasks 
WHERE title LIKE '%测试%';
```

## 🎉 测试完成后

### 清理测试数据
```sql
-- 删除所有测试任务
DELETE FROM tasks WHERE title LIKE '%测试%' OR title LIKE '%快速%';
```

或使用开发工具的"清理测试任务"按钮。

## 💡 额外提示

1. **生产环境**: 不要在生产环境使用这些测试工具
2. **数据备份**: 测试前备份重要数据
3. **时间同步**: 确保服务器时间正确
4. **测试隔离**: 使用专门的测试账户
5. **定期清理**: 定期清理测试数据避免混乱

现在你可以轻松测试所有重复任务功能，不再受现实时间限制！🚀
