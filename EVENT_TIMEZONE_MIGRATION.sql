-- 事件时区支持迁移脚本
-- 添加时区相关字段到 events 表

-- 1. 添加创建者时区字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_timezone VARCHAR(50);

-- 2. 添加时区感知标志
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone_aware BOOLEAN DEFAULT false;

-- 3. 添加注释说明字段用途
COMMENT ON COLUMN events.created_timezone IS '事件创建者的时区，如 Asia/Shanghai, America/New_York';
COMMENT ON COLUMN events.timezone_aware IS '是否为跨时区事件，true表示需要时区转换';

-- 4. 为现有数据设置默认值
-- 假设现有的共同事件（includes_user1=true AND includes_user2=true）需要时区处理
UPDATE events 
SET timezone_aware = true,
    created_timezone = 'UTC'
WHERE includes_user1 = true AND includes_user2 = true AND timezone_aware IS NULL;

-- 假设现有的个人事件不需要时区处理
UPDATE events 
SET timezone_aware = false,
    created_timezone = 'Asia/Shanghai'  -- 假设大部分现有事件是北京时间
WHERE (includes_user1 = false OR includes_user2 = false) AND timezone_aware IS NULL;

-- 5. 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_events_timezone_aware ON events(timezone_aware);
CREATE INDEX IF NOT EXISTS idx_events_created_timezone ON events(created_timezone);
