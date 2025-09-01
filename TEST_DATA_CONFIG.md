# 🎯 测试数据配置指南

## 📋 使用前准备

### 1. 获取你的实际ID
在 Supabase Dashboard 中运行以下查询获取真实的用户ID：

```sql
-- 查看现有用户
SELECT id, username, display_name FROM user_profiles;

-- 查看情侣关系
SELECT * FROM couples;
```

### 2. 修改测试数据脚本
在 `generate_test_data.sql` 文件中，将以下占位符替换为实际值：

```sql
-- 替换这些值：
'test-couple-id'  → 你的真实 couple_id
'cat-user-id'     → cat 用户的真实 user_id  
'cow-user-id'     → cow 用户的真实 user_id
```

### 3. 快速替换方法
使用文本编辑器的"查找替换"功能：
- 查找：`test-couple-id` → 替换为：你的couple_id
- 查找：`cat-user-id` → 替换为：cat的user_id
- 查找：`cow-user-id` → 替换为：cow的user_id

## 🎮 测试数据包含的场景

### 📊 任务类型分布
- **日常任务 (daily)**: 8个
- **习惯任务 (habit)**: 7个  
- **特殊任务 (special)**: 5个

### 🔄 重复频率覆盖
- **never** (一次性): 5个
- **daily** (每日): 9个
- **weekly** (每周): 3个
- **biweekly** (双周): 1个
- **monthly** (每月): 1个
- **yearly** (每年): 1个

### 📈 任务状态分布
- **recruiting** (招募中): 4个
- **assigned** (已领取): 6个
- **in_progress** (进行中): 6个
- **completed** (已完成): 2个
- **abandoned** (已放弃): 1个
- **pending_review** (待审核): 1个

### 🎯 特殊测试场景

#### 时间相关
- ✅ 有开始时间限制的任务
- ✅ 有截止时间的任务
- ✅ 有每日时间窗口的任务
- ✅ 工作日/周末限制的任务

#### 完成记录
- ✅ 无记录的新任务
- ✅ 有连续打卡记录的任务
- ✅ 有中断记录的任务
- ✅ 已完成目标的任务

#### 连续次数测试
- ✅ current_streak = 0 (新任务)
- ✅ current_streak > 0 (进行中)
- ✅ current_streak = required_count (刚完成)
- ✅ longest_streak > current_streak (历史最高)

#### Forever任务
- ✅ 每日forever任务 (无限重复)
- ✅ 每周forever任务 (无限重复)
- ✅ required_count = NULL

#### 证明要求
- ✅ requires_proof = true (需要上传证明)
- ✅ requires_proof = false (无需证明)

## 🧪 测试用例建议

### 基础功能测试
1. **创建任务** - 各种类型和配置
2. **领取任务** - recruiting → assigned
3. **开始任务** - assigned → in_progress (基于时间)
4. **完成任务** - 打卡功能
5. **放弃任务** - 各种状态下的放弃

### 高级功能测试
1. **连续打卡** - 测试streak计算
2. **时间窗口** - 测试时间限制
3. **重复频率** - 测试各种重复模式
4. **数据一致性** - completed_count vs completion_record
5. **状态转换** - 自动状态更新

### 边界情况测试
1. **即将过期的任务**
2. **已过期的任务**
3. **连续中断后重新开始**
4. **达到required_count的任务**
5. **Forever任务的长期使用**

## 🚀 执行步骤

1. **修改配置**：替换用户ID和couple_id
2. **执行脚本**：在Supabase SQL Editor中运行
3. **验证数据**：检查生成的任务数量和分布
4. **开始测试**：使用应用测试各种功能

## 📊 验证查询

```sql
-- 验证数据生成结果
SELECT 
    task_type,
    repeat_frequency,
    status,
    COUNT(*) as count
FROM tasks 
GROUP BY task_type, repeat_frequency, status
ORDER BY task_type, repeat_frequency, status;

-- 检查时间配置
SELECT 
    title,
    earliest_start_time,
    task_deadline,
    daily_time_start,
    daily_time_end,
    repeat_weekdays
FROM tasks 
WHERE earliest_start_time IS NOT NULL 
   OR task_deadline IS NOT NULL 
   OR daily_time_start IS NOT NULL;

-- 检查完成记录
SELECT 
    title,
    completed_count,
    current_streak,
    longest_streak,
    completion_record
FROM tasks 
WHERE completion_record IS NOT NULL;
```
