-- LovePlanner 用户数据迁移脚本
-- 将 Cat 和 Cow 用户作为真实用户创建到数据库中

-- 1. 创建 Cat 用户档案
INSERT INTO public.user_profiles (
    id, 
    email, 
    username, 
    display_name, 
    role, 
    points, 
    timezone, 
    is_active
) VALUES (
    'cat-user-id-fixed',
    'cat@loveplanner.com',
    'whimsical_cat',
    'Whimsical Cat',
    'cat',
    150,
    'Asia/Shanghai',
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    points = EXCLUDED.points,
    timezone = EXCLUDED.timezone,
    updated_at = NOW();

-- 2. 创建 Cow 用户档案
INSERT INTO public.user_profiles (
    id, 
    email, 
    username, 
    display_name, 
    role, 
    points, 
    timezone, 
    is_active
) VALUES (
    'cow-user-id-fixed',
    'cow@loveplanner.com',
    'whimsical_cow',
    'Whimsical Cow',
    'cow',
    180,
    'America/New_York',
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    points = EXCLUDED.points,
    timezone = EXCLUDED.timezone,
    updated_at = NOW();

-- 3. 创建情侣关系
INSERT INTO public.couples (
    id,
    cat_user_id,
    cow_user_id,
    relationship_started,
    is_active
) VALUES (
    'loveplanner-couple-1',
    'cat-user-id-fixed',
    'cow-user-id-fixed',
    '2024-02-14',
    true
) ON CONFLICT (id) DO UPDATE SET
    cat_user_id = EXCLUDED.cat_user_id,
    cow_user_id = EXCLUDED.cow_user_id,
    relationship_started = EXCLUDED.relationship_started,
    is_active = EXCLUDED.is_active;

-- 4. 创建一些示例任务数据
INSERT INTO public.tasks (
    id,
    title,
    description,
    deadline,
    points,
    status,
    creator_id,
    couple_id,
    task_type,
    repeat_type,
    requires_proof,
    created_at
) VALUES 
(
    'task-valentine-surprise',
    '情人节惊喜',
    '为另一半准备一个特别的情人节惊喜',
    '2024-02-14 18:00:00+00',
    100,
    'recruiting',
    'cat-user-id-fixed',
    'loveplanner-couple-1',
    'special',
    'once',
    true,
    '2024-01-20 10:00:00+00'
),
(
    'task-stargazing',
    '一起看星星',
    '找一个安静的地方，一起数星星聊天',
    '2024-03-08 20:00:00+00',
    80,
    'assigned',
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    'daily',
    'once',
    false,
    '2024-02-15 14:00:00+00'
),
(
    'task-morning-coffee',
    '每日咖啡时光',
    '每天早上一起享受咖啡时光',
    '2024-12-31 09:00:00+00',
    50,
    'in-progress',
    'cat-user-id-fixed',
    'loveplanner-couple-1',
    'habit',
    'repeat',
    false,
    '2024-01-01 08:00:00+00'
),
(
    'task-weekly-date',
    '周末约会',
    '每周末安排一次特别的约会',
    '2024-12-31 19:00:00+00',
    120,
    'completed',
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    'special',
    'repeat',
    true,
    '2024-01-15 16:00:00+00'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    deadline = EXCLUDED.deadline,
    points = EXCLUDED.points,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 设置任务的接受者
UPDATE public.tasks SET assignee_id = 'cow-user-id-fixed' WHERE id = 'task-stargazing';
UPDATE public.tasks SET assignee_id = 'cat-user-id-fixed' WHERE id = 'task-morning-coffee';
UPDATE public.tasks SET assignee_id = 'cow-user-id-fixed' WHERE id = 'task-weekly-date';

-- 5. 创建一些示例事件数据
INSERT INTO public.events (
    id,
    title,
    description,
    event_date,
    start_time,
    end_time,
    participants,
    couple_id,
    color,
    is_all_day,
    is_recurring,
    created_by
) VALUES 
(
    'event-anniversary',
    '恋爱纪念日',
    '我们在一起的特殊日子',
    '2024-02-14',
    '18:00',
    '22:00',
    ARRAY['cat-user-id-fixed', 'cow-user-id-fixed'],
    'loveplanner-couple-1',
    'bg-purple-500',
    false,
    true,
    'cat-user-id-fixed'
),
(
    'event-movie-night',
    '电影之夜',
    '一起看一部浪漫电影',
    '2024-03-01',
    '20:00',
    '23:00',
    ARRAY['cat-user-id-fixed', 'cow-user-id-fixed'],
    'loveplanner-couple-1',
    'bg-pink-500',
    false,
    false,
    'cow-user-id-fixed'
),
(
    'event-workout',
    '晨跑时光',
    'Cat的个人晨跑时间',
    '2024-03-02',
    '07:00',
    '08:00',
    ARRAY['cat-user-id-fixed'],
    'loveplanner-couple-1',
    'bg-green-500',
    false,
    true,
    'cat-user-id-fixed'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    event_date = EXCLUDED.event_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    updated_at = NOW();

-- 6. 创建积分交易记录
INSERT INTO public.point_transactions (
    id,
    user_id,
    couple_id,
    amount,
    transaction_type,
    description,
    related_task_id,
    balance_before,
    balance_after
) VALUES 
(
    'pt-cat-init',
    'cat-user-id-fixed',
    'loveplanner-couple-1',
    150,
    'initial_bonus',
    '初始积分奖励',
    NULL,
    0,
    150
),
(
    'pt-cow-init',
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    180,
    'initial_bonus',
    '初始积分奖励',
    NULL,
    0,
    180
),
(
    'pt-weekly-date-reward',
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    120,
    'task_reward',
    '完成任务：周末约会',
    'task-weekly-date',
    180,
    300
) ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    description = EXCLUDED.description,
    balance_after = EXCLUDED.balance_after;

-- 7. 创建一些商店物品示例
INSERT INTO public.shop_items (
    id,
    name,
    description,
    category,
    price,
    owner_id,
    couple_id,
    is_active
) VALUES 
(
    'shop-cat-massage',
    '30分钟按摩服务',
    'Cat提供的专业放松按摩',
    'service',
    80,
    'cat-user-id-fixed',
    'loveplanner-couple-1',
    true
),
(
    'shop-cow-breakfast',
    '爱心早餐',
    'Cow亲手制作的丰盛早餐',
    'service',
    60,
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    true
),
(
    'shop-cat-movie-night',
    '电影院包场',
    '私人电影院体验',
    'experience',
    200,
    'cat-user-id-fixed',
    'loveplanner-couple-1',
    true
),
(
    'shop-cow-surprise-gift',
    '神秘礼物',
    '精心挑选的惊喜礼物',
    'gifts',
    150,
    'cow-user-id-fixed',
    'loveplanner-couple-1',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 更新用户积分（确保与交易记录一致）
UPDATE public.user_profiles SET points = 150 WHERE id = 'cat-user-id-fixed';
UPDATE public.user_profiles SET points = 300 WHERE id = 'cow-user-id-fixed';

-- 完成提示
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM public.user_profiles WHERE id IN ('cat-user-id-fixed', 'cow-user-id-fixed')) as users_created,
    (SELECT COUNT(*) FROM public.couples WHERE id = 'loveplanner-couple-1') as couples_created,
    (SELECT COUNT(*) FROM public.tasks WHERE couple_id = 'loveplanner-couple-1') as tasks_created,
    (SELECT COUNT(*) FROM public.events WHERE couple_id = 'loveplanner-couple-1') as events_created,
    (SELECT COUNT(*) FROM public.shop_items WHERE couple_id = 'loveplanner-couple-1') as shop_items_created;
