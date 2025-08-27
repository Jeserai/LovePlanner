import { supabase, Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Couple = Database['public']['Tables']['couples']['Row']

// 用户相关操作
export const userService = {
  // 获取用户档案
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  },

  // 更新用户档案
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }

    return true
  },

  // 获取情侣关系
  async getCoupleRelation(userId: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      } else {
        console.error('查询情侣关系失败:', error);
        return null;
      }
    }

    return data
  },

  // 获取情侣关系详细信息（包含伴侣信息）
  async getCoupleRelationDetails(userId: string) {
    const { data, error } = await supabase.rpc('get_couple_relation', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching couple relation details:', error)
      return null
    }

    return data?.[0] || null
  },

  // 创建情侣关系
  async createCoupleRelation(user1Id: string, user2Id: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('create_couple_relationship', {
      user1_id: user1Id,
      user2_id: user2Id
    });

    if (error) {
      console.error('Error creating couple relation:', error)
      return null
    }

    return data
  },

  // 获取情侣中的所有用户
  async getCoupleUsers(coupleId: string) {
    try {
      console.log('🔍 查询couples表，coupleId:', coupleId);
      
      // 首先获取couple关系
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('user1_id, user2_id')
        .eq('id', coupleId)
        .eq('is_active', true)
        .single();

      if (coupleError) {
        console.error('获取情侣数据失败:', coupleError);
        return [];
      }

      if (!coupleData) {
        console.log('⚠️ 没有找到couples数据');
        return [];
      }

      console.log('📋 Couples数据:', {
        user1_id: coupleData.user1_id,
        user2_id: coupleData.user2_id
      });

      // 然后分别查询两个用户的信息，保持couples表中的顺序
      const users = [];
      let user1 = null;
      let user2 = null;
      
      // 查询 user1 (couples表中的user1_id)
      if (coupleData.user1_id) {
        console.log('🔍 查询user1，ID:', coupleData.user1_id);
        const { data: user1Data, error: user1Error } = await supabase
          .from('user_profiles')
          .select('id, email, display_name, birthday')
          .eq('id', coupleData.user1_id)
          .single();
          
        if (user1Error) {
          console.error('❌ 获取用户1失败:', user1Error);
        } else if (user1Data) {
          console.log('✅ 找到user1:', user1Data.display_name);
          user1 = user1Data;
        }
      }

      // 查询 user2 (couples表中的user2_id)
      if (coupleData.user2_id) {
        console.log('🔍 查询user2，ID:', coupleData.user2_id);
        const { data: user2Data, error: user2Error } = await supabase
          .from('user_profiles')
          .select('id, email, display_name, birthday')
          .eq('id', coupleData.user2_id)
          .single();
          
        if (user2Error) {
          console.error('❌ 获取用户2失败:', user2Error);
        } else if (user2Data) {
          console.log('✅ 找到user2:', user2Data.display_name);
          user2 = user2Data;
        }
      }

      // 按照couples表的顺序返回：[user1, user2]
      if (user1) users.push(user1);
      if (user2) users.push(user2);

      console.log(`📊 最终返回 ${users.length} 个用户:`, users.map(u => u.display_name));
      return users;
    } catch (error) {
      console.error('getCoupleUsers错误:', error);
      return [];
    }
  }
}

// 任务相关操作
export const taskService = {
  // 获取情侣的所有任务
  async getCoupleTasksOld(coupleId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    return data || []
  },

  // 创建新任务
  async createTask(task: Database['public']['Tables']['tasks']['Insert']): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    return data
  },

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: Task['status'], assigneeId?: string): Promise<boolean> {
    const updates: any = { status }
    if (assigneeId) {
      updates.assignee_id = assigneeId
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task status:', error)
      return false
    }

    return true
  },

  // 提交任务
  async submitTask(taskId: string, proofUrl?: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        proof_url: proofUrl
      })
      .eq('id', taskId)

    if (error) {
      console.error('Error submitting task:', error)
      return false
    }

    return true
  },

  // 完成任务（审核通过）
  async completeTask(taskId: string, reviewComment?: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        review_comment: reviewComment
      })
      .eq('id', taskId)

    if (error) {
      console.error('Error completing task:', error)
      return false
    }

    return true
  },

  // 通用任务更新方法
  async updateTask(taskId: string, updates: any): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
      return false
    }

    return true
  }
}

// 导入简化的事件服务
export { simplifiedEventService } from './simplifiedEventService';

// 积分相关操作
export const pointService = {
  // 添加积分交易记录
  async addTransaction(
    userId: string,
    coupleId: string,
    amount: number,
    type: string,
    description: string,
    relatedTaskId?: string
  ): Promise<boolean> {
    // 首先获取当前积分
    const { data: user } = await supabase
      .from('user_profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (!user) return false

    const balanceBefore = user.points
    const balanceAfter = balanceBefore + amount

    // 创建交易记录
    const { error: transactionError } = await supabase
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
      return false
    }

    // 更新用户积分（触发器会自动处理，但为了保险起见手动更新）
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ points: balanceAfter })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user points:', updateError)
      return false
    }

    return true
  },

  // 获取用户积分历史
  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }

    return data || []
  }
}
