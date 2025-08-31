// 🎯 新的任务服务 - 基于优化后的单表结构
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import type { Task, CreateTaskForm, EditTaskForm, TaskFilter, TaskSort } from '../types/task';

type DatabaseTask = Database['public']['Tables']['tasks']['Row'];
type InsertTask = Database['public']['Tables']['tasks']['Insert'];
type UpdateTask = Database['public']['Tables']['tasks']['Update'];

// 🎯 数据库任务转换为前端任务
const transformDatabaseTask = (dbTask: DatabaseTask): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    points: dbTask.points,
    creator_id: dbTask.creator_id,
    couple_id: dbTask.couple_id,
    task_type: dbTask.task_type,
    repeat_frequency: dbTask.repeat_frequency,
    earliest_start_time: dbTask.earliest_start_time,
    required_count: dbTask.required_count,
    task_deadline: dbTask.task_deadline,
    repeat_weekdays: dbTask.repeat_weekdays,
    daily_time_start: dbTask.daily_time_start,
    daily_time_end: dbTask.daily_time_end,
    status: dbTask.status,
    assignee_id: dbTask.assignee_id,
    completed_count: dbTask.completed_count,
    current_streak: dbTask.current_streak,
    longest_streak: dbTask.longest_streak,
    completion_record: dbTask.completion_record || {},
    requires_proof: dbTask.requires_proof,
    proof_url: dbTask.proof_url,
    review_comment: dbTask.review_comment,
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at,
    submitted_at: dbTask.submitted_at,
    completed_at: dbTask.completed_at
  };
};

// 🎯 前端表单转换为数据库插入数据
const transformCreateForm = (form: CreateTaskForm, creatorId: string, coupleId: string): InsertTask => {
  return {
    title: form.title,
    description: form.description || null,
    points: form.points,
    creator_id: creatorId,
    couple_id: coupleId,
    task_type: form.task_type,
    repeat_frequency: form.repeat_frequency,
    earliest_start_time: form.earliest_start_time || null,
    required_count: form.repeat_frequency === 'never' ? 1 : (form.required_count || null),
    task_deadline: form.repeat_frequency === 'forever' ? null : (form.task_deadline || null),
    repeat_weekdays: form.repeat_weekdays || null,
    daily_time_start: form.daily_time_start || null,
    daily_time_end: form.daily_time_end || null,
    requires_proof: form.requires_proof,
    status: 'recruiting'
  };
};

export const newTaskService = {
  // 🎯 获取情侣的所有任务
  async getTasks(coupleId: string, filter?: TaskFilter, sort?: TaskSort): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('couple_id', coupleId);

      // 应用筛选条件
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          query = query.in('status', filter.status);
        }
        if (filter.task_type && filter.task_type.length > 0) {
          query = query.in('task_type', filter.task_type);
        }
        if (filter.repeat_frequency && filter.repeat_frequency.length > 0) {
          query = query.in('repeat_frequency', filter.repeat_frequency);
        }
        if (filter.assignee_id) {
          query = query.eq('assignee_id', filter.assignee_id);
        }
        if (filter.creator_id) {
          query = query.eq('creator_id', filter.creator_id);
        }
      }

      // 应用排序
      if (sort) {
        query = query.order(sort.by, { ascending: sort.order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取任务失败:', error);
        throw error;
      }

      return data.map(transformDatabaseTask);
    } catch (error) {
      console.error('获取任务时出错:', error);
      throw error;
    }
  },

  // 🎯 获取单个任务
  async getTask(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('获取任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('获取任务时出错:', error);
      throw error;
    }
  },

  // 🎯 创建任务
  async createTask(form: CreateTaskForm, creatorId: string, coupleId: string): Promise<Task> {
    try {
      const insertData = transformCreateForm(form, creatorId, coupleId);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('创建任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('创建任务时出错:', error);
      throw error;
    }
  },

  // 🎯 更新任务
  async updateTask(form: EditTaskForm): Promise<Task> {
    try {
      const updateData: UpdateTask = {
        title: form.title,
        description: form.description || null,
        points: form.points,
        task_type: form.task_type,
        repeat_frequency: form.repeat_frequency,
        earliest_start_time: form.earliest_start_time || null,
        required_count: form.repeat_frequency === 'never' ? 1 : (form.required_count || null),
        task_deadline: form.repeat_frequency === 'forever' ? null : (form.task_deadline || null),
        repeat_weekdays: form.repeat_weekdays || null,
        daily_time_start: form.daily_time_start || null,
        daily_time_end: form.daily_time_end || null,
        requires_proof: form.requires_proof
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', form.id)
        .select()
        .single();

      if (error) {
        console.error('更新任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('更新任务时出错:', error);
      throw error;
    }
  },

  // 🎯 分配任务
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          assignee_id: assigneeId,
          status: 'assigned'
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('分配任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('分配任务时出错:', error);
      throw error;
    }
  },

  // 🎯 开始任务
  async startTask(taskId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('开始任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('开始任务时出错:', error);
      throw error;
    }
  },

  // 🎯 完成任务（一次）
  async completeTask(taskId: string, proofUrl?: string): Promise<Task> {
    try {
      // 首先获取当前任务信息
      const currentTask = await this.getTask(taskId);
      if (!currentTask) {
        throw new Error('任务不存在');
      }

      const today = new Date().toISOString().split('T')[0];
      const newCompletedCount = currentTask.completed_count + 1;
      
      // 更新完成记录
      const newCompletionRecord = {
        ...currentTask.completion_record,
        [today]: true
      };

      // 计算新的连续次数
      let newCurrentStreak = currentTask.current_streak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (currentTask.completion_record[yesterdayStr] === true) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1; // 重新开始计算连续次数
      }

      const newLongestStreak = Math.max(currentTask.longest_streak, newCurrentStreak);

      // 判断任务是否完全完成
      let newStatus = currentTask.status;
      if (currentTask.repeat_frequency === 'never' || 
          (currentTask.required_count && newCompletedCount >= currentTask.required_count)) {
        newStatus = 'completed';
      }

      const updateData: UpdateTask = {
        completed_count: newCompletedCount,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        completion_record: newCompletionRecord,
        status: newStatus,
        proof_url: proofUrl || currentTask.proof_url,
        submitted_at: new Date().toISOString(),
        completed_at: newStatus === 'completed' ? new Date().toISOString() : currentTask.completed_at
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('完成任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('完成任务时出错:', error);
      throw error;
    }
  },

  // 🎯 放弃任务
  async abandonTask(taskId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'abandoned',
          assignee_id: null
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('放弃任务失败:', error);
        throw error;
      }

      return transformDatabaseTask(data);
    } catch (error) {
      console.error('放弃任务时出错:', error);
      throw error;
    }
  },

  // 🎯 删除任务
  async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('删除任务失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('删除任务时出错:', error);
      throw error;
    }
  },

  // 🎯 获取今日可完成的任务
  async getTodayTasks(coupleId: string, userId: string): Promise<Task[]> {
    try {
      const tasks = await this.getTasks(coupleId, {
        status: ['assigned', 'in_progress'],
        assignee_id: userId
      });

      // 过滤出今日可完成的任务
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      return tasks.filter(task => {
        // 检查是否今天已经完成
        if (task.completion_record[today] === true) {
          return false;
        }

        // 检查是否已过期
        if (task.task_deadline && now > new Date(task.task_deadline)) {
          return false;
        }

        // 检查是否还未开始
        if (task.earliest_start_time && now < new Date(task.earliest_start_time)) {
          return false;
        }

        // 检查是否已达到完成次数
        if (task.repeat_frequency !== 'forever' && 
            task.required_count && 
            task.completed_count >= task.required_count) {
          return false;
        }

        // 检查每日时间窗口
        if (task.daily_time_start && task.daily_time_end) {
          const currentTime = now.toTimeString().slice(0, 5);
          if (currentTime < task.daily_time_start || currentTime > task.daily_time_end) {
            return false;
          }
        }

        // 检查重复日期限制
        if (task.repeat_weekdays && task.repeat_weekdays.length > 0) {
          const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
          if (!task.repeat_weekdays.includes(dayOfWeek)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('获取今日任务时出错:', error);
      throw error;
    }
  },

  // 🎯 获取任务统计
  async getTaskStats(coupleId: string, userId?: string): Promise<{
    total: number;
    recruiting: number;
    assigned: number;
    in_progress: number;
    completed: number;
    abandoned: number;
    my_tasks?: number;
    today_available?: number;
  }> {
    try {
      const tasks = await this.getTasks(coupleId);
      
      const stats = {
        total: tasks.length,
        recruiting: tasks.filter(t => t.status === 'recruiting').length,
        assigned: tasks.filter(t => t.status === 'assigned').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        abandoned: tasks.filter(t => t.status === 'abandoned').length
      };

      if (userId) {
        const myTasks = tasks.filter(t => t.assignee_id === userId);
        const todayTasks = await this.getTodayTasks(coupleId, userId);
        
        return {
          ...stats,
          my_tasks: myTasks.length,
          today_available: todayTasks.length
        };
      }

      return stats;
    } catch (error) {
      console.error('获取任务统计时出错:', error);
      throw error;
    }
  }
};