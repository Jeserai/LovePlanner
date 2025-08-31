// 🔄 TaskBoard适配器 - 将新数据结构适配到原TaskBoard
import { newTaskService } from './newTaskService';
import type { Task as NewTask, CreateTaskForm, EditTaskForm } from '../types/task';

// 原TaskBoard期望的Task接口
interface LegacyTask {
  id: string;
  title: string;
  description: string;
  start_time?: string | null | undefined;
  end_time?: string | null | undefined;
  points: number;
  status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review' | 'interrupted' | 'waiting_to_start';
  assignee?: string | null;
  creator: string;
  createdAt: string;
  requiresProof: boolean;
  proof?: string | null;
  taskType: 'daily' | 'habit' | 'special';
  repeatType: 'once' | 'repeat';
  reviewComment?: string | null;
  submittedAt?: string;
  
  // 重复性任务字段
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  repeat_start?: string;
  repeat_end?: string;
  repeatTime?: string;
  repeatWeekdays?: number[];
  
  // 习惯任务字段
  duration?: '21days' | '1month' | '6months' | '1year';
  consecutiveCount?: number;
  currentStreak?: number;
  streakStartDate?: string;
  completionRecord?: string;
  
  // 向后兼容字段
  deadline?: string | null;
  taskStartTime?: string;
  taskEndTime?: string;
  startDate?: string;
  endDate?: string;
}

// 原TaskBoard期望的CreateTask接口
interface LegacyCreateTask {
  title: string;
  description: string;
  taskType: 'daily' | 'habit' | 'special';
  points: number;
  requiresProof: boolean;
  start_time: string;
  end_time: string;
  repeat_start: string;
  repeat_end: string;
  isUnlimited: boolean;
  repeat: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  endRepeat: 'never' | 'on_date';
  duration: '21days' | '1month' | '6months' | '1year';
  consecutiveCount: number;
}

// 🔄 数据转换函数

// 将新Task转换为原TaskBoard期望的格式
const transformNewTaskToLegacy = (newTask: NewTask): LegacyTask => {
  // 计算持续时间枚举
  const calculateDurationEnum = (requiredCount: number | null, frequency: string): '21days' | '1month' | '6months' | '1year' => {
    if (!requiredCount) return '21days';
    
    switch (frequency) {
      case 'daily':
        if (requiredCount <= 30) return '1month';
        if (requiredCount <= 180) return '6months';
        return '1year';
      case 'weekly':
        if (requiredCount <= 4) return '1month';
        if (requiredCount <= 26) return '6months';
        return '1year';
      case 'monthly':
        if (requiredCount <= 6) return '6months';
        return '1year';
      default:
        return '21days';
    }
  };

  return {
    id: newTask.id,
    title: newTask.title,
    description: newTask.description || '',
    start_time: newTask.earliest_start_time,
    end_time: newTask.task_deadline,
    points: newTask.points,
    status: newTask.status as any,
    assignee: newTask.assignee_id,
    creator: newTask.creator_id,
    createdAt: newTask.created_at,
    requiresProof: newTask.requires_proof,
    proof: newTask.proof_url,
    taskType: newTask.task_type,
    repeatType: newTask.repeat_frequency === 'never' ? 'once' : 'repeat',
    reviewComment: newTask.review_comment,
    submittedAt: newTask.submitted_at || undefined,
    
    // 重复性任务字段
    repeatFrequency: newTask.repeat_frequency === 'never' || newTask.repeat_frequency === 'forever' 
      ? undefined 
      : newTask.repeat_frequency as any,
    repeat_start: newTask.earliest_start_time,
    repeat_end: newTask.task_deadline,
    repeatTime: newTask.daily_time_start || undefined,
    repeatWeekdays: newTask.repeat_weekdays || undefined,
    
    // 习惯任务字段
    duration: calculateDurationEnum(newTask.required_count, newTask.repeat_frequency),
    consecutiveCount: newTask.required_count || undefined,
    currentStreak: newTask.current_streak,
    streakStartDate: newTask.earliest_start_time,
    completionRecord: JSON.stringify(newTask.completion_record),
    
    // 向后兼容字段
    deadline: newTask.task_deadline,
    taskStartTime: newTask.earliest_start_time,
    taskEndTime: newTask.task_deadline,
    startDate: newTask.earliest_start_time,
    endDate: newTask.task_deadline
  };
};

// 将原TaskBoard的创建表单转换为新的CreateTaskForm
const transformLegacyCreateToNew = (legacyTask: LegacyCreateTask): CreateTaskForm => {
  // 计算required_count
  const calculateRequiredCount = (
    repeat: string, 
    duration: string, 
    consecutiveCount: number,
    isUnlimited: boolean
  ): number | undefined => {
    if (repeat === 'never') return 1;
    if (isUnlimited) return undefined; // forever任务
    
    // 对于有限重复任务，使用consecutiveCount
    return consecutiveCount;
  };

  // 确定repeat_frequency
  const determineRepeatFrequency = (repeat: string, isUnlimited: boolean) => {
    if (repeat === 'never') return 'never';
    if (isUnlimited) return 'forever';
    return repeat;
  };

  return {
    title: legacyTask.title,
    description: legacyTask.description,
    points: legacyTask.points,
    task_type: legacyTask.taskType,
    repeat_frequency: determineRepeatFrequency(legacyTask.repeat, legacyTask.isUnlimited) as any,
    earliest_start_time: legacyTask.start_time || undefined,
    required_count: calculateRequiredCount(
      legacyTask.repeat, 
      legacyTask.duration, 
      legacyTask.consecutiveCount,
      legacyTask.isUnlimited
    ),
    task_deadline: legacyTask.isUnlimited ? undefined : (legacyTask.end_time || undefined),
    daily_time_start: legacyTask.start_time ? new Date(legacyTask.start_time).toTimeString().slice(0, 5) : undefined,
    daily_time_end: legacyTask.end_time ? new Date(legacyTask.end_time).toTimeString().slice(0, 5) : undefined,
    requires_proof: legacyTask.requiresProof
  };
};

// 🎯 适配器服务
export const taskBoardAdapter = {
  // 获取任务列表（转换为原格式）
  async getTasks(coupleId: string, filter?: {
    status?: string[];
    creator_id?: string;
    assignee_id?: string;
  }): Promise<LegacyTask[]> {
    try {
      const newTasks = await newTaskService.getTasks(coupleId, filter as any);
      return newTasks.map(transformNewTaskToLegacy);
    } catch (error) {
      console.error('适配器获取任务失败:', error);
      throw error;
    }
  },

  // 获取单个任务
  async getTask(taskId: string): Promise<LegacyTask | null> {
    try {
      const newTask = await newTaskService.getTask(taskId);
      return newTask ? transformNewTaskToLegacy(newTask) : null;
    } catch (error) {
      console.error('适配器获取单个任务失败:', error);
      throw error;
    }
  },

  // 创建任务
  async createTask(legacyTask: LegacyCreateTask, creatorId: string, coupleId: string): Promise<LegacyTask> {
    try {
      const newTaskForm = transformLegacyCreateToNew(legacyTask);
      const newTask = await newTaskService.createTask(newTaskForm, creatorId, coupleId);
      return transformNewTaskToLegacy(newTask);
    } catch (error) {
      console.error('适配器创建任务失败:', error);
      throw error;
    }
  },

  // 更新任务
  async updateTask(taskId: string, updates: Partial<LegacyCreateTask>): Promise<LegacyTask> {
    try {
      // 先获取现有任务
      const existingTask = await newTaskService.getTask(taskId);
      if (!existingTask) {
        throw new Error('任务不存在');
      }

      // 合并更新
      const mergedLegacyTask: LegacyCreateTask = {
        title: updates.title || existingTask.title,
        description: updates.description || existingTask.description || '',
        taskType: updates.taskType || existingTask.task_type,
        points: updates.points || existingTask.points,
        requiresProof: updates.requiresProof !== undefined ? updates.requiresProof : existingTask.requires_proof,
        start_time: updates.start_time || existingTask.earliest_start_time || '',
        end_time: updates.end_time || existingTask.task_deadline || '',
        repeat_start: updates.repeat_start || existingTask.earliest_start_time || '',
        repeat_end: updates.repeat_end || existingTask.task_deadline || '',
        isUnlimited: updates.isUnlimited !== undefined ? updates.isUnlimited : existingTask.repeat_frequency === 'forever',
        repeat: updates.repeat || (existingTask.repeat_frequency === 'never' ? 'never' : existingTask.repeat_frequency) as any,
        endRepeat: updates.endRepeat || 'never',
        duration: updates.duration || '21days',
        consecutiveCount: updates.consecutiveCount || existingTask.required_count || 1
      };

      const newTaskForm = transformLegacyCreateToNew(mergedLegacyTask);
      const updatedTask = await newTaskService.updateTask({ ...newTaskForm, id: taskId });
      return transformNewTaskToLegacy(updatedTask);
    } catch (error) {
      console.error('适配器更新任务失败:', error);
      throw error;
    }
  },

  // 分配任务
  async assignTask(taskId: string, assigneeId: string): Promise<LegacyTask> {
    try {
      const newTask = await newTaskService.assignTask(taskId, assigneeId);
      return transformNewTaskToLegacy(newTask);
    } catch (error) {
      console.error('适配器分配任务失败:', error);
      throw error;
    }
  },

  // 开始任务
  async startTask(taskId: string): Promise<LegacyTask> {
    try {
      const newTask = await newTaskService.startTask(taskId);
      return transformNewTaskToLegacy(newTask);
    } catch (error) {
      console.error('适配器开始任务失败:', error);
      throw error;
    }
  },

  // 完成任务
  async completeTask(taskId: string, proofUrl?: string): Promise<LegacyTask> {
    try {
      const newTask = await newTaskService.completeTask(taskId, proofUrl);
      return transformNewTaskToLegacy(newTask);
    } catch (error) {
      console.error('适配器完成任务失败:', error);
      throw error;
    }
  },

  // 放弃任务
  async abandonTask(taskId: string): Promise<LegacyTask> {
    try {
      const newTask = await newTaskService.abandonTask(taskId);
      return transformNewTaskToLegacy(newTask);
    } catch (error) {
      console.error('适配器放弃任务失败:', error);
      throw error;
    }
  },

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    try {
      await newTaskService.deleteTask(taskId);
    } catch (error) {
      console.error('适配器删除任务失败:', error);
      throw error;
    }
  },

  // 获取今日任务
  async getTodayTasks(coupleId: string, userId: string): Promise<LegacyTask[]> {
    try {
      const newTasks = await newTaskService.getTodayTasks(coupleId, userId);
      return newTasks.map(transformNewTaskToLegacy);
    } catch (error) {
      console.error('适配器获取今日任务失败:', error);
      throw error;
    }
  },

  // 获取任务统计
  async getTaskStats(coupleId: string, userId?: string) {
    try {
      return await newTaskService.getTaskStats(coupleId, userId);
    } catch (error) {
      console.error('适配器获取任务统计失败:', error);
      throw error;
    }
  }
};
