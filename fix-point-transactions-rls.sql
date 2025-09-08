-- 修复 point_transactions 表的 RLS 策略
-- 这个脚本需要在 Supabase SQL 编辑器中执行

-- 方案1: 创建 RPC 函数来绕过 RLS 限制（推荐）
CREATE OR REPLACE FUNCTION create_point_transaction(
    p_user_id TEXT,
    p_couple_id TEXT,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_description TEXT,
    p_related_task_id TEXT DEFAULT NULL,
    p_balance_before INTEGER DEFAULT 0,
    p_balance_after INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO point_transactions (
        user_id,
        couple_id,
        amount,
        transaction_type,
        description,
        related_task_id,
        balance_before,
        balance_after,
        created_at
    ) VALUES (
        p_user_id,
        p_couple_id,
        p_amount,
        p_transaction_type,
        p_description,
        p_related_task_id,
        p_balance_before,
        p_balance_after,
        NOW()
    );
END;
$$;

-- 方案2: 如果您希望使用传统的 RLS 策略，请取消注释以下代码
/*
-- 首先检查当前的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'point_transactions';

-- 删除可能存在的限制性策略
DROP POLICY IF EXISTS "Users can only view own transactions" ON point_transactions;
DROP POLICY IF EXISTS "Users can only insert own transactions" ON point_transactions;

-- 创建更宽松的 RLS 策略
CREATE POLICY "Allow authenticated users to insert transactions" ON point_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own transactions" ON point_transactions
    FOR SELECT USING (auth.uid()::text = user_id);

-- 确保 RLS 已启用
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
*/

-- 检查表结构，确保所有必要的字段都存在
\d point_transactions;
