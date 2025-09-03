-- 移除event_date字段的迁移脚本
-- 这将解决早上时间拖拽偏移到前一天的问题

-- 1. 首先删除依赖event_date的索引
DROP INDEX IF EXISTS idx_events_v2_date;
DROP INDEX IF EXISTS idx_events_v2_all_day_events;

-- 2. 删除event_date字段
ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;

-- 3. 重新创建基于start_datetime的索引（用于查询性能）
CREATE INDEX IF NOT EXISTS idx_events_start_datetime 
  ON public.events USING btree (couple_id, start_datetime) 
  WHERE start_datetime IS NOT NULL;

-- 4. 为全天事件创建专门的索引（基于created_at作为日期参考）
CREATE INDEX IF NOT EXISTS idx_events_all_day 
  ON public.events USING btree (couple_id, created_at) 
  WHERE is_all_day = true;

-- 5. 添加注释说明新的查询策略
COMMENT ON TABLE public.events IS '事件表 - 使用start_datetime作为主要时间字段，不再使用event_date避免时区混淆';
