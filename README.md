# 💕 LovePlanner - 情侣任务规划应用

一个专为情侣设计的现代化任务管理和积分奖励系统，支持共享日历、任务协作和个性化主题。

## 📖 项目概述

LovePlanner 是一个基于 Next.js 的 Web 应用，旨在帮助情侣们更好地管理共同任务、记录重要事件，并通过积分系统增加互动乐趣。应用支持多主题、多语言，提供直观的用户界面和丰富的功能。

## ✨ 核心功能

### 🎯 任务管理系统
- **智能积分计算**：基于任务难度、时间压力和完成质量的动态积分系统
- **多种任务类型**：一次性任务、有限重复任务、永久习惯任务
- **任务状态跟踪**：从发布到完成的全生命周期管理
- **协作机制**：任务分配、完成验证、评价反馈

### 📅 日历功能
- **多视图支持**：月视图、周视图、列表视图
- **事件分类**：个人事件、伴侣事件、共同活动
- **实时同步**：基于 Supabase 的实时数据同步
- **拖拽操作**：直观的事件创建和编辑

### 🎨 界面与体验
- **现代化设计**：基于 Tailwind CSS 的响应式界面
- **暗黑模式**：支持明暗主题切换
- **国际化**：中英文双语支持
- **自适应布局**：顶部导航和侧边栏两种布局模式

### 🏆 积分与奖励
- **动态积分计算**：考虑任务难度、时间压力、完成质量
- **成就系统**：连续完成奖励、里程碑奖励
- **积分商店**：使用积分兑换奖励（预留功能）

## 🛠 技术栈

### 前端框架
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Framer Motion** - 动画库

### UI 组件
- **Radix UI** - 无障碍组件基础
- **Lucide React** - 现代图标库
- **Heroicons** - Hero 图标集
- **shadcn/ui** - 高质量组件库

### 后端服务
- **Supabase** - 开源 Firebase 替代方案
- **PostgreSQL** - 关系型数据库
- **Row Level Security (RLS)** - 数据安全策略

### 功能库
- **FullCalendar** - 日历组件
- **date-fns** - 日期处理
- **react-beautiful-dnd** - 拖拽功能
- **Sonner** - 通知系统

## 📱 页面功能详解

### 1. 认证页面 (`AuthForm.tsx`)
**功能**：
- 用户登录/注册
- 预设用户快速登录
- 语言切换
- 密码显示/隐藏切换

**逻辑**：
- 支持邮箱密码登录
- 提供测试用户快速登录
- 自动创建用户资料
- 语言偏好保存到 localStorage

### 2. 日历页面 (`Calendar.tsx`)
**功能**：
- 多视图日历展示（月、周、列表）
- 事件创建、编辑、删除
- 事件分类筛选（全部、我的、伴侣、共同）
- 拖拽创建事件
- 事件详情查看

**核心逻辑**：
```typescript
// 事件权限控制
const canEditEvent = (event) => {
  return event.creator_id === currentUserId || 
         event.is_shared === true;
};

// 事件分类筛选
const filterEvents = (events, filter) => {
  switch(filter) {
    case 'my': return events.filter(e => e.creator_id === currentUserId);
    case 'partner': return events.filter(e => e.creator_id !== currentUserId);
    case 'shared': return events.filter(e => e.is_shared === true);
    default: return events;
  }
};
```

### 3. 任务管理页面 (`TaskBoard.tsx`)
**功能**：
- 任务看板视图（我发布的、我领取的、可领取的）
- 任务创建、编辑、删除
- 任务状态管理
- 积分计算和显示
- 任务完成验证

**状态流转**：
```
recruiting → assigned → in_progress → pending_review → completed
     ↓              ↓           ↓            ↓
  abandoned      abandoned   abandoned    abandoned
```

**核心逻辑**：
```typescript
// 任务状态更新
const updateTaskStatus = async (taskId, newStatus) => {
  const updates = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
  };
  
  if (newStatus === 'completed') {
    await awardPoints(task, userId);
  }
};

// 重复任务完成检查
const checkRepeatTaskCompletion = (task) => {
  const today = getTodayString();
  const completionRecord = parseCompletionRecord(task.completion_record);
  
  return !completionRecord.includes(today);
};
```

### 4. 设置页面 (`Settings.tsx`)
**功能**：
- 用户资料管理
- 主题切换（现代/像素）
- 布局模式切换（侧边栏/顶部导航）
- 暗黑模式切换
- 语言切换

### 5. 商店页面 (`Shop.tsx`)
**功能**：
- 积分余额显示
- 奖励商品展示
- 兑换功能（预留）

## 🧮 积分计算系统

### 积分计算公式
```typescript
最终积分 = 基础积分 × 时间系数 × 凭证奖励系数

基础积分：
- 简单任务：15分（一次性）/ 8分（重复）
- 普通任务：30分（一次性）/ 18分（重复）  
- 困难任务：60分（一次性）/ 35分（重复）

时间系数：
- 紧急任务（<6小时）：×1.3
- 当日任务（<24小时）：×1.1
- 短期任务（1-3天）：×1.0
- 中期任务（3-7天）：×0.9
- 长期任务（7-30天）：×0.8
- 超长期任务（>30天）：×0.7

凭证奖励：×1.15
```

### 时间计算逻辑
```typescript
const calculateDurationHours = (startTime, deadline, createdAt) => {
  // 情况1: 有开始和结束时间
  if (startTime && deadline) {
    return (deadline - startTime) / (1000 * 60 * 60);
  }
  
  // 情况2: 只有开始时间 → 无时间压力
  if (startTime && !deadline) {
    return Infinity;
  }
  
  // 情况3: 只有截止时间 → 从创建时间算起
  if (!startTime && deadline) {
    return (deadline - createdAt) / (1000 * 60 * 60);
  }
  
  // 情况4: 无时间限制
  return Infinity;
};
```

### 积分验证系统
```typescript
const validatePoints = (inputPoints, suggestedPoints) => {
  const variance = 0.5; // 允许50%浮动
  const minAllowed = suggestedPoints * (1 - variance);
  const maxAllowed = suggestedPoints * (1 + variance);
  
  if (inputPoints < minAllowed) {
    return { isValid: false, warning: "积分过低" };
  }
  
  if (inputPoints > maxAllowed) {
    return { isValid: false, warning: "积分过高" };
  }
  
  return { isValid: true };
};
```

## 📊 任务管理逻辑

### 任务类型分类
```typescript
type TaskType = 'easy' | 'normal' | 'hard' | 'daily' | 'habit' | 'special';
type RepeatFrequency = 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever';

// 任务分类逻辑
const getTaskCategory = (task) => {
  if (task.repeat_frequency === 'never') {
    return 'once'; // 一次性任务
  } else if (task.required_count) {
    return 'limited_repeat'; // 有限重复任务
  } else {
    return 'forever_repeat'; // 永久重复任务
  }
};
```

### 任务完成记录
```typescript
// 完成记录格式：["2024-01-01", "2024-01-02", ...]
const updateCompletionRecord = (task, completionDate) => {
  const record = parseCompletionRecord(task.completion_record);
  
  if (!record.includes(completionDate)) {
    record.push(completionDate);
    
    // 更新连续完成统计
    const newStreak = calculateStreak(record);
    
    return {
      completion_record: JSON.stringify(record),
      completed_count: record.length,
      current_streak: newStreak,
      longest_streak: Math.max(task.longest_streak, newStreak)
    };
  }
  
  return null;
};

// 连续完成天数计算
const calculateStreak = (completionDates) => {
  if (completionDates.length === 0) return 0;
  
  const sorted = completionDates.sort().reverse();
  let streak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i-1]);
    const previous = new Date(sorted[i]);
    const diffDays = (current - previous) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
```

### 任务状态管理
```typescript
// 任务状态自动更新逻辑
const updateTaskStatus = async (coupleId) => {
  const tasks = await getTasks({ couple_id: coupleId });
  
  for (const task of tasks) {
    let newStatus = task.status;
    
    // 检查是否超时
    if (task.task_deadline && new Date(task.task_deadline) < new Date()) {
      if (['recruiting', 'assigned', 'in_progress'].includes(task.status)) {
        newStatus = 'abandoned';
      }
    }
    
    // 检查重复任务是否完成
    if (task.repeat_frequency !== 'never' && task.required_count) {
      if (task.completed_count >= task.required_count) {
        newStatus = 'completed';
      }
    }
    
    if (newStatus !== task.status) {
      await updateTask(task.id, { status: newStatus });
    }
  }
};
```

## 🎨 主题系统

### 主题配置
```typescript
type ThemeType = 'pixel' | 'modern';

const themeConfigs = {
  modern: {
    colors: 'text-foreground bg-background',
    components: 'shadcn/ui',
    icons: 'lucide-react'
  },
  pixel: {
    colors: 'text-pixel-text bg-pixel-bg',
    components: 'custom pixel components',
    icons: 'pixel-art-icons'
  }
};
```

### 布局模式
```typescript
// 侧边栏布局
const SidebarLayout = () => (
  <div className="flex h-screen">
    <Sidebar collapsed={sidebarCollapsed} />
    <div className="flex-1 flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  </div>
);

// 顶部导航布局
const TopNavLayout = () => (
  <div className="flex flex-col h-screen">
    <TopNavigation />
    <main className="flex-1">{children}</main>
  </div>
);
```

## 🌍 国际化系统

### 翻译配置
```typescript
const translations = {
  zh: {
    task_board: '任务面板',
    create_task: '创建任务',
    // ... 更多中文翻译
  },
  en: {
    task_board: 'Task Board',
    create_task: 'Create Task',
    // ... 更多英文翻译
  }
};

// 使用翻译
const { t } = useTranslation(language);
const title = t('task_board'); // 根据当前语言返回对应翻译
```

### 动态内容翻译
```typescript
// 支持变量插值
const getTaskDurationLabel = (hours, language) => {
  if (hours === Infinity) {
    return language === 'zh' ? '不限时' : 'No time limit';
  }
  
  if (hours < 24) {
    return language === 'zh' 
      ? `${hours.toFixed(1)}小时内完成`
      : `Complete within ${hours.toFixed(1)} hours`;
  }
  
  const days = Math.ceil(hours / 24);
  return language === 'zh'
    ? `${days}天内完成`
    : `Complete within ${days} days`;
};
```

## 🗄 数据库设计

### 核心表结构

#### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  username VARCHAR,
  display_name VARCHAR,
  points INTEGER DEFAULT 0,
  couple_id UUID,
  created_at TIMESTAMP
);
```

#### 任务表 (tasks)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  creator_id UUID REFERENCES users(id),
  couple_id UUID NOT NULL,
  
  -- 任务分类
  task_type task_type_enum NOT NULL,
  repeat_frequency repeat_frequency_enum DEFAULT 'never',
  
  -- 时间配置
  earliest_start_time TIMESTAMP,
  required_count INTEGER,
  task_deadline TIMESTAMP,
  
  -- 重复配置
  repeat_weekdays INTEGER[],
  daily_time_start TIME,
  daily_time_end TIME,
  
  -- 状态跟踪
  status task_status_enum DEFAULT 'recruiting',
  assignee_id UUID REFERENCES users(id),
  
  -- 完成统计
  completed_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  completion_record JSONB,
  
  -- 其他字段
  requires_proof BOOLEAN DEFAULT false,
  proof_url TEXT,
  review_comment TEXT,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### 事件表 (events)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR,
  creator_id UUID REFERENCES users(id),
  couple_id UUID NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  recurrence_type recurrence_enum DEFAULT 'never',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 权限控制 (RLS)
```sql
-- 任务表 RLS 策略
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 只能查看同一情侣的任务
CREATE POLICY "Users can view couple tasks" ON tasks
  FOR SELECT USING (
    couple_id = (SELECT couple_id FROM users WHERE id = auth.uid())
  );

-- 只能创建自己的任务
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    couple_id = (SELECT couple_id FROM users WHERE id = auth.uid())
  );
```

## 🚀 安装和使用

### 环境要求
- Node.js 18.0+
- npm 或 yarn
- Supabase 账户

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/your-username/LovePlanner.git
cd LovePlanner
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **数据库设置**
在 Supabase 控制台中运行数据库迁移脚本

5. **启动开发服务器**
```bash
npm run dev
```

6. **构建生产版本**
```bash
npm run build
npm start
```

### 部署选项

#### Vercel 部署
```bash
npm install -g vercel
vercel --prod
```

#### 静态导出
```bash
npm run export
```

## 🏗 系统架构

### 目录结构
```
src/
├── components/          # React 组件
│   ├── ui/             # 基础 UI 组件
│   ├── calendar/       # 日历相关组件
│   └── ...
├── contexts/           # React Context
├── hooks/             # 自定义 Hooks
├── services/          # 业务逻辑服务
├── types/             # TypeScript 类型定义
├── utils/             # 工具函数
├── styles/            # 样式文件
└── config/            # 配置文件
```

### 数据流
```
用户操作 → 组件事件 → 服务层 → Supabase API → 数据库
                ↓
实时更新 ← Subscription ← Supabase 实时引擎
```

### 状态管理
- **全局状态**：React Context（主题、用户、语言）
- **组件状态**：useState/useReducer
- **服务器状态**：Supabase 实时订阅
- **本地存储**：localStorage（偏好设置）

## 🧪 开发指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式编程
- 优先使用 hooks

### 组件开发
```typescript
// 组件模板
interface ComponentProps {
  // 定义 props 类型
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // 使用 hooks
  const { theme } = useTheme();
  const t = useTranslation();
  
  // 事件处理
  const handleClick = () => {
    // 处理逻辑
  };
  
  // 渲染
  return (
    <div className="component-class">
      {/* JSX 内容 */}
    </div>
  );
};

export default Component;
```

### 服务层开发
```typescript
// 服务模板
export class ExampleService {
  static async getData(params: ParamsType): Promise<DataType> {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .match(params);
      
    if (error) throw error;
    return data;
  }
}
```

### 测试策略
- 单元测试：组件和工具函数
- 集成测试：服务层和数据库交互
- E2E 测试：关键用户流程

## 🔧 调试工具

### 开发环境调试
- **时间控制器**：`TestTimeController` - 模拟不同时间
- **时区控制器**：`TestTimezoneController` - 测试时区处理
- **日志系统**：详细的控制台输出

### 性能监控
- Next.js 内置分析
- Bundle 大小分析
- 渲染性能监控

## 📋 待办事项

### 短期目标
- [ ] 积分商店功能完善
- [ ] 任务模板系统
- [ ] 通知推送功能
- [ ] 移动端适配优化

### 长期目标
- [ ] 社交功能（好友、排行榜）
- [ ] 数据统计和报表
- [ ] 第三方日历同步
- [ ] 小程序版本



## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。


---


