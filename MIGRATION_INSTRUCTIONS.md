# 🔧 数据库迁移指令

## 📋 需要执行的 SQL

请在 **Supabase Dashboard > SQL Editor** 中执行以下 SQL：

```sql
-- 添加 modified_instances 字段
ALTER TABLE events ADD COLUMN modified_instances JSONB DEFAULT '{}';

-- 添加注释说明字段用途
COMMENT ON COLUMN events.modified_instances IS '重复事件的修改实例，键为日期(YYYY-MM-DD)，值为修改的字段';

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'modified_instances';
```

## 🎯 字段说明

### `modified_instances` (JSONB)
- **用途**: 存储重复事件的单个实例修改
- **格式**: `{ "2025-09-12": { "title": "特殊会议", "start_time": "10:00" } }`
- **键**: 日期字符串 (YYYY-MM-DD)
- **值**: 修改的字段对象

## 📊 执行后验证

执行SQL后，应该看到类似输出：
```
column_name        | data_type | is_nullable | column_default
modified_instances | jsonb     | YES         | '{}'::jsonb
```

## 🚀 完成后
迁移完成后，重复事件的编辑功能将支持：
- ✅ **仅此事件**: 单个实例修改 (使用 modified_instances)
- ✅ **此事件及未来事件**: 智能策略 (少量修改用 modified_instances，大量修改用分割)
- ✅ **系列中的所有事件**: 直接更新原记录
