// 简化版习惯任务服务
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// 个人习惯挑战类型
export interface PersonalHabitChallenge {
  id: string;
  task_id: string;
  user_id: string;
  joined_at: string;
  personal_start_date: string;
  personal_end_date: string;
  total_completions: number;
  last_completion_date?: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  completed_at?: string;
  total_points_earned: number;
  created_at: string;
}

// 打卡记录类型
export interface HabitCompletion {
  id: string;
  personal_challenge_id: string;
  completion_date: string;
  completion_time: string;
  notes?: string;
  proof_url?: string;
  points_earned: number;
}

// 习惯任务服务
export const habitTaskService = {
  // 🎯 用户领取习惯挑战
  async joinHabitChallenge(taskId: string, userId: string): Promise<PersonalHabitChallenge> {
    try {
      // 获取习惯任务信息
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('task_type', 'habit')
        .single();

      if (taskError) throw taskError;
      if (!task) throw new Error('习惯任务不存在');

      // 检查是否已经参与过
      const { data: existing } = await supabase
        .from('personal_habit_challenges')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('您已经参与过此挑战');
      }

      // 🎯 计算最晚领取日期
      const endDate = new Date(task.end_date!);
      const challengeDays = task.duration === '21days' ? 21 : 30; // 简化处理
      const latestJoinDate = new Date(endDate);
      latestJoinDate.setDate(latestJoinDate.getDate() - challengeDays + 1);

      const today = new Date();
      if (today > latestJoinDate) {
        throw new Error('领取已截止，时间不够完成整个挑战');
      }

      // 🎯 创建个人挑战实例
      const personalChallenge = {
        task_id: taskId,
        user_id: userId,
        personal_start_date: today.toISOString().split('T')[0],
        personal_end_date: task.end_date!,
        total_completions: 0,
        status: 'active' as const,
        total_points_earned: 0
      };

      const { data, error } = await supabase
        .from('personal_habit_challenges')
        .insert(personalChallenge)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('领取习惯挑战失败:', error);
      throw error;
    }
  },

  // 🎯 每日打卡
  async dailyCheckIn(challengeId: string, notes?: string, proofUrl?: string): Promise<HabitCompletion> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 检查今天是否已经打卡
      const { data: existingCompletion } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('personal_challenge_id', challengeId)
        .eq('completion_date', today)
        .single();

      if (existingCompletion) {
        throw new Error('今天已经打卡了');
      }

      // 获取个人挑战信息
      const { data: challenge, error: challengeError } = await supabase
        .from('personal_habit_challenges')
        .select('*, tasks(*)')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;
      if (!challenge) throw new Error('挑战不存在');

      // 检查挑战是否还在进行中
      if (challenge.status !== 'active') {
        throw new Error('挑战已结束');
      }

      if (today > challenge.personal_end_date) {
        throw new Error('挑战已过期');
      }

      // 🎯 记录打卡
      const completion = {
        personal_challenge_id: challengeId,
        completion_date: today,
        notes,
        proof_url: proofUrl,
        points_earned: challenge.tasks?.points || 10
      };

      const { data: completionData, error: completionError } = await supabase
        .from('habit_completions')
        .insert(completion)
        .select()
        .single();

      if (completionError) throw completionError;

      // 🎯 更新个人挑战进度
      const newTotalCompletions = challenge.total_completions + 1;
      const newTotalPoints = challenge.total_points_earned + (challenge.tasks?.points || 10);

      // 检查是否完成挑战
      const challengeDays = challenge.tasks?.duration === '21days' ? 21 : 30;
      const isCompleted = newTotalCompletions >= challengeDays;

      const updateData: any = {
        total_completions: newTotalCompletions,
        last_completion_date: today,
        total_points_earned: newTotalPoints
      };

      if (isCompleted) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('personal_habit_challenges')
        .update(updateData)
        .eq('id', challengeId);

      if (updateError) throw updateError;

      return completionData;
    } catch (error) {
      console.error('打卡失败:', error);
      throw error;
    }
  },

  // 🎯 获取用户的习惯挑战列表
  async getUserHabitChallenges(userId: string): Promise<(PersonalHabitChallenge & { task: any })[]> {
    try {
      const { data, error } = await supabase
        .from('personal_habit_challenges')
        .select(`
          *,
          tasks (
            id,
            title,
            description,
            points,
            task_type,
            duration,
            start_date,
            end_date
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('获取用户习惯挑战失败:', error);
      throw error;
    }
  },

  // 🎯 获取习惯任务的参与统计
  async getHabitTaskStats(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('personal_habit_challenges')
        .select('status')
        .eq('task_id', taskId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        active: data?.filter(c => c.status === 'active').length || 0,
        completed: data?.filter(c => c.status === 'completed').length || 0,
        failed: data?.filter(c => c.status === 'failed').length || 0,
        abandoned: data?.filter(c => c.status === 'abandoned').length || 0
      };

      return stats;
    } catch (error) {
      console.error('获取习惯任务统计失败:', error);
      return { total: 0, active: 0, completed: 0, failed: 0, abandoned: 0 };
    }
  },

  // 🎯 放弃挑战
  async abandonChallenge(challengeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('personal_habit_challenges')
        .update({ status: 'abandoned' })
        .eq('id', challengeId);

      if (error) throw error;
    } catch (error) {
      console.error('放弃挑战失败:', error);
      throw error;
    }
  },

  // 🎯 每日自动检查过期挑战（定时任务）
  async checkExpiredChallenges(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 查找今天截止的活跃挑战
      const { data: expiredChallenges, error } = await supabase
        .from('personal_habit_challenges')
        .select(`
          *,
          tasks (duration)
        `)
        .eq('status', 'active')
        .eq('personal_end_date', today);

      if (error) throw error;

      // 批量更新过期挑战的状态
      for (const challenge of expiredChallenges || []) {
        const challengeDays = challenge.tasks?.duration === '21days' ? 21 : 30;
        const isCompleted = challenge.total_completions >= challengeDays;

        await supabase
          .from('personal_habit_challenges')
          .update({
            status: isCompleted ? 'completed' : 'failed',
            completed_at: isCompleted ? new Date().toISOString() : undefined
          })
          .eq('id', challenge.id);
      }

      console.log(`检查了 ${expiredChallenges?.length || 0} 个过期挑战`);
    } catch (error) {
      console.error('检查过期挑战失败:', error);
    }
  }
};

// 🎯 计算习惯任务的最晚领取日期
export const calculateLatestJoinDate = (endDate: string, challengeDays: number): string => {
  const end = new Date(endDate);
  const latestJoin = new Date(end);
  latestJoin.setDate(latestJoin.getDate() - challengeDays + 1);
  return latestJoin.toISOString().split('T')[0];
};

// 🎯 检查是否可以领取习惯任务
export const canJoinHabitTask = (endDate: string, challengeDays: number): boolean => {
  const today = new Date();
  const latestJoinDate = new Date(calculateLatestJoinDate(endDate, challengeDays));
  return today <= latestJoinDate;
};
