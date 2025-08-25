# LovePlanner 数据库设计

## 概述
这是一个为情侣规划应用设计的PostgreSQL数据库schema，支持任务管理、日历事件、积分系统和商店功能。

## 核心表结构

### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(10) CHECK (role IN ('cat', 'cow')) NOT NULL,
    points INTEGER DEFAULT 0,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

### 2. 情侣关系表 (couples)
```sql
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cat_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cow_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship_started DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(cat_user_id, cow_user_id),
    CHECK (cat_user_id != cow_user_id)
);

-- 索引
CREATE INDEX idx_couples_cat_user ON couples(cat_user_id);
CREATE INDEX idx_couples_cow_user ON couples(cow_user_id);
```

### 3. 任务表 (tasks)
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    points INTEGER NOT NULL CHECK (points BETWEEN 10 AND 200),
    status VARCHAR(20) CHECK (status IN ('recruiting', 'assigned', 'in-progress', 'pending_review', 'completed', 'abandoned')) DEFAULT 'recruiting',
    
    -- 任务参与者
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- 任务配置
    task_type VARCHAR(20) CHECK (task_type IN ('daily', 'habit', 'special')) NOT NULL,
    repeat_type VARCHAR(10) CHECK (repeat_type IN ('once', 'repeat')) DEFAULT 'once',
    requires_proof BOOLEAN DEFAULT false,
    
    -- 重复任务设置
    repeat_frequency VARCHAR(20) CHECK (repeat_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    duration VARCHAR(20) CHECK (duration IN ('21days', '1month', '6months', '1year')),
    repeat_weekdays INTEGER[] DEFAULT '{}',
    repeat_time TIME,
    
    -- 时间设置
    has_specific_time BOOLEAN DEFAULT false,
    task_start_time TIME,
    task_end_time TIME,
    
    -- 提交和审核
    proof_url TEXT,
    proof_type VARCHAR(50),
    submitted_at TIMESTAMP WITH TIME ZONE,
    review_comment TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_couple ON tasks(couple_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

### 4. 任务历史表 (task_history)
```sql
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'accepted', 'started', 'submitted', 'completed', 'abandoned', 'reviewed'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_user ON task_history(user_id);
CREATE INDEX idx_task_history_action ON task_history(action);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
```

### 5. 日历事件表 (events)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- 参与者 (多对多关系通过数组简化)
    participants UUID[] NOT NULL, -- 用户ID数组
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- 事件配置
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    is_all_day BOOLEAN DEFAULT false,
    
    -- 重复设置
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    recurrence_end DATE,
    original_date DATE, -- 原始日期，用于重复事件
    parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- 重复事件的父事件
    
    -- 元数据
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_couple ON events(couple_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_participants ON events USING GIN(participants);
CREATE INDEX idx_events_recurring ON events(is_recurring, recurrence_type);
```

### 6. 积分交易表 (point_transactions)
```sql
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- 交易信息
    amount INTEGER NOT NULL, -- 正数为获得，负数为消费
    transaction_type VARCHAR(50) NOT NULL, -- 'task_reward', 'task_penalty', 'shop_purchase', 'admin_adjustment'
    description TEXT NOT NULL,
    
    -- 关联数据
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    related_purchase_id UUID, -- 关联商店购买（如果需要的话）
    
    -- 余额快照
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_couple ON point_transactions(couple_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
```

### 7. 商店物品表 (shop_items)
```sql
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('time', 'service', 'gifts', 'experience')) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    image_url TEXT,
    
    -- 所有者和可见性
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_shop_items_owner ON shop_items(owner_id);
CREATE INDEX idx_shop_items_couple ON shop_items(couple_id);
CREATE INDEX idx_shop_items_category ON shop_items(category);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);
```

### 8. 购买记录表 (purchases)
```sql
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- 购买信息
    price_paid INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    
    -- 元数据
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_item ON purchases(item_id);
CREATE INDEX idx_purchases_couple ON purchases(couple_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
```

## 触发器和函数

### 1. 更新时间戳触发器
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到相关表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 积分更新触发器
```sql
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新用户积分
    UPDATE users 
    SET points = NEW.balance_after 
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_points_on_transaction 
    AFTER INSERT ON point_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_user_points();
```

### 3. 任务状态变更记录触发器
```sql
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果状态发生变化，记录到历史表
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_history (task_id, user_id, action, old_status, new_status)
        VALUES (NEW.id, NEW.assignee_id, 'status_changed', OLD.status, NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_task_changes 
    AFTER UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION log_task_status_change();
```

## 视图

### 1. 用户任务统计视图
```sql
CREATE VIEW user_task_stats AS
SELECT 
    u.id as user_id,
    u.display_name,
    u.role,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'abandoned' THEN 1 END) as abandoned_tasks,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points END), 0) as total_points_earned
FROM users u
LEFT JOIN tasks t ON (u.id = t.assignee_id)
GROUP BY u.id, u.display_name, u.role;
```

### 2. 情侣任务概览视图
```sql
CREATE VIEW couple_task_overview AS
SELECT 
    c.id as couple_id,
    cat_user.display_name as cat_name,
    cow_user.display_name as cow_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'recruiting' THEN 1 END) as available_tasks,
    COUNT(CASE WHEN t.status IN ('assigned', 'in-progress') THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
FROM couples c
JOIN users cat_user ON c.cat_user_id = cat_user.id
JOIN users cow_user ON c.cow_user_id = cow_user.id
LEFT JOIN tasks t ON c.id = t.couple_id
WHERE c.is_active = true
GROUP BY c.id, cat_user.display_name, cow_user.display_name;
```

## 数据类型说明

### 用户角色 (role)
- `cat`: 猫咪角色 🐱
- `cow`: 奶牛角色 🐄

### 任务状态 (status)
- `recruiting`: 发布中，等待接受
- `assigned`: 已接受，等待开始
- `in-progress`: 进行中
- `pending_review`: 等待审核
- `completed`: 已完成
- `abandoned`: 已放弃

### 任务类型 (task_type)
- `daily`: 日常任务
- `habit`: 习惯任务
- `special`: 特殊任务

### 商店分类 (category)
- `time`: 时间类
- `service`: 服务类
- `gifts`: 礼物类
- `experience`: 体验类

## 安全考虑

1. **行级安全 (RLS)**: 确保用户只能访问自己情侣关系内的数据
2. **数据验证**: 使用CHECK约束确保数据完整性
3. **外键约束**: 保证引用完整性
4. **索引优化**: 提高查询性能
5. **审计跟踪**: 通过history表记录重要操作

这个schema设计支持你应用的所有核心功能，包括多用户、任务管理、积分系统、日历事件和商店功能。
