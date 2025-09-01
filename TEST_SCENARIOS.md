# 🧪 测试场景完整指南

## 🚀 快速开始

### 1. 运行测试数据脚本
```sql
-- 在 Supabase SQL Editor 中运行
-- 选择 quick_test_data.sql 的内容并执行
```

### 2. 验证数据生成
```sql
-- 检查生成的任务
SELECT COUNT(*) as total_tasks FROM tasks;

-- 查看任务分布
SELECT task_type, status, COUNT(*) as count 
FROM tasks 
GROUP BY task_type, status 
ORDER BY task_type, status;
```

## 🎯 测试场景详解

### 📋 基础功能测试

#### 1. 任务创建与显示
- ✅ **日常任务**: 洗碗、健身、阅读等
- ✅ **习惯任务**: 大扫除、理财规划、约会等  
- ✅ **特殊任务**: 生日惊喜、学习技能、装饰新家等
- ✅ **Forever任务**: 说我爱你、约会夜等

#### 2. 任务状态管理
- 🔵 **recruiting**: 洗碗、双周约会等
- 🟡 **assigned**: 健身、大扫除、生日惊喜等
- 🟢 **in_progress**: 阅读、理财规划、说我爱你等
- ✅ **completed**: 喝水、装饰新家等
- ❌ **abandoned**: 冥想任务
- 🔍 **pending_review**: 整理书房

### 🔄 重复频率测试

#### 每日任务 (daily)
- **洗碗**: 招募中，有时间窗口 18:00-22:00
- **健身**: 已领取，有开始时间和截止时间
- **阅读**: 进行中，有打卡记录
- **喝水**: 已完成，连续7天记录

#### 每周任务 (weekly)  
- **大扫除**: 每周一，已有2周记录
- **约会夜**: 每周五晚上，Forever任务

#### 每月任务 (monthly)
- **理财规划**: 已完成1个月，进行中

#### 双周任务 (biweekly)
- **约会**: 招募中，需要6次完成

#### 年度任务 (yearly)
- 可以添加年度旅行等任务

### ⏰ 时间相关测试

#### 开始时间限制
- **健身**: 2025-01-01 06:00 开始
- **生日惊喜**: 2025-01-10 开始
- **30天挑战**: 2025-01-01 05:30 开始

#### 截止时间测试
- **洗碗**: 2025-01-15 截止
- **健身**: 2025-01-31 截止  
- **新年准备**: 2025-01-10 截止 (即将过期)

#### 每日时间窗口
- **洗碗**: 18:00-22:00
- **健身**: 06:00-08:00
- **工作日早餐**: 06:30-08:30
- **约会夜**: 19:00-23:00
- **睡前聊天**: 21:30-23:00

#### 工作日/周末限制
- **工作日早餐**: 周一到周五 [1,2,3,4,5]
- **大扫除**: 仅周一 [1]
- **约会夜**: 仅周五 [5]

### 📊 打卡记录测试

#### 无记录任务 (新任务)
- 洗碗、健身、双周约会等

#### 有记录任务 (进行中)
- **阅读**: 5次打卡，当前连续3次
- **说我爱你**: 15次打卡，当前连续5次，历史最高10次
- **30天挑战**: 18次打卡，当前连续8次，历史最高12次

#### 已完成任务
- **喝水**: 连续7天完成
- **装饰新家**: 一次性任务完成

#### 中断记录
- **冥想**: 有3次记录但已放弃，连续次数重置为0

### 🎯 连续次数 (Streak) 测试

#### Current Streak 测试
- **0**: 新任务或已中断
- **3**: 阅读任务
- **5**: 说我爱你  
- **7**: 喝水任务 (已完成)
- **8**: 30天挑战

#### Longest Streak 测试
- **5**: 阅读任务 (current = 3, longest = 5)
- **10**: 说我爱你 (current = 5, longest = 10)
- **12**: 30天挑战 (current = 8, longest = 12)

#### Required Count 测试
- **7**: 洗碗、喝水 (已完成)
- **21**: 健身任务
- **30**: 30天挑战
- **NULL**: Forever任务 (说我爱你、约会夜)

### 🔐 证明要求测试

#### 需要证明 (requires_proof = true)
- 健身、大扫除、生日惊喜、装饰新家、整理书房、工作日早餐、30天挑战

#### 无需证明 (requires_proof = false)  
- 洗碗、阅读、喝水、理财规划、说我爱你、约会夜、冥想、新年准备、睡前聊天

### 🎮 高级测试场景

#### 1. 自动状态转换测试
- **assigned → in_progress**: 当开始时间到达时
- **in_progress → completed**: 当达到required_count时

#### 2. 时间窗口验证
- 在时间窗口外尝试打卡应该失败
- 工作日限制应该正确生效

#### 3. 重复打卡防护
- 同一周期内重复打卡应该被阻止
- 每日任务：同一天
- 每周任务：同一周
- 每月任务：同一月

#### 4. 数据一致性检查
- `completed_count` 应该等于 `completion_record` 数组长度
- `current_streak` 应该基于最近的连续记录计算

#### 5. Forever任务测试
- 永远不会自动完成
- `required_count = NULL`
- 可以无限打卡

## 🧪 推荐测试流程

### 第一阶段：基础功能
1. 查看任务列表 (各种状态和类型)
2. 领取招募中的任务
3. 对进行中的任务进行打卡
4. 查看任务详情和进度

### 第二阶段：时间相关
1. 测试时间窗口限制
2. 测试工作日限制  
3. 查看即将过期的任务
4. 测试自动状态转换

### 第三阶段：高级功能
1. 测试连续打卡和中断
2. 测试Forever任务
3. 测试证明上传
4. 测试任务完成和放弃

### 第四阶段：边界情况
1. 重复打卡防护
2. 过期任务处理
3. 数据一致性验证
4. 错误处理测试

## 📊 验证查询

```sql
-- 查看所有任务状态
SELECT title, status, task_type, repeat_frequency FROM tasks ORDER BY status;

-- 查看打卡记录
SELECT title, completed_count, current_streak, longest_streak, completion_record 
FROM tasks WHERE completion_record IS NOT NULL;

-- 查看时间配置
SELECT title, earliest_start_time, task_deadline, daily_time_start, daily_time_end 
FROM tasks WHERE earliest_start_time IS NOT NULL OR task_deadline IS NOT NULL;

-- 数据一致性检查
SELECT title, completed_count, 
       CASE WHEN completion_record IS NULL THEN 0 
            ELSE jsonb_array_length(completion_record) END as record_count
FROM tasks 
WHERE completed_count != CASE WHEN completion_record IS NULL THEN 0 
                              ELSE jsonb_array_length(completion_record) END;
```

现在你有了完整的测试数据和测试场景！🎉
