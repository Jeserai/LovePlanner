-- 最简化的颜色管理系统
-- 只为couples表添加颜色字段，无需预设表格

-- 为couples表添加颜色字段
ALTER TABLE couples 
ADD COLUMN user1_color VARCHAR(7) DEFAULT '#06b6d4',  -- 用户1固定颜色：蓝色
ADD COLUMN user2_color VARCHAR(7) DEFAULT '#8b5cf6',  -- 用户2固定颜色：紫色
ADD COLUMN shared_color VARCHAR(7) DEFAULT '#10b981'; -- 共同事件颜色：绿色

-- 为现有的情侣关系分配默认颜色
UPDATE couples SET 
    user1_color = '#06b6d4',
    user2_color = '#8b5cf6',
    shared_color = '#10b981'
WHERE user1_color IS NULL;

-- 创建简单的视图方便查询（可选）
CREATE OR REPLACE VIEW couple_colors_view AS
SELECT 
    c.id as couple_id,
    c.user1_id,
    c.user2_id,
    c.user1_color,
    c.user2_color,
    c.shared_color,
    u1.display_name as user1_name,
    u2.display_name as user2_name
FROM couples c
LEFT JOIN user_profiles u1 ON c.user1_id = u1.id
LEFT JOIN user_profiles u2 ON c.user2_id = u2.id
WHERE c.is_active = true;

-- 创建函数：获取用户在情侣关系中的颜色
CREATE OR REPLACE FUNCTION get_user_color_in_couple(p_user_id UUID, p_couple_id UUID)
RETURNS VARCHAR(7) AS $$
DECLARE
    result_color VARCHAR(7);
BEGIN
    SELECT 
        CASE 
            WHEN user1_id = p_user_id THEN user1_color
            WHEN user2_id = p_user_id THEN user2_color
            ELSE '#6b7280' -- 默认灰色，表示不在此情侣关系中
        END INTO result_color
    FROM couples 
    WHERE id = p_couple_id AND is_active = true;
    
    RETURN COALESCE(result_color, '#6b7280');
END;
$$ LANGUAGE plpgsql;
