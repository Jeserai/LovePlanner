-- 修复events表结构
-- 首先检查events表的当前结构并修复

-- 1. 删除现有的不完整的events表（如果存在）
DROP TABLE IF EXISTS public.events CASCADE;

-- 2. 重新创建完整的events表
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    participants TEXT[] NOT NULL DEFAULT '{}',
    couple_id UUID NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    is_all_day BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    recurrence_end DATE,
    original_date DATE,
    parent_event_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建外键约束（如果couples表存在）
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_couple 
FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT fk_events_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT fk_events_parent_event 
FOREIGN KEY (parent_event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 4. 创建索引
CREATE INDEX idx_events_couple_id ON public.events(couple_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_created_by ON public.events(created_by);

-- 5. 启用RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略
CREATE POLICY "Users can view events in their couple" ON public.events
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
            AND is_active = true
        )
    );

CREATE POLICY "Users can create events for their couple" ON public.events
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update events in their couple" ON public.events
    FOR UPDATE USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
            AND is_active = true
        )
    );

CREATE POLICY "Users can delete events in their couple" ON public.events
    FOR DELETE USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
            AND is_active = true
        )
    );

-- 7. 插入一些示例数据（可选）
-- 注意：需要先有有效的couple_id和user_id
/*
INSERT INTO public.events (
    title,
    description,
    event_date,
    start_time,
    participants,
    couple_id,
    color,
    created_by
) VALUES 
(
    '测试事件',
    '这是一个测试事件',
    '2024-12-25',
    '18:00:00',
    ARRAY['cat', 'cow'],
    '你的_couple_id_在这里',
    '#10b981',
    '你的_user_id_在这里'
);
*/
