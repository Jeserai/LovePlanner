-- 修复版本：先删除依赖的视图，再删除event_date字段

-- 1. 删除依赖的视图
DROP VIEW IF EXISTS events_v2_with_user_timezone CASCADE;

-- 2. 删除依赖event_date的索引
DROP INDEX IF EXISTS idx_events_v2_date;
DROP INDEX IF EXISTS idx_events_v2_all_day_events;

-- 3. 现在可以安全删除event_date字段
ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;

-- 4. 重新创建基于start_datetime的索引（用于查询性能）
CREATE INDEX IF NOT EXISTS idx_events_start_datetime 
  ON public.events USING btree (couple_id, start_datetime) 
  WHERE start_datetime IS NOT NULL;

-- 5. 为全天事件创建专门的索引（基于created_at作为日期参考）
CREATE INDEX IF NOT EXISTS idx_events_all_day 
  ON public.events USING btree (couple_id, created_at) 
  WHERE is_all_day = true;

-- 6. 添加注释说明新的查询策略
COMMENT ON TABLE public.events IS '事件表 - 使用start_datetime作为主要时间字段，移除了event_date避免时区混淆';

-- 7. 显示完成信息
SELECT 'event_date字段和相关依赖已成功删除！' as status;
