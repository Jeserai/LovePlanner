-- 重新设计的Event表结构
-- 支持跨天事件、完整时区信息、复杂重复规则

-- 删除旧表（仅在开发环境，生产环境需要数据迁移）
-- DROP TABLE IF EXISTS events;

-- 新的events表结构
CREATE TABLE events_new (
  -- 基础信息
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  description text NULL,
  location character varying(255) NULL,
  
  -- 🎯 核心时间信息（支持跨天）
  start_datetime timestamptz NOT NULL,           -- 开始时间（含时区，UTC存储）
  end_datetime timestamptz NOT NULL,             -- 结束时间（含时区，UTC存储）
  
  -- 📅 派生字段（用于查询优化）
  event_date date NOT NULL,                      -- 开始日期（从start_datetime派生）
  duration_minutes integer NOT NULL DEFAULT 0,   -- 持续时间（分钟）
  is_multi_day boolean NOT NULL DEFAULT false,   -- 是否跨天/跨日事件
  is_all_day boolean NOT NULL DEFAULT false,     -- 是否全天事件
  
  -- 🔄 重复事件信息
  is_recurring boolean NOT NULL DEFAULT false,                    -- 是否重复
  recurrence_rule jsonb NULL,                                     -- 重复规则（RFC 5545 RRULE格式）
  recurrence_end_date date NULL,                                  -- 重复结束日期
  original_event_id uuid NULL,                                    -- 原始事件ID（用于重复事件实例）
  instance_date date NULL,                                        -- 实例日期（重复事件的具体某次）
  
  -- 👥 参与者信息
  created_by uuid NOT NULL,
  includes_user1 boolean NOT NULL DEFAULT false,
  includes_user2 boolean NOT NULL DEFAULT false,
  
  -- 🕒 元数据
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 🚫 重复事件的例外处理
  excluded_dates date[] NULL DEFAULT '{}',                        -- 排除的日期
  modified_instances jsonb NULL DEFAULT '{}',                     -- 修改的实例
  
  -- 约束
  CONSTRAINT events_new_pkey PRIMARY KEY (id),
  CONSTRAINT events_new_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES couples (id) ON DELETE CASCADE,
  CONSTRAINT events_new_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profiles (id),
  CONSTRAINT events_new_original_event_fkey FOREIGN KEY (original_event_id) REFERENCES events_new (id) ON DELETE CASCADE,
  
  -- 时间逻辑约束
  CONSTRAINT valid_time_range CHECK (end_datetime > start_datetime),
  CONSTRAINT valid_duration CHECK (duration_minutes >= 0),
  CONSTRAINT valid_all_day_duration CHECK (
    NOT is_all_day OR duration_minutes >= 1440  -- 全天事件至少24小时
  ),
  
  -- 参与者约束
  CONSTRAINT at_least_one_participant CHECK (includes_user1 = true OR includes_user2 = true),
  
  -- 重复事件约束
  CONSTRAINT valid_recurrence CHECK (
    NOT is_recurring OR (recurrence_rule IS NOT NULL)
  ),
  CONSTRAINT valid_instance CHECK (
    (original_event_id IS NULL AND instance_date IS NULL) OR
    (original_event_id IS NOT NULL AND instance_date IS NOT NULL)
  )
);

-- 🔍 索引优化
CREATE INDEX idx_events_new_couple_id ON events_new(couple_id);
CREATE INDEX idx_events_new_event_date ON events_new(event_date);
CREATE INDEX idx_events_new_created_by ON events_new(created_by);
CREATE INDEX idx_events_new_start_datetime ON events_new(start_datetime);
CREATE INDEX idx_events_new_end_datetime ON events_new(end_datetime);
CREATE INDEX idx_events_new_original_event ON events_new(original_event_id);
CREATE INDEX idx_events_new_user1_participation ON events_new(includes_user1) WHERE includes_user1 = true;
CREATE INDEX idx_events_new_user2_participation ON events_new(includes_user2) WHERE includes_user2 = true;

-- 复合索引用于常见查询
CREATE INDEX idx_events_new_couple_date_range ON events_new(couple_id, event_date);
CREATE INDEX idx_events_new_datetime_range ON events_new(start_datetime, end_datetime);

-- 🛠️ 触发器：自动更新派生字段
CREATE OR REPLACE FUNCTION update_event_derived_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新派生字段
    NEW.event_date := NEW.start_datetime::date;
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_datetime - NEW.start_datetime)) / 60;
    NEW.is_multi_day := NEW.start_datetime::date != NEW.end_datetime::date;
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    -- 验证全天事件的时间
    IF NEW.is_all_day THEN
        -- 全天事件应该是整天（00:00:00 到 23:59:59 或第二天00:00:00）
        IF EXTRACT(HOUR FROM NEW.start_datetime) != 0 OR 
           EXTRACT(MINUTE FROM NEW.start_datetime) != 0 OR 
           EXTRACT(SECOND FROM NEW.start_datetime) != 0 THEN
            RAISE EXCEPTION '全天事件的开始时间必须是 00:00:00';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_derived_fields
    BEFORE INSERT OR UPDATE ON events_new
    FOR EACH ROW
    EXECUTE FUNCTION update_event_derived_fields();

-- 📝 表和字段注释
COMMENT ON TABLE events_new IS '事件表：支持跨天事件、完整时区信息、复杂重复规则。所有时间字段均为UTC存储。';
COMMENT ON COLUMN events_new.start_datetime IS '开始时间：UTC时间戳，支持跨天事件';
COMMENT ON COLUMN events_new.end_datetime IS '结束时间：UTC时间戳，支持跨天事件';
COMMENT ON COLUMN events_new.event_date IS '事件日期：从start_datetime派生，用于日历查询优化';
COMMENT ON COLUMN events_new.duration_minutes IS '持续时间（分钟）：自动计算';
COMMENT ON COLUMN events_new.is_multi_day IS '是否跨天：自动判断start_datetime和end_datetime是否在不同日期';
COMMENT ON COLUMN events_new.recurrence_rule IS '重复规则：RFC 5545 RRULE格式的JSON，例如 {"freq":"weekly","byday":["MO","WE"]}';
COMMENT ON COLUMN events_new.original_event_id IS '原始事件ID：重复事件实例指向的原始事件';
COMMENT ON COLUMN events_new.instance_date IS '实例日期：重复事件的具体发生日期';
