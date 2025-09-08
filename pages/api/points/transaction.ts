import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// 创建服务器端的 Supabase 客户端，使用服务角色密钥
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      userId,
      coupleId,
      amount,
      type,
      description,
      relatedTaskId
    } = req.body

    // 验证必要参数
    if (!userId || !coupleId || amount === undefined || !type || !description) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // 首先获取当前积分
    const { data: user, error: userError } = await adminSupabase
      .from('user_profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return res.status(404).json({ error: 'User not found' })
    }

    const balanceBefore = user.points
    const balanceAfter = balanceBefore + amount

    // 创建交易记录
    const { error: transactionError } = await adminSupabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        couple_id: coupleId,
        amount,
        transaction_type: type,
        description,
        related_task_id: relatedTaskId,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return res.status(500).json({ error: 'Failed to create transaction', details: transactionError })
    }

    // 更新用户积分
    const { error: updateError } = await adminSupabase
      .from('user_profiles')
      .update({ points: balanceAfter })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user points:', updateError)
      return res.status(500).json({ error: 'Failed to update user points', details: updateError })
    }

    res.status(200).json({ 
      success: true, 
      balanceBefore, 
      balanceAfter,
      message: 'Transaction created successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error })
  }
}
