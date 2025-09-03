-- 删除依赖视图和event_date字段的完整脚本

-- 1. 删除依赖的视图
DROP VIEW IF EXISTS events_v2_with_user_timezone CASCADE;

-- 2. 删除依赖event_date的索引
DROP INDEX IF EXISTS idx_events_v2_date;
DROP INDEX IF EXISTS idx_events_v2_all_day_events;

-- 3. 删除event_date字段
ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;

-- 4. 重新创建基于start_datetime的索引
CREATE INDEX IF NOT EXISTS idx_events_start_datetime 
  ON public.events USING btree (couple_id, start_datetime) 
  WHERE start_datetime IS NOT NULL;

-- 5. 为全天事件创建索引
CREATE INDEX IF NOT EXISTS idx_events_all_day 
  ON public.events USING btree (couple_id, created_at) 
  WHERE is_all_day = true;

-- 完成提示
SELECT 'event_date字段删除成功！' as message;
