-- LovePlanner Database Initialization Script for Supabase
-- 运行此脚本来创建完整的数据库结构

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表 (users) - 扩展Supabase的auth.users
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
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

-- 2. 情侣关系表
CREATE TABLE public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cat_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    cow_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    relationship_started DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(cat_user_id, cow_user_id),
    CHECK (cat_user_id != cow_user_id)
);

-- 3. 任务表
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    points INTEGER NOT NULL CHECK (points BETWEEN 10 AND 200),
    status VARCHAR(20) CHECK (status IN ('recruiting', 'assigned', 'in-progress', 'pending_review', 'completed', 'abandoned')) DEFAULT 'recruiting',
    
    -- 任务参与者
    creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    
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

-- 4. 任务历史表
CREATE TABLE public.task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 日历事件表
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- 参与者
    participants UUID[] NOT NULL,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    
    -- 事件配置
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    is_all_day BOOLEAN DEFAULT false,
    
    -- 重复设置
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    recurrence_end DATE,
    original_date DATE,
    parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- 元数据
    created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 积分交易表
CREATE TABLE public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    related_purchase_id UUID,
    
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 商店物品表
CREATE TABLE public.shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('time', 'service', 'gifts', 'experience')) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    image_url TEXT,
    
    owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 购买记录表
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    
    price_paid INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX idx_couples_cat_user ON public.couples(cat_user_id);
CREATE INDEX idx_couples_cow_user ON public.couples(cow_user_id);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_creator ON public.tasks(creator_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_couple ON public.tasks(couple_id);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);

CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_couple ON public.events(couple_id);
CREATE INDEX idx_events_participants ON public.events USING GIN(participants);

CREATE INDEX idx_point_transactions_user ON public.point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON public.point_transactions(transaction_type);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at 
    BEFORE UPDATE ON public.shop_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 创建行级安全策略 (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的档案
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 用户只能查看自己的情侣关系
CREATE POLICY "Users can view own couples" ON public.couples
    FOR SELECT USING (auth.uid() = cat_user_id OR auth.uid() = cow_user_id);

-- 任务访问策略
CREATE POLICY "Users can view couple tasks" ON public.tasks
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE cat_user_id = auth.uid() OR cow_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        creator_id = auth.uid() AND
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE cat_user_id = auth.uid() OR cow_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update assigned tasks" ON public.tasks
    FOR UPDATE USING (
        assignee_id = auth.uid() OR creator_id = auth.uid()
    );

-- 事件访问策略
CREATE POLICY "Users can view couple events" ON public.events
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE cat_user_id = auth.uid() OR cow_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE cat_user_id = auth.uid() OR cow_user_id = auth.uid()
        )
    );

-- 创建用户档案触发器（当用户注册时自动创建档案）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, username, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'cat')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 注册时自动创建用户档案
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建视图
CREATE VIEW public.user_task_stats AS
SELECT 
    up.id as user_id,
    up.display_name,
    up.role,
    up.points,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'abandoned' THEN 1 END) as abandoned_tasks,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points END), 0) as total_points_earned
FROM public.user_profiles up
LEFT JOIN public.tasks t ON (up.id = t.assignee_id)
GROUP BY up.id, up.display_name, up.role, up.points;

-- 插入示例数据（可选）
-- 注意：在实际使用中，用户数据会通过Supabase Auth自动创建
