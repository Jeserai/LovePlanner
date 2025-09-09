// 🎯 新的任务服务 - 基于优化后的单表结构
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import type { Task, CreateTaskForm, EditTaskForm, TaskFilter, TaskSort } from '../types/task';
import { getCurrentTime, getTodayString } from '../utils/testTimeManager';

type DatabaseTask = Database['public']['Tables']['tasks']['Row'];
type InsertTask = Database['public']['Tables']['tasks']['Insert'];
type UpdateTask = Database['public']['Tables']['tasks']['Update'];

// 🎯 统一解析completion_record字段，兼容新旧格式
const parseCompletionRecord = (completionRecord: any): string[] => {
  if (!completionRecord) return [];
  
  try {
    if (typeof completionRecord === 'string') {
      const parsed = JSON.parse(completionRecord);
      
      // 新格式：数组 ["2024-01-01", "2024-01-02"]
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // 旧格式：对象 {"2024-01-01": true, "2024-01-02": true}
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).filter(key => parsed[key] === true);
      }
    }
    
    // 如果直接是数组
    if (Array.isArray(completionRecord)) {
      return completionRecord;
    }
    
    // 如果直接是对象
    if (typeof completionRecord === 'object' && completionRecord !== null) {
      return Object.keys(completionRecord).filter(key => completionRecord[key] === true);
    }
  } catch (e) {
    console.error('解析completion_record失败:', completionRecord, e);
  }
  
  return [];
};

// 🎯 检查指定日期是否在完成记录中
const isDateCompleted = (completionRecord: any, date: string): boolean => {
  const recordArray = parseCompletionRecord(completionRecord);
  return recordArray.includes(date);
};

// 🎯 数据库任务转换为前端任务
const transformDatabaseTask = (dbTask: DatabaseTask): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    points: dbTask.points,
    creator_id: dbTask.creator_id,
    couple_id: dbTask.couple_id,
    task_type: dbTask.task_type as any,
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
    completion_record: dbTask.completion_record || null,
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
  // 🔧 修复时区问题：将本地时间转换为ISO字符串
  const convertLocalToISO = (localDateTime?: string) => {
    if (!localDateTime) return null;
    try {
      // datetime-local 格式：YYYY-MM-DDTHH:mm
      // 需要将其视为用户的本地时间并转换为 ISO 字符串
      const date = new Date(localDateTime);
      return date.toISOString();
    } catch (error) {
      console.error('时间格式转换错误:', error);
      return null;
    }
  };

  return {
    title: form.title,
    description: form.description || null,
    points: form.points,
    creator_id: creatorId,
    couple_id: coupleId,
    task_type: form.task_type as any,
    repeat_frequency: form.repeat_frequency,
    earliest_start_time: convertLocalToISO(form.earliest_start_time),
    required_count: form.repeat_frequency === 'never' ? 1 : (form.required_count || null),
    task_deadline: form.repeat_frequency === 'forever' ? null : convertLocalToISO(form.task_deadline),
    repeat_weekdays: form.repeat_weekdays || null,
    daily_time_start: form.daily_time_start || null,
    daily_time_end: form.daily_time_end || null,
    requires_proof: form.requires_proof,
    status: 'recruiting'
  };
};

export const taskService = {
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
      // 🔧 修复时区问题：将本地时间转换为ISO字符串
      const convertLocalToISO = (localDateTime?: string) => {
        if (!localDateTime) return null;
        try {
          // datetime-local 格式：YYYY-MM-DDTHH:mm
          // 需要将其视为用户的本地时间并转换为 ISO 字符串
          const date = new Date(localDateTime);
          return date.toISOString();
        } catch (error) {
          console.error('时间格式转换错误:', error);
          return null;
        }
      };

      const updateData: UpdateTask = {
        title: form.title,
        description: form.description || null,
        points: form.points,
        task_type: form.task_type as any,
        repeat_frequency: form.repeat_frequency,
        earliest_start_time: convertLocalToISO(form.earliest_start_time),
        required_count: form.repeat_frequency === 'never' ? 1 : (form.required_count || null),
        task_deadline: form.repeat_frequency === 'forever' ? null : convertLocalToISO(form.task_deadline),
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
      // 首先获取任务信息以判断是否有开始时间
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 判断任务状态：
      // 1. 没有开始时间 → 直接变为 in_progress
      // 2. 有开始时间但还未到 → assigned
      // 3. 有开始时间且已到 → in_progress
      let newStatus: 'assigned' | 'in_progress' = 'assigned';
      
      if (!task.earliest_start_time) {
        // 没有开始时间限制，领取后立即可以开始
        newStatus = 'in_progress';
      } else {
        // 有开始时间限制，检查当前时间
        const now = getCurrentTime();
        const startTime = new Date(task.earliest_start_time);
        
        if (now >= startTime) {
          // 已到开始时间，可以立即开始
          newStatus = 'in_progress';
        } else {
          // 还未到开始时间，保持assigned状态
          newStatus = 'assigned';
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          assignee_id: assigneeId,
          status: newStatus
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

  // 🎯 开始任务方法已移除 - 现在通过时间自动判断状态

  // 🎯 完成任务（一次）
  async completeTask(taskId: string, proofUrl?: string): Promise<Task> {
    try {
      // 首先获取当前任务信息
      const currentTask = await this.getTask(taskId);
      if (!currentTask) {
        throw new Error('任务不存在');
      }

      // 🎯 检查任务是否已到开始时间
      const now = getCurrentTime();
      if (currentTask.earliest_start_time && now < new Date(currentTask.earliest_start_time)) {
        throw new Error(`任务将于 ${new Date(currentTask.earliest_start_time).toLocaleString()} 开始，请稍后再试`);
      }

      const today = getTodayString();
      
      // 🎯 修正：使用统一的解析函数处理新旧格式
      let completionRecordArray: string[] = parseCompletionRecord(currentTask.completion_record);
      
      // 🎯 检查重复任务当前周期是否已完成，防止重复打卡
      if (currentTask.repeat_frequency !== 'never') {
        let periodKey = '';
        
        switch (currentTask.repeat_frequency) {
          case 'daily':
            periodKey = today; // YYYY-MM-DD
            break;
          case 'weekly':
            // 🔧 使用标准 ISO 周格式计算，与前端保持一致
            const getISOWeek = (date: Date): number => {
              const target = new Date(date.valueOf());
              const dayNr = (date.getDay() + 6) % 7;
              target.setDate(target.getDate() - dayNr + 3);
              const firstThursday = target.valueOf();
              target.setMonth(0, 1);
              if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
              }
              return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
            };
            
            const currentTime = getCurrentTime();
            const isoWeek = getISOWeek(currentTime);
            const isoYear = currentTime.getFullYear();
            periodKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
            
            // 🐛 调试：后端周期标识符生成
            if (process.env.NODE_ENV === 'development') {
              console.log('🏗️ 后端周期标识符生成:', {
                taskId: currentTask.id,
                taskTitle: currentTask.title,
                currentTime: currentTime.toISOString(),
                calculatedWeek: isoWeek,
                year: isoYear,
                generatedPeriodKey: periodKey
              });
            }
            break;
          case 'biweekly':
            const currentTimeForBiweek = getCurrentTime();
            const weekNumber = Math.floor((currentTimeForBiweek.getTime() - new Date(currentTimeForBiweek.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
            const biweekNumber = Math.floor(weekNumber / 2);
            periodKey = `${currentTimeForBiweek.getFullYear()}-BW${biweekNumber}`;
            break;
          case 'monthly':
            const currentTimeForMonth = getCurrentTime();
            periodKey = `${currentTimeForMonth.getFullYear()}-${String(currentTimeForMonth.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            const currentTimeForYear = getCurrentTime();
            periodKey = String(currentTimeForYear.getFullYear());
            break;
          default:
            periodKey = today;
        }
        
        if (completionRecordArray.includes(periodKey)) {
          throw new Error('本周期已完成打卡，请等待下一个周期');
        }
        
        // 添加当前周期的记录
        completionRecordArray.push(periodKey);
      } else {
        // 一次性任务直接添加今天的记录
        if (!completionRecordArray.includes(today)) {
          completionRecordArray.push(today);
        }
      }
      
      const newCompletedCount = currentTask.completed_count + 1;
      
      const newCompletionRecord = JSON.stringify(completionRecordArray);

      // 🎯 修正：重新计算完整的连续次数
      let newCurrentStreak = 1; // 至少这次打卡算1次
      
      if (currentTask.repeat_frequency === 'never') {
        // 一次性任务：完成就是1
        newCurrentStreak = 1;
      } else {
        // 🎯 重复任务：重新计算完整的连续次数
        const sortedRecords = [...completionRecordArray].sort();
        const latestRecord = sortedRecords[sortedRecords.length - 1]; // 最新的打卡记录
        
        // 从最新记录开始向前计算连续次数
        for (let i = sortedRecords.length - 1; i >= 0; i--) {
          const currentRecord = sortedRecords[i];
          
          if (i === sortedRecords.length - 1) {
            // 最新记录，计数为1
            newCurrentStreak = 1;
            continue;
          }
          
          const nextRecord = sortedRecords[i + 1];
          
          // 根据频率检查是否连续
          let isConsecutive = false;
          switch (currentTask.repeat_frequency) {
            case 'daily':
              const currentDate = new Date(currentRecord);
              const nextDate = new Date(nextRecord);
              const diffDays = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
              isConsecutive = diffDays === 1;
              break;
            case 'weekly':
              // 🔧 周任务：检查 ISO 周格式是否连续 (2025-W35, 2025-W36)
              const parseISOWeek = (weekStr: string) => {
                const [year, week] = weekStr.split('-W').map(Number);
                return { year, week };
              };
              
              const current = parseISOWeek(currentRecord);
              const next = parseISOWeek(nextRecord);
              
              // 检查是否是连续的周
              if (current.year === next.year) {
                isConsecutive = next.week - current.week === 1;
              } else if (next.year - current.year === 1) {
                // 跨年情况：当前年最后一周 → 下一年第一周
                const lastWeekOfYear = 52; // 大多数年份有52周，少数有53周
                isConsecutive = current.week >= lastWeekOfYear && next.week === 1;
              } else {
                isConsecutive = false;
              }
              break;
            case 'monthly':
              // 月任务：检查格式 YYYY-MM
              const [currentYear, currentMonth] = currentRecord.split('-').map(Number);
              const [nextYear, nextMonth] = nextRecord.split('-').map(Number);
              isConsecutive = (nextYear === currentYear && nextMonth === currentMonth + 1) || 
                            (nextYear === currentYear + 1 && currentMonth === 12 && nextMonth === 1);
              break;
            case 'yearly':
              // 年任务：检查格式 YYYY
              const currentYearNum = parseInt(currentRecord);
              const nextYearNum = parseInt(nextRecord);
              isConsecutive = nextYearNum === currentYearNum + 1;
              break;
            default:
              isConsecutive = false;
          }
          
          if (isConsecutive) {
            newCurrentStreak++;
          } else {
            // 不连续，停止计算
            break;
          }
        }
      }

      const newLongestStreak = Math.max(currentTask.longest_streak, newCurrentStreak);

      // 判断任务是否完全完成
      let newStatus = currentTask.status;
      if (currentTask.repeat_frequency === 'never') {
        // 一次性任务：完成一次就算完成
        newStatus = 'completed';
      } else if (currentTask.required_count && newCurrentStreak >= currentTask.required_count) {
        // 🎯 修正：重复任务应该基于连续完成次数判断，而不是总完成次数
        newStatus = 'completed';
      }

      const updateData: UpdateTask = {
        completed_count: newCompletedCount,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        completion_record: newCompletionRecord,
        status: newStatus,
        proof_url: proofUrl || currentTask.proof_url,
        submitted_at: getCurrentTime().toISOString(),
        completed_at: newStatus === 'completed' ? getCurrentTime().toISOString() : currentTask.completed_at
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
      const today = getTodayString();
      const now = getCurrentTime();

      return tasks.filter(task => {
        // 🎯 修正：使用统一的解析函数检查是否今天已经完成
        if (isDateCompleted(task.completion_record, today)) {
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
  },

  // 🎯 自动检查并更新已到开始时间的任务状态
  async checkAndUpdateTaskStatus(coupleId: string): Promise<void> {
    try {
      const now = getCurrentTime();
      
      // 查找所有assigned状态且有开始时间的任务
      const { data: assignedTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('status', 'assigned')
        .not('earliest_start_time', 'is', null);

      if (error) {
        console.error('查询assigned任务失败:', error);
        return;
      }

      if (!assignedTasks || assignedTasks.length === 0) {
        return;
      }

      // 检查每个任务是否已到开始时间
      const tasksToUpdate = assignedTasks.filter(task => {
        const startTime = new Date(task.earliest_start_time!);
        return now >= startTime;
      });

      // 批量更新状态为in_progress
      for (const task of tasksToUpdate) {
        await supabase
          .from('tasks')
          .update({ status: 'in_progress' })
          .eq('id', task.id);
        
        console.log(`任务 ${task.title} 已自动开始 (${task.earliest_start_time} → 现在)`);
      }

      if (tasksToUpdate.length > 0) {
        console.log(`自动更新了 ${tasksToUpdate.length} 个任务状态为 in_progress`);
      }
    } catch (error) {
      console.error('检查任务状态时出错:', error);
    }
  }
};