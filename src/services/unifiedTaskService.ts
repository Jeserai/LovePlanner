// 🔄 统一任务服务 - 支持传统重复任务和习惯挑战任务
import { supabase } from '../lib/supabase';

// ==========================================
// 类型定义
// ==========================================

export interface UnifiedTask {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  points: number;
  creator_id: string;
  couple_id: string;
  
  // 任务分类
  task_type: 'daily' | 'habit' | 'special';
  repeat_type: 'once' | 'repeat';
  challenge_mode: boolean;  // 🔑 关键字段：是否为挑战模式
  
  // 重复配置
  repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  repeat_weekdays?: number[];
  repeat_time?: string;
  
  // 挑战模式配置
  max_participants?: number;
  allow_flexible_start?: boolean;
  consecutive_required?: boolean;
  min_completion_rate?: number;
  allow_restart?: boolean;
  
  // 挑战统计
  total_participants?: number;
  active_participants?: number;
  completed_participants?: number;
  
  // 时间约束
  task_start_time?: string;
  task_end_time?: string;
  deadline?: string;
  
  // 状态和执行
  status: 'recruiting' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'abandoned';
  assignee_id?: string;
  requires_proof: boolean;
  proof_url?: string;
  submitted_at?: string;
  completed_at?: string;
  review_comment?: string;
  
  // 系统字段
  created_at: string;
  updated_at: string;
}

export interface TaskParticipation {
  id: string;
  task_id: string;
  user_id: string;
  participation_type: 'assigned' | 'joined';
  
  // 个人时间线
  personal_start_date?: string;
  personal_end_date?: string;
  personal_duration_days?: number;
  
  // 进度跟踪
  total_required: number;
  completed_count: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  
  // 状态
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  joined_at: string;
  completed_at?: string;
  abandoned_at?: string;
  
  // 重启记录
  restart_count: number;
  last_restart_date?: string;
}

export interface TaskCompletion {
  id: string;
  participation_id: string;
  completion_date: string;
  completed_at: string;
  notes?: string;
  proof_url?: string;
  mood_rating?: number;
  streak_day: number;
  is_makeup: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  points?: number;
  task_type: 'daily' | 'habit' | 'special';
  repeat_type: 'once' | 'repeat';
  challenge_mode?: boolean;
  
  // 重复配置
  repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  repeat_weekdays?: number[];
  repeat_time?: string;
  
  // 挑战配置
  max_participants?: number;
  allow_flexible_start?: boolean;
  consecutive_required?: boolean;
  min_completion_rate?: number;
  allow_restart?: boolean;
  
  // 时间约束
  task_start_time?: string;
  task_end_time?: string;
  deadline?: string;
  
  // 其他
  requires_proof?: boolean;
  assignee_id?: string;  // 传统模式直接分配
}

export interface JoinChallengeRequest {
  task_id: string;
  user_id: string;
  start_date?: string;  // 如果允许灵活开始时间
}

export interface SubmitCompletionRequest {
  participation_id: string;
  completion_date?: string;
  notes?: string;
  proof_url?: string;
  mood_rating?: number;
}

// ==========================================
// 统一任务服务类
// ==========================================

export class UnifiedTaskService {
  
  // ==========================================
  // 任务创建和管理
  // ==========================================
  
  /**
   * 创建任务（支持所有模式）
   */
  async createTask(taskData: CreateTaskRequest, creatorId: string, coupleId: string): Promise<UnifiedTask> {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        points: taskData.points || 0,
        creator_id: creatorId,
        couple_id: coupleId,
        task_type: taskData.task_type,
        repeat_type: taskData.repeat_type,
        challenge_mode: taskData.challenge_mode || false,
        
        // 重复配置
        repeat_frequency: taskData.repeat_frequency,
        start_date: taskData.start_date,
        end_date: taskData.end_date,
        repeat_weekdays: taskData.repeat_weekdays,
        repeat_time: taskData.repeat_time,
        
        // 挑战配置
        max_participants: taskData.max_participants,
        allow_flexible_start: taskData.allow_flexible_start || false,
        consecutive_required: taskData.consecutive_required || false,
        min_completion_rate: taskData.min_completion_rate,
        allow_restart: taskData.allow_restart !== false,
        
        // 时间约束
        task_start_time: taskData.task_start_time,
        task_end_time: taskData.task_end_time,
        deadline: taskData.deadline,
        
        // 其他
        requires_proof: taskData.requires_proof || false,
        assignee_id: taskData.challenge_mode ? null : taskData.assignee_id,
        status: 'recruiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    // 如果是传统模式且指定了执行者，创建参与记录
    if (!taskData.challenge_mode && taskData.assignee_id) {
      await this.createParticipation(task.id, taskData.assignee_id, 'assigned');
    }

    return task;
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<UnifiedTask | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取情侣的所有任务
   */
  async getCoupleTasks(coupleId: string): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching couple tasks:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 获取用户相关的所有任务（分配的+参与的）
   */
  async getUserTasks(userId: string): Promise<(UnifiedTask & { participation?: TaskParticipation })[]> {
    const { data, error } = await supabase
      .from('user_task_list')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }

    return data || [];
  }

  // ==========================================
  // 参与管理
  // ==========================================

  /**
   * 创建参与记录（内部使用）
   */
  private async createParticipation(taskId: string, userId: string, type: 'assigned' | 'joined'): Promise<TaskParticipation> {
    const { data, error } = await supabase
      .from('task_participations')
      .insert({
        task_id: taskId,
        user_id: userId,
        participation_type: type
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating participation:', error);
      throw error;
    }

    return data;
  }

  /**
   * 加入挑战
   */
  async joinChallenge(request: JoinChallengeRequest): Promise<TaskParticipation> {
    // 使用数据库函数处理复杂的加入逻辑
    const { data, error } = await supabase.rpc('join_challenge', {
      task_id_param: request.task_id,
      user_id_param: request.user_id,
      start_date_param: request.start_date
    });

    if (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }

    // 获取创建的参与记录
    const { data: participation, error: fetchError } = await supabase
      .from('task_participations')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching participation:', fetchError);
      throw fetchError;
    }

    return participation;
  }

  /**
   * 分配任务（传统模式）
   */
  async assignTask(taskId: string, userId: string): Promise<boolean> {
    // 更新任务的assignee_id
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        assignee_id: userId,
        status: 'assigned'
      })
      .eq('id', taskId);

    if (taskError) {
      console.error('Error assigning task:', taskError);
      throw taskError;
    }

    // 创建参与记录
    await this.createParticipation(taskId, userId, 'assigned');

    return true;
  }

  /**
   * 获取用户的参与记录
   */
  async getUserParticipations(userId: string, status?: string): Promise<(TaskParticipation & { task: UnifiedTask })[]> {
    let query = supabase
      .from('task_participations')
      .select(`
        *,
        tasks (*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user participations:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      task: item.tasks
    })) || [];
  }

  // ==========================================
  // 完成记录管理
  // ==========================================

  /**
   * 提交任务完成
   */
  async submitCompletion(request: SubmitCompletionRequest): Promise<TaskCompletion> {
    // 使用数据库函数处理复杂的完成逻辑
    const { data, error } = await supabase.rpc('record_task_completion', {
      participation_id_param: request.participation_id,
      completion_date_param: request.completion_date,
      notes_param: request.notes,
      proof_url_param: request.proof_url,
      mood_rating_param: request.mood_rating
    });

    if (error) {
      console.error('Error submitting completion:', error);
      throw error;
    }

    // 获取创建的完成记录
    const { data: completion, error: fetchError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching completion:', fetchError);
      throw fetchError;
    }

    return completion;
  }

  /**
   * 获取参与记录的完成历史
   */
  async getCompletionHistory(participationId: string): Promise<TaskCompletion[]> {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('participation_id', participationId)
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('Error fetching completion history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 获取用户的完成统计
   */
  async getUserCompletionStats(userId: string): Promise<{
    totalParticipations: number;
    activeParticipations: number;
    completedParticipations: number;
    totalCompletions: number;
    currentStreaks: { task_title: string; streak: number }[];
  }> {
    // 获取参与统计
    const { data: participations, error: participationError } = await supabase
      .from('task_participations')
      .select(`
        *,
        tasks (title)
      `)
      .eq('user_id', userId);

    if (participationError) {
      console.error('Error fetching participation stats:', participationError);
      throw participationError;
    }

    // 获取完成记录统计
    const { data: completions, error: completionError } = await supabase
      .from('task_completions')
      .select('id')
      .in('participation_id', participations?.map(p => p.id) || []);

    if (completionError) {
      console.error('Error fetching completion stats:', completionError);
      throw completionError;
    }

    const totalParticipations = participations?.length || 0;
    const activeParticipations = participations?.filter(p => p.status === 'active').length || 0;
    const completedParticipations = participations?.filter(p => p.status === 'completed').length || 0;
    const totalCompletions = completions?.length || 0;
    const currentStreaks = participations
      ?.filter(p => p.current_streak > 0)
      .map(p => ({
        task_title: p.tasks.title,
        streak: p.current_streak
      })) || [];

    return {
      totalParticipations,
      activeParticipations,
      completedParticipations,
      totalCompletions,
      currentStreaks
    };
  }

  // ==========================================
  // 挑战管理
  // ==========================================

  /**
   * 放弃挑战
   */
  async abandonChallenge(participationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('task_participations')
      .update({
        status: 'abandoned',
        abandoned_at: new Date().toISOString()
      })
      .eq('id', participationId);

    if (error) {
      console.error('Error abandoning challenge:', error);
      throw error;
    }

    return true;
  }

  /**
   * 重启挑战
   */
  async restartChallenge(participationId: string, newStartDate?: string): Promise<boolean> {
    // 获取参与记录
    const { data: participation, error: fetchError } = await supabase
      .from('task_participations')
      .select('*')
      .eq('id', participationId)
      .single();

    if (fetchError || !participation) {
      console.error('Error fetching participation for restart:', fetchError);
      throw fetchError || new Error('Participation not found');
    }

    // 计算新的结束日期
    const startDate = newStartDate ? new Date(newStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (participation.personal_duration_days - 1));

    const { error } = await supabase
      .from('task_participations')
      .update({
        status: 'active',
        personal_start_date: startDate.toISOString().split('T')[0],
        personal_end_date: endDate.toISOString().split('T')[0],
        completed_count: 0,
        current_streak: 0,
        completion_rate: 0,
        restart_count: participation.restart_count + 1,
        last_restart_date: startDate.toISOString().split('T')[0],
        abandoned_at: null,
        completed_at: null
      })
      .eq('id', participationId);

    if (error) {
      console.error('Error restarting challenge:', error);
      throw error;
    }

    return true;
  }

  /**
   * 获取挑战排行榜
   */
  async getChallengeLeaderboard(taskId: string): Promise<(TaskParticipation & { user_name: string })[]> {
    const { data, error } = await supabase
      .from('task_participations')
      .select(`
        *,
        user_profiles (display_name)
      `)
      .eq('task_id', taskId)
      .order('completion_rate', { ascending: false })
      .order('current_streak', { ascending: false });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      user_name: item.user_profiles?.display_name || 'Unknown User'
    })) || [];
  }

  // ==========================================
  // 便利方法
  // ==========================================

  /**
   * 检查用户是否可以加入挑战
   */
  async canJoinChallenge(taskId: string, userId: string): Promise<{ canJoin: boolean; reason?: string }> {
    // 获取任务信息
    const task = await this.getTask(taskId);
    if (!task) {
      return { canJoin: false, reason: '任务不存在' };
    }

    if (!task.challenge_mode) {
      return { canJoin: false, reason: '此任务不是挑战模式' };
    }

    // 检查是否已经参与
    const { data: existing } = await supabase
      .from('task_participations')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { canJoin: false, reason: '已经参与过此挑战' };
    }

    // 检查参与人数限制
    if (task.max_participants && task.total_participants >= task.max_participants) {
      return { canJoin: false, reason: '参与人数已满' };
    }

    // 检查时间限制
    if (task.end_date) {
      const now = new Date();
      const endDate = new Date(task.end_date);
      if (now > endDate) {
        return { canJoin: false, reason: '挑战已结束' };
      }
    }

    return { canJoin: true };
  }

  /**
   * 获取今日可完成的任务
   */
  async getTodayTasks(userId: string): Promise<(TaskParticipation & { task: UnifiedTask })[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('task_participations')
      .select(`
        *,
        tasks (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('personal_start_date', today)
      .gte('personal_end_date', today);

    if (error) {
      console.error('Error fetching today tasks:', error);
      throw error;
    }

    // 过滤掉今天已经完成的任务
    const tasksWithCompletion = await Promise.all(
      (data || []).map(async (participation) => {
        const { data: completion } = await supabase
          .from('task_completions')
          .select('id')
          .eq('participation_id', participation.id)
          .eq('completion_date', today)
          .single();

        return {
          ...participation,
          task: participation.tasks,
          completedToday: !!completion
        };
      })
    );

    return tasksWithCompletion
      .filter(item => !item.completedToday)
      .map(item => ({
        ...item,
        task: item.task
      }));
  }
}

// 导出单例实例
export const unifiedTaskService = new UnifiedTaskService();
