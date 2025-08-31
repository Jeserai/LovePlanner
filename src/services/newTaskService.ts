// 🎯 新任务服务 - 适配重构后的数据库结构
import { supabase } from '../lib/supabase';

// ==========================================
// 类型定义
// ==========================================

export interface BaseTask {
  id: string;
  title: string;
  description?: string;
  points: number;
  creator_id: string;
  couple_id: string;
  task_category: 'once' | 'repeat' | 'habit';
  requires_proof: boolean;
  proof_type?: 'photo' | 'text' | 'file';
  created_at: string;
  updated_at: string;
}

export interface OnceTask extends BaseTask {
  task_category: 'once';
  start_time?: string;
  end_time?: string;
  status: 'recruiting' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'abandoned';
  assignee_id?: string;
  assigned_at?: string;
  started_at?: string;
  submitted_at?: string;
  completed_at?: string;
  proof_url?: string;
  review_comment?: string;
}

export interface RepeatTaskTemplate extends BaseTask {
  task_category: 'repeat';
  repeat_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  repeat_start_date: string;
  repeat_end_date?: string;
  repeat_weekdays?: number[];
  repeat_time?: string;
  instance_start_offset?: string;
  instance_end_offset?: string;
  is_active: boolean;
  last_generated_date?: string;
  auto_publish: boolean;
  publish_days_ahead: number;
}

export interface RepeatTaskInstance {
  id: string;
  template_id: string;
  instance_date: string;
  start_time?: string;
  end_time?: string;
  status: 'recruiting' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'abandoned' | 'skipped';
  assignee_id?: string;
  assigned_at?: string;
  started_at?: string;
  submitted_at?: string;
  completed_at?: string;
  proof_url?: string;
  review_comment?: string;
  is_auto_generated: boolean;
  created_at: string;
}

export interface HabitTask extends BaseTask {
  task_category: 'habit';
  duration_type: '21days' | '30days' | '90days' | '365days';
  duration_days: number;
  challenge_start_date: string;
  challenge_end_date: string;
  max_participants?: number;
  allow_restart: boolean;
  status: 'recruiting' | 'active' | 'completed' | 'cancelled';
  total_participants: number;
  active_participants: number;
  completed_participants: number;
}

export interface PersonalHabitChallenge {
  id: string;
  habit_task_id: string;
  user_id: string;
  joined_at: string;
  personal_start_date: string;
  personal_end_date: string;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  total_days: number;
  completed_days: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  restart_count: number;
  last_restart_date?: string;
  completed_at?: string;
  abandoned_at?: string;
}

export interface HabitCheckIn {
  id: string;
  challenge_id: string;
  check_in_date: string;
  checked_in_at: string;
  notes?: string;
  proof_url?: string;
  mood_rating?: number;
  streak_day: number;
  is_makeup: boolean;
}

// 统一任务类型（用于前端显示）
export type UnifiedTask = (OnceTask | (RepeatTaskInstance & { template: RepeatTaskTemplate }) | HabitTask) & {
  task_type: 'once' | 'repeat_instance' | 'habit';
};

// ==========================================
// 一次性任务服务
// ==========================================

export const onceTaskService = {
  // 获取情侣的一次性任务
  async getOnceTasks(coupleId: string): Promise<OnceTask[]> {
    const { data, error } = await supabase
      .from('base_tasks')
      .select(`
        *,
        once_tasks (*)
      `)
      .eq('couple_id', coupleId)
      .eq('task_category', 'once')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching once tasks:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      ...item.once_tasks[0]
    })) || [];
  },

  // 创建一次性任务
  async createOnceTask(taskData: Partial<OnceTask>): Promise<OnceTask> {
    // 开始事务
    const { data: baseTask, error: baseError } = await supabase
      .from('base_tasks')
      .insert({
        title: taskData.title!,
        description: taskData.description,
        points: taskData.points || 0,
        creator_id: taskData.creator_id!,
        couple_id: taskData.couple_id!,
        task_category: 'once',
        requires_proof: taskData.requires_proof || false,
        proof_type: taskData.proof_type
      })
      .select()
      .single();

    if (baseError) {
      console.error('Error creating base task:', baseError);
      throw baseError;
    }

    const { data: onceTask, error: onceError } = await supabase
      .from('once_tasks')
      .insert({
        id: baseTask.id,
        start_time: taskData.start_time,
        end_time: taskData.end_time,
        status: taskData.status || 'recruiting'
      })
      .select()
      .single();

    if (onceError) {
      // 回滚：删除已创建的基础任务
      await supabase.from('base_tasks').delete().eq('id', baseTask.id);
      console.error('Error creating once task:', onceError);
      throw onceError;
    }

    return { ...baseTask, ...onceTask };
  },

  // 更新一次性任务
  async updateOnceTask(taskId: string, updates: Partial<OnceTask>): Promise<boolean> {
    // 分别更新基础任务和一次性任务表
    if (updates.title || updates.description || updates.points) {
      const { error: baseError } = await supabase
        .from('base_tasks')
        .update({
          title: updates.title,
          description: updates.description,
          points: updates.points,
          requires_proof: updates.requires_proof
        })
        .eq('id', taskId);

      if (baseError) {
        console.error('Error updating base task:', baseError);
        throw baseError;
      }
    }

    const { error: onceError } = await supabase
      .from('once_tasks')
      .update({
        start_time: updates.start_time,
        end_time: updates.end_time,
        status: updates.status,
        assignee_id: updates.assignee_id,
        proof_url: updates.proof_url,
        review_comment: updates.review_comment
      })
      .eq('id', taskId);

    if (onceError) {
      console.error('Error updating once task:', onceError);
      throw onceError;
    }

    return true;
  },

  // 分配任务
  async assignTask(taskId: string, assigneeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('once_tasks')
      .update({
        status: 'assigned',
        assignee_id: assigneeId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task:', error);
      throw error;
    }

    return true;
  },

  // 提交任务
  async submitTask(taskId: string, proofUrl?: string): Promise<boolean> {
    const { error } = await supabase
      .from('once_tasks')
      .update({
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        proof_url: proofUrl
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error submitting task:', error);
      throw error;
    }

    return true;
  },

  // 完成任务
  async completeTask(taskId: string, reviewComment?: string): Promise<boolean> {
    const { error } = await supabase
      .from('once_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        review_comment: reviewComment
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error completing task:', error);
      throw error;
    }

    return true;
  }
};

// ==========================================
// 重复任务服务
// ==========================================

export const repeatTaskService = {
  // 获取重复任务模板
  async getRepeatTaskTemplates(coupleId: string): Promise<RepeatTaskTemplate[]> {
    const { data, error } = await supabase
      .from('base_tasks')
      .select(`
        *,
        repeat_task_templates (*)
      `)
      .eq('couple_id', coupleId)
      .eq('task_category', 'repeat')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching repeat task templates:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      ...item.repeat_task_templates[0]
    })) || [];
  },

  // 获取重复任务实例
  async getRepeatTaskInstances(templateId: string, startDate?: string, endDate?: string): Promise<RepeatTaskInstance[]> {
    let query = supabase
      .from('repeat_task_instances')
      .select('*')
      .eq('template_id', templateId)
      .order('instance_date', { ascending: false });

    if (startDate) {
      query = query.gte('instance_date', startDate);
    }
    if (endDate) {
      query = query.lte('instance_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching repeat task instances:', error);
      throw error;
    }

    return data || [];
  },

  // 创建重复任务模板
  async createRepeatTaskTemplate(taskData: Partial<RepeatTaskTemplate>): Promise<RepeatTaskTemplate> {
    // 创建基础任务
    const { data: baseTask, error: baseError } = await supabase
      .from('base_tasks')
      .insert({
        title: taskData.title!,
        description: taskData.description,
        points: taskData.points || 0,
        creator_id: taskData.creator_id!,
        couple_id: taskData.couple_id!,
        task_category: 'repeat',
        requires_proof: taskData.requires_proof || false
      })
      .select()
      .single();

    if (baseError) {
      console.error('Error creating base task:', baseError);
      throw baseError;
    }

    // 创建重复任务模板
    const { data: template, error: templateError } = await supabase
      .from('repeat_task_templates')
      .insert({
        id: baseTask.id,
        repeat_frequency: taskData.repeat_frequency!,
        repeat_start_date: taskData.repeat_start_date!,
        repeat_end_date: taskData.repeat_end_date,
        repeat_weekdays: taskData.repeat_weekdays,
        repeat_time: taskData.repeat_time,
        instance_start_offset: taskData.instance_start_offset,
        instance_end_offset: taskData.instance_end_offset,
        auto_publish: taskData.auto_publish !== false,
        publish_days_ahead: taskData.publish_days_ahead || 1
      })
      .select()
      .single();

    if (templateError) {
      // 回滚
      await supabase.from('base_tasks').delete().eq('id', baseTask.id);
      console.error('Error creating repeat task template:', templateError);
      throw templateError;
    }

    return { ...baseTask, ...template };
  },

  // 生成重复任务实例
  async generateInstances(templateId: string, startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase.rpc('generate_repeat_task_instances', {
      template_id_param: templateId,
      start_date_param: startDate,
      end_date_param: endDate
    });

    if (error) {
      console.error('Error generating repeat task instances:', error);
      throw error;
    }

    return data || 0;
  },

  // 更新重复任务实例
  async updateRepeatTaskInstance(instanceId: string, updates: Partial<RepeatTaskInstance>): Promise<boolean> {
    const { error } = await supabase
      .from('repeat_task_instances')
      .update(updates)
      .eq('id', instanceId);

    if (error) {
      console.error('Error updating repeat task instance:', error);
      throw error;
    }

    return true;
  }
};

// ==========================================
// 习惯任务服务
// ==========================================

export const habitTaskService = {
  // 获取习惯任务
  async getHabitTasks(coupleId: string): Promise<HabitTask[]> {
    const { data, error } = await supabase
      .from('base_tasks')
      .select(`
        *,
        habit_tasks (*)
      `)
      .eq('couple_id', coupleId)
      .eq('task_category', 'habit')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habit tasks:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      ...item.habit_tasks[0]
    })) || [];
  },

  // 创建习惯任务
  async createHabitTask(taskData: Partial<HabitTask>): Promise<HabitTask> {
    // 创建基础任务
    const { data: baseTask, error: baseError } = await supabase
      .from('base_tasks')
      .insert({
        title: taskData.title!,
        description: taskData.description,
        points: taskData.points || 0,
        creator_id: taskData.creator_id!,
        couple_id: taskData.couple_id!,
        task_category: 'habit',
        requires_proof: taskData.requires_proof || false
      })
      .select()
      .single();

    if (baseError) {
      console.error('Error creating base task:', baseError);
      throw baseError;
    }

    // 创建习惯任务
    const { data: habitTask, error: habitError } = await supabase
      .from('habit_tasks')
      .insert({
        id: baseTask.id,
        duration_type: taskData.duration_type!,
        duration_days: taskData.duration_days!,
        challenge_start_date: taskData.challenge_start_date!,
        challenge_end_date: taskData.challenge_end_date!,
        max_participants: taskData.max_participants,
        allow_restart: taskData.allow_restart !== false,
        status: taskData.status || 'recruiting'
      })
      .select()
      .single();

    if (habitError) {
      // 回滚
      await supabase.from('base_tasks').delete().eq('id', baseTask.id);
      console.error('Error creating habit task:', habitError);
      throw habitError;
    }

    return { ...baseTask, ...habitTask };
  },

  // 加入习惯挑战
  async joinHabitChallenge(habitTaskId: string, userId: string): Promise<PersonalHabitChallenge> {
    // 获取习惯任务信息
    const { data: habitTask, error: habitError } = await supabase
      .from('habit_tasks')
      .select('*')
      .eq('id', habitTaskId)
      .single();

    if (habitError || !habitTask) {
      throw new Error('习惯任务不存在');
    }

    // 检查是否已经参与过
    const { data: existing } = await supabase
      .from('personal_habit_challenges')
      .select('*')
      .eq('habit_task_id', habitTaskId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('已经参与过此挑战');
    }

    // 计算个人挑战时间
    const joinDate = new Date();
    const personalStartDate = joinDate.toISOString().split('T')[0];
    const personalEndDate = new Date(joinDate.getTime() + (habitTask.duration_days - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // 创建个人挑战
    const { data: challenge, error: challengeError } = await supabase
      .from('personal_habit_challenges')
      .insert({
        habit_task_id: habitTaskId,
        user_id: userId,
        personal_start_date: personalStartDate,
        personal_end_date: personalEndDate,
        total_days: habitTask.duration_days,
        status: 'active'
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Error joining habit challenge:', challengeError);
      throw challengeError;
    }

    // 更新习惯任务的参与者统计
    await supabase.rpc('increment', {
      table_name: 'habit_tasks',
      column_name: 'total_participants',
      row_id: habitTaskId,
      x: 1
    });

    await supabase.rpc('increment', {
      table_name: 'habit_tasks',
      column_name: 'active_participants',
      row_id: habitTaskId,
      x: 1
    });

    return challenge;
  },

  // 每日打卡
  async dailyCheckIn(challengeId: string, notes?: string, proofUrl?: string, moodRating?: number): Promise<HabitCheckIn> {
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经打卡
    const { data: existing } = await supabase
      .from('habit_check_ins')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('check_in_date', today)
      .single();

    if (existing) {
      throw new Error('今天已经打卡了');
    }

    // 获取挑战信息
    const { data: challenge, error: challengeError } = await supabase
      .from('personal_habit_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new Error('挑战不存在');
    }

    // 计算连续天数
    const streakDay = challenge.current_streak + 1;

    // 创建打卡记录
    const { data: checkIn, error: checkInError } = await supabase
      .from('habit_check_ins')
      .insert({
        challenge_id: challengeId,
        check_in_date: today,
        notes: notes,
        proof_url: proofUrl,
        mood_rating: moodRating,
        streak_day: streakDay
      })
      .select()
      .single();

    if (checkInError) {
      console.error('Error creating check-in:', checkInError);
      throw checkInError;
    }

    // 触发进度更新（通过触发器自动执行）
    return checkIn;
  },

  // 获取用户的习惯挑战
  async getUserHabitChallenges(userId: string): Promise<(PersonalHabitChallenge & { task: HabitTask })[]> {
    const { data, error } = await supabase
      .from('personal_habit_challenges')
      .select(`
        *,
        habit_tasks (
          *,
          base_tasks (*)
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching user habit challenges:', error);
      throw error;
    }

    return data?.map(item => ({
      ...item,
      task: {
        ...item.habit_tasks.base_tasks,
        ...item.habit_tasks
      }
    })) || [];
  },

  // 放弃挑战
  async abandonChallenge(challengeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('personal_habit_challenges')
      .update({
        status: 'abandoned',
        abandoned_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (error) {
      console.error('Error abandoning challenge:', error);
      throw error;
    }

    return true;
  }
};

// ==========================================
// 统一任务服务
// ==========================================

export const unifiedTaskService = {
  // 获取所有任务（统一接口）
  async getAllTasks(coupleId: string): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('unified_task_list')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unified tasks:', error);
      throw error;
    }

    return data?.map(task => ({
      ...task,
      task_type: task.task_type as 'once' | 'repeat_instance' | 'habit'
    })) || [];
  },

  // 根据状态获取任务
  async getTasksByStatus(coupleId: string, status: string): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('unified_task_list')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }

    return data?.map(task => ({
      ...task,
      task_type: task.task_type as 'once' | 'repeat_instance' | 'habit'
    })) || [];
  },

  // 根据创建者获取任务
  async getTasksByCreator(creatorId: string): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('unified_task_list')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by creator:', error);
      throw error;
    }

    return data?.map(task => ({
      ...task,
      task_type: task.task_type as 'once' | 'repeat_instance' | 'habit'
    })) || [];
  },

  // 根据分配者获取任务
  async getTasksByAssignee(assigneeId: string): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('unified_task_list')
      .select('*')
      .eq('assignee_id', assigneeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }

    return data?.map(task => ({
      ...task,
      task_type: task.task_type as 'once' | 'repeat_instance' | 'habit'
    })) || [];
  }
};

// 导出所有服务
export const newTaskService = {
  once: onceTaskService,
  repeat: repeatTaskService,
  habit: habitTaskService,
  unified: unifiedTaskService
};
