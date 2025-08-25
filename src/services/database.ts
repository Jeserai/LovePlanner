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
      .or(`cat_user_id.eq.${userId},cow_user_id.eq.${userId}`)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching couple relation:', error)
      return null
    }

    return data
  },

  // 创建情侣关系
  async createCoupleRelation(catUserId: string, cowUserId: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .from('couples')
      .insert({
        cat_user_id: catUserId,
        cow_user_id: cowUserId,
        relationship_started: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating couple relation:', error)
      return null
    }

    return data
  }
}

// 任务相关操作
export const taskService = {
  // 获取情侣的所有任务
  async getCoupleTasksOld(coupleId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        creator:creator_id(display_name, role),
        assignee:assignee_id(display_name, role)
      `)
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
  }
}

// 事件相关操作
export const eventService = {
  // 获取情侣的所有事件
  async getCoupleEvents(coupleId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    return data || []
  },

  // 创建新事件
  async createEvent(event: Database['public']['Tables']['events']['Insert']): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return null
    }

    return data
  },

  // 更新事件
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)

    if (error) {
      console.error('Error updating event:', error)
      return false
    }

    return true
  },

  // 删除事件
  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return false
    }

    return true
  }
}

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
