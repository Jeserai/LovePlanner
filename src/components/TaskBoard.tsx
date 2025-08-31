// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Icon from './ui/Icon';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import LoadingSpinner from './ui/LoadingSpinner';
import PointsDisplay from './PointsDisplay';
import Button from './ui/Button';
import PageHeader from './ui/PageHeader';
// import Card from './ui/Card'; // 已删除，使用ThemeCard替代
import NavigationButton from './ui/NavigationButton';
import DetailField from './ui/DetailField';
import DevTools from './DevTools';
import { 
  ThemeCard, 
  ThemeDialog, 
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
  ThemeFormField, 
  ThemeInput, 
  ThemeTextarea, 
  ThemeSelect, 
  ThemeCheckbox, 
  ThemeButton, 
  ConfirmDialog
} from './ui/Components';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import { taskService, userService, pointService } from '../services/database';
import { taskService as switchableTaskService, userService as switchableUserService } from '../services/apiServiceSwitch';
import { enableMockApi, disableMockApi } from '../services/mockApiService';
import { habitTaskService, calculateLatestJoinDate, canJoinHabitTask } from '../services/habitTaskService';
import type { PersonalHabitChallenge } from '../services/habitTaskService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { globalEventService, GlobalEvents } from '../services/globalEventService';

// 前端Task接口（简化版 - 统一时间字段命名）
interface Task {
  id: string;
  title: string;
  description: string;
  // 🎯 统一的时间模型
  start_time?: string | null | undefined; // 统一的开始时间（原taskStartTime）
  end_time?: string | null | undefined;   // 统一的结束时间（原deadline/taskEndTime）
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
  repeat_start?: string;      // 统一的重复开始日期（原startDate）
  repeat_end?: string;        // 统一的重复结束日期（原endDate）
  repeatTime?: string;        // 每日执行时间点
  repeatWeekdays?: number[];
  // 🎯 简化的习惯任务字段
  duration?: '21days' | '1month' | '6months' | '1year'; // 习惯任务持续时间
  consecutiveCount?: number; // 需要连续完成的次数（根据repeatFrequency确定单位）
  currentStreak?: number; // 当前连续完成次数
  streakStartDate?: string; // 当前连续周期开始日期
  completionRecord?: string; // JSON格式的完成记录
  
  // 🔧 向后兼容字段（标记为废弃）
  /** @deprecated use start_time instead */
  taskStartTime?: string;
  /** @deprecated use end_time instead */
  deadline?: string | null;
  /** @deprecated use end_time instead */
  taskEndTime?: string;
  /** @deprecated use repeat_start instead */
  startDate?: string;
  /** @deprecated use repeat_end instead */
  endDate?: string;
}

// 数据库Task类型
type DatabaseTask = Database['public']['Tables']['tasks']['Row'];

// 编辑任务的状态类型（简化UI字段）
interface EditTaskState {
  title?: string;
  description?: string;
  taskType?: 'daily' | 'habit' | 'special';
  points?: number;
  requiresProof?: boolean;
  
  // 🎯 统一的时间字段
  start_time?: string;        // 统一的开始时间
  end_time?: string;          // 统一的结束时间
  repeat_start?: string;      // 重复开始日期
  repeat_end?: string;        // 重复结束日期
  
  // UI控制字段（将逐步分离）
  isUnlimited?: boolean;      // UI: 是否不限时任务
  repeat?: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'; // UI: 重复频率选择
  endRepeat?: 'never' | 'on_date'; // UI: 结束重复方式
  
  // 连续任务字段
  consecutiveCount?: number;
  
  // 🎯 习惯任务字段
  duration?: '21days' | '1month' | '6months' | '1year';
  
  // 🔧 向后兼容字段（标记为废弃）
  /** @deprecated use start_time instead */
  taskStartTime?: string;
  /** @deprecated use end_time instead */
  taskEndTime?: string;
  /** @deprecated use repeat_start instead */
  repeatStartDate?: string;
  /** @deprecated use repeat_end instead */
  endRepeatDate?: string;
  /** @deprecated removed - calculated field */
  taskTimeStart?: string;
  /** @deprecated removed - calculated field */
  taskTimeEnd?: string;
}

interface TaskBoardProps {
  currentUser?: string | null;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [view, setView] = useState<'published' | 'assigned' | 'available'>('published');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [publishedPage, setPublishedPage] = useState<string>('active'); // 添加分页状态
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'daily' as 'daily' | 'habit' | 'special',
    points: 50,
    requiresProof: false,
    
    // 🎯 统一的时间字段
    start_time: '',       // 统一的开始时间
    end_time: '',         // 统一的结束时间
    repeat_start: '',     // 重复开始日期
    repeat_end: '',       // 重复结束日期
    
    // UI控制字段
    isUnlimited: false,   // UI: 是否不限时任务
    repeat: 'never' as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    endRepeat: 'never' as 'never' | 'on_date',
    
    // 🎯 习惯任务字段
    duration: '21days' as '21days' | '1month' | '6months' | '1year', // 习惯任务持续时间
    consecutiveCount: 7,  // 默认需要连续7次
    
    // 🔧 向后兼容字段（将逐步移除）
    taskStartTime: '',    // @deprecated use start_time
    taskEndTime: '',      // @deprecated use end_time
    repeatStartDate: '',  // @deprecated use repeat_start
    endRepeatDate: '',    // @deprecated use repeat_end
    taskTimeStart: '',    // @deprecated removed
    taskTimeEnd: ''       // @deprecated removed
  });

  // UI辅助状态已简化
  
  // 数据库相关状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  
  // 🎯 习惯任务相关状态
  const [userHabitChallenges, setUserHabitChallenges] = useState<(PersonalHabitChallenge & { task: any })[]>([]);
  const [habitChallengesLoaded, setHabitChallengesLoaded] = useState(false);
  
  // 调试信息
  console.log('📋 TaskBoard 加载状态:', { loading, tasksLoaded, user: !!user, tasksCount: tasks.length });
  const [userMap, setUserMap] = useState<{[id: string]: string}>({});

  // 🎯 工具函数
  // 检查任务是否已过期
  const isTaskOverdue = (task: Task): boolean => {
    const deadline = task.end_time || task.deadline;
    if (!deadline) return false;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
  };
  
  // 手动刷新功能
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 模拟API开关
  const [useMockApi, setUseMockApi] = useState(false);
  
  // 编辑任务状态
  const [isEditing, setIsEditing] = useState(false);
  const [editTask, setEditTask] = useState<EditTaskState>({});
  
  // 计算持续时间（天数）
  const calculateDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 包含开始日期
    return diffDays > 0 ? diffDays : 0;
  };

  // 根据开始日期和持续时间计算结束日期
  const calculateEndDate = (startDate: string, duration: number): string => {
    if (!startDate || duration <= 0) return '';
    const start = new Date(startDate);
    start.setDate(start.getDate() + duration - 1); // -1 因为开始日期算第一天
    return start.toISOString().split('T')[0];
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await reloadTasks();
      console.log('🔄 TaskBoard 手动刷新完成');
    } catch (error) {
      console.error('🔄 TaskBoard 手动刷新失败:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // 最少显示0.5秒刷新状态
    }
  };



  // 计算两个日期之间的持续时间标签（用于显示）
  const getDurationLabel = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return '--';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '--';
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 25) return '21天';
    if (diffDays <= 35) return '1个月';
    if (diffDays <= 200) return '6个月';
    return '1年';
  };


  // 数据库任务转换为前端Task格式（更新为统一字段）
  const convertDatabaseTaskToTask = (dbTask: DatabaseTask): Task => {
    // 确保始终使用display_name
    const creatorName = userMap[dbTask.creator_id] || dbTask.creator_id;
    const assigneeName = dbTask.assignee_id ? (userMap[dbTask.assignee_id] || dbTask.assignee_id) : undefined;
    
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      
      // 🎯 统一的时间字段映射
      start_time: dbTask.task_start_time || undefined,
      end_time: dbTask.deadline || undefined,
      repeat_start: dbTask.start_date || undefined,
      repeat_end: dbTask.end_date || undefined,
      
      points: dbTask.points,
      status: dbTask.status as Task['status'],
      assignee: assigneeName,
      creator: creatorName,
      createdAt: dbTask.created_at,
      requiresProof: dbTask.requires_proof,
      proof: dbTask.proof_url || undefined,
      taskType: dbTask.task_type as Task['taskType'],
      repeatType: dbTask.repeat_type as Task['repeatType'],
      reviewComment: dbTask.review_comment || undefined,
      submittedAt: dbTask.submitted_at || undefined,
      
      // 重复性任务字段
      repeatFrequency: dbTask.repeat_frequency as Task['repeatFrequency'],
      repeatTime: dbTask.repeat_time || undefined,
      repeatWeekdays: dbTask.repeat_weekdays || undefined,
      
      // 连续任务字段（数据库中还不存在，先设为undefined）
      consecutiveCount: undefined, // TODO: 添加到数据库后映射
      currentStreak: undefined,    // TODO: 添加到数据库后映射
      streakStartDate: undefined,  // TODO: 添加到数据库后映射
      completionRecord: undefined, // TODO: 添加到数据库后映射
      
      // 🔧 向后兼容字段（保持现有代码工作）
      deadline: dbTask.deadline,
      taskStartTime: dbTask.task_start_time || undefined,
      taskEndTime: dbTask.task_end_time || undefined,
      startDate: dbTask.start_date || undefined,
      endDate: dbTask.end_date || undefined
    };
  };

  // 加载情侣关系ID和用户映射
  useEffect(() => {
    const loadCoupleData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 加载情侣关系
        const coupleData = await userService.getCoupleRelation(user.id);
        if (coupleData) {
          setCoupleId(coupleData.id);
        }

        // 加载用户映射
        const { data: usersData } = await supabase
          .from('user_profiles')
          .select('id, display_name, username');
        
        if (usersData) {
          const mapping: {[id: string]: string} = {};
          usersData.forEach(userData => {
            mapping[userData.id] = userData.display_name || userData.username;
          });
          setUserMap(mapping);

        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoupleData();
  }, [user]);

  // 加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      if (!coupleId) {
        // 不要立即设置为空数组，保持加载状态
        return;
      }

      // 检查用户映射是否已加载
      if (Object.keys(userMap).length === 0) {
        return;
      }

      try {
        const dbTasks = await taskService.getCoupleTasksOld(coupleId);
        const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
        setTasks(convertedTasks);
        setTasksLoaded(true);
      } catch (error) {
        console.error('❌ 加载任务失败:', error);
        setTasks([]);
        setTasksLoaded(true);
      }
    };

    if (!loading && coupleId) {
      if (Object.keys(userMap).length > 0) {
        loadTasks();
      } else {

      }
    }
  }, [coupleId, loading, userMap]);

  // 🎯 加载用户习惯挑战
  useEffect(() => {
    if (user?.id && !habitChallengesLoaded) {
      loadUserHabitChallenges();
    }
  }, [user?.id, habitChallengesLoaded]);

  // 获取当前用户名称（显示用）
  const getCurrentUserName = () => {
    // 优先使用UserContext中的display_name
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    
    // 回退到props传入的currentUser
    if (currentUser) {
      return currentUser;
    }
    
    // 最后回退到默认值
    return 'User';
  };

  // 获取当前用户ID（数据库操作用）
  const getCurrentUserId = () => {
    return user?.id || '';
  };

  const currentUserName = getCurrentUserName();
  const currentUserId = getCurrentUserId();
  


  // 🎯 加载用户的习惯挑战
  const loadUserHabitChallenges = async () => {
    if (!user?.id) {
      console.log('⚠️ 用户信息不完整，跳过加载习惯挑战');
      return;
    }

    try {
      console.log('🎯 开始加载用户习惯挑战...');
      const challenges = await habitTaskService.getUserHabitChallenges(user.id);
      console.log('🎯 习惯挑战加载完成:', challenges?.length || 0, '个挑战');
      
      setUserHabitChallenges(challenges || []);
      setHabitChallengesLoaded(true);
    } catch (error) {
      console.error('❌ 加载习惯挑战失败:', error);
      setHabitChallengesLoaded(true); // 即使失败也标记为已加载，避免无限重试
    }
  };

  // 重新加载任务数据的函数
  const reloadTasks = async () => {

    if (!coupleId) {
      return;
    }

    // 确保用户映射已加载
    if (Object.keys(userMap).length === 0) {

      try {
        const { data: usersData } = await supabase
          .from('user_profiles')
          .select('id, display_name, username');
        
        if (usersData) {
          const mapping: {[id: string]: string} = {};
          usersData.forEach(userData => {
            mapping[userData.id] = userData.display_name || userData.username;
          });
          setUserMap(mapping);

        }
      } catch (error) {
        console.error('❌ 重新加载用户映射失败:', error);
        return; // 如果用户映射加载失败，不继续加载任务
      }
    }

    try {
      const dbTasks = await taskService.getCoupleTasksOld(coupleId);
      const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
      setTasks(convertedTasks);
      setTasksLoaded(true);
    } catch (error) {
      console.error('❌ 重新加载任务失败:', error);
      setTasksLoaded(true);
    }
  };

  // 🎯 习惯任务相关处理函数
  const handleJoinHabitChallenge = async (taskId: string) => {
    if (!user?.id) {
      alert('请先登录');
      return;
    }

    try {
      await habitTaskService.joinHabitChallenge(taskId, user.id);
      alert('成功加入习惯挑战！');
      
      // 重新加载用户的习惯挑战
      setHabitChallengesLoaded(false);
      await loadUserHabitChallenges();
    } catch (error: any) {
      console.error('加入习惯挑战失败:', error);
      alert(`加入挑战失败: ${error.message}`);
    }
  };

  const handleDailyCheckIn = async (challengeId: string, notes?: string) => {
    try {
      await habitTaskService.dailyCheckIn(challengeId, notes);
      alert('打卡成功！');
      
      // 重新加载用户的习惯挑战
      setHabitChallengesLoaded(false);
      await loadUserHabitChallenges();
    } catch (error: any) {
      console.error('打卡失败:', error);
      alert(`打卡失败: ${error.message}`);
    }
  };

  const handleAbandonChallenge = async (challengeId: string) => {
    if (!confirm('确定要放弃这个挑战吗？')) {
      return;
    }

    try {
      await habitTaskService.abandonChallenge(challengeId);
      alert('已放弃挑战');
      
      // 重新加载用户的习惯挑战
      setHabitChallengesLoaded(false);
      await loadUserHabitChallenges();
    } catch (error: any) {
      console.error('放弃挑战失败:', error);
      alert(`操作失败: ${error.message}`);
    }
  };

  // 优化版数据库任务操作辅助函数
  const updateTaskInDatabase = async (taskId: string, updates: Partial<Task>) => {
    try {
      // 1. 准备数据库更新数据
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assignee !== undefined) dbUpdates.assignee_id = updates.assignee;
      if (updates.proof !== undefined) dbUpdates.proof_url = updates.proof;
      if (updates.reviewComment !== undefined) dbUpdates.review_comment = updates.reviewComment;
      if (updates.submittedAt) dbUpdates.submitted_at = updates.submittedAt;

      // 2. 检查任务是否存在（防止无效操作）
      const taskBefore = tasks.find(t => t.id === taskId);
      if (!taskBefore) {
        throw new Error(`找不到ID为 ${taskId} 的任务`);
      }

      // 3. 更新数据库
      await taskService.updateTask(taskId, dbUpdates);

      // 4. 立即更新本地状态（乐观更新）
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        )
      );

      // 5. 发布全局事件，通知其他组件
      globalEventService.emit(GlobalEvents.TASKS_UPDATED);

      console.log('✅ 任务更新完成');

    } catch (error: any) {
      console.error('❌ 更新任务失败:', error?.message);
      
      // 6. 如果失败，重新加载数据以确保一致性
      try {
        await reloadTasks();
      } catch (reloadError) {
        console.error('❌ 重新加载任务失败:', reloadError);
      }
      
      alert(`更新任务失败: ${error?.message || '未知错误'}，请重试`);
      throw error;
    }
  };

  // 奖励任务积分
  const awardTaskPoints = async (task: Task, userId: string) => {
    if (!coupleId || !userId) return;
    
    try {
      const taskTypeDescription = task.repeatType === 'repeat' ? '重复性任务' : '一次性任务';
      const description = `完成${taskTypeDescription}：${task.title}`;
      
      const success = await pointService.addTransaction(
        userId,
        coupleId,
        task.points,
        'task_completion',
        description,
        task.id
      );
      
      if (success) {
        const pointsMessage = task.repeatType === 'repeat' 
          ? `✅ 积分奖励成功: +${task.points} 积分/次 (${task.title})`
          : `✅ 积分奖励成功: +${task.points} 积分 (${task.title})`;
        console.log(pointsMessage);
        
        // 发布全局事件通知积分更新
        globalEventService.emit(GlobalEvents.USER_PROFILE_UPDATED);
      } else {
        console.error('❌ 积分奖励失败:', task.title);
      }
    } catch (error) {
      console.error('❌ 积分奖励出错:', error);
    }
  };

  // 任务操作函数
  const handleAcceptTask = async (taskId: string) => {
    try {
      await updateTaskInDatabase(taskId, {
        assignee: currentUserId,  // 使用用户ID而不是显示名称
        status: 'assigned'
      });
    } catch (error: any) {
      console.error('❌ 领取任务失败:', error?.message);
      throw error;
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await updateTaskInDatabase(taskId, {
        status: 'in_progress'
      });
    } catch (error: any) {
      console.error('❌ 开始任务失败:', error?.message);
      throw error;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    // 找到任务以检查是否需要凭证
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 检查任务是否过期，如果过期则移动到abandoned状态
    if (isTaskOverdue(task)) {
      await updateTaskInDatabase(taskId, { status: 'abandoned' });
      return;
    }

    if (task.requiresProof) {
      // 如果需要凭证，任务进入待审核状态
      await updateTaskInDatabase(taskId, { 
        status: 'pending_review',
        submittedAt: new Date().toISOString()
      });
    } else {
      // 不需要凭证的任务直接完成并奖励积分
      await updateTaskInDatabase(taskId, { 
        status: 'completed',
        submittedAt: new Date().toISOString()
      });
      
      // 奖励积分给完成任务的用户
      await awardTaskPoints(task, currentUserId);
    }
  };

    const handleReviewTask = async (taskId: string, approved: boolean, comment?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (approved) {
      await updateTaskInDatabase(taskId, { 
        status: 'completed',
        reviewComment: comment 
      });
      
      // 审核通过时奖励积分（如果任务被分配给其他用户）
      if (task.assignee && currentUserId !== task.assignee) {
        // 这里需要获取assignee的实际ID，因为task.assignee可能是显示名
        const assigneeId = Object.keys(userMap).find(id => userMap[id] === task.assignee) || task.assignee;
        await awardTaskPoints(task, assigneeId);
      }
    } else {
      await updateTaskInDatabase(taskId, { 
        status: 'assigned',
        reviewComment: comment 
      });
    }
  };

  // 放弃任务
  const handleAbandonTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 只有assigned状态的任务才能手动放弃
    if (task.status === 'assigned') {
      console.log('🚫 放弃任务:', { taskId });
      await updateTaskInDatabase(taskId, { 
        status: 'recruiting',
        assignee: null  // 使用null而不是undefined
      });
    }
  };

  // 重新发布任务
  const handleRepublishTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'abandoned') return;
    
    console.log('📢 重新发布任务:', { taskId });
    await updateTaskInDatabase(taskId, { 
      status: 'recruiting',
      assignee: null,  // 使用null而不是undefined
      proof: null,
      reviewComment: null
    });
  };

  // 提交凭证
  const handleSubmitProof = async (taskId: string, proof: string) => {
    await updateTaskInDatabase(taskId, { 
      proof,
      status: 'pending_review',
      submittedAt: new Date().toISOString()
    });
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    // 根据任务类型映射到新的字段结构
    const editData: any = {
      title: task.title,
      description: task.description,
      points: task.points,
      taskType: task.taskType,
      requiresProof: task.requiresProof,
    };

    // 映射重复频率
    if (task.repeatType === 'once') {
      editData.repeat = 'never';
      // 一次性任务时间映射
      if (task.taskStartTime) {
        editData.taskStartTime = new Date(task.taskStartTime).toISOString().slice(0, 16);
      }
      if (task.taskEndTime) {
        editData.taskEndTime = new Date(task.taskEndTime).toISOString().slice(0, 16);
      } else if (task.deadline) {
        // 如果没有taskEndTime，使用deadline
        editData.taskEndTime = new Date(task.deadline).toISOString().slice(0, 16);
      }
    } else {
      editData.repeat = task.repeatFrequency || 'daily';
      // 重复任务字段映射
      editData.repeatStartDate = task.startDate;
      editData.endRepeat = task.endDate ? 'on_date' : 'never';
      editData.endRepeatDate = task.endDate;
      
      // 映射任务时间段
      if (task.repeatTime) {
        editData.taskTimeStart = task.repeatTime;
        // 如果task_end_time包含时间信息，提取时间部分
        if (task.taskEndTime) {
          const endTime = new Date(task.taskEndTime);
          if (endTime.getFullYear() === 1970) {
            // 固定日期格式，提取时间
            editData.taskTimeEnd = endTime.toTimeString().slice(0, 5);
          }
        }
      }
    }

    setEditTask(editData);
    setIsEditing(true);
  };

  // 保存编辑的任务
  const handleSaveEdit = async () => {
    if (!selectedTask) return;
    
    // 验证必填字段
    if (!editTask.title?.trim()) {
      alert('请填写任务标题');
      return;
    }
    
    if (!editTask.taskType) {
      alert('请选择任务类型');
      return;
    }
    
    if (!editTask.repeat) {
      alert('请选择重复频率');
      return;
    }
    
    if (!editTask.points || editTask.points < 1) {
      alert('请填写有效的积分奖励（至少1分）');
      return;
    }
    
    // 验证时间字段
    if (editTask.repeat === 'never') {
      // 一次性任务：验证结束时间
      if (!editTask.taskEndTime) {
        alert('请选择任务结束时间');
        return;
      }
      
      // 如果有开始时间，验证开始时间要早于结束时间
      if (editTask.taskStartTime) {
        const startTime = new Date(editTask.taskStartTime);
        const endTime = new Date(editTask.taskEndTime);
        if (startTime >= endTime) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      }
    } else {
      // 重复任务：验证开始日期
      if (!editTask.repeatStartDate) {
        alert('请选择重复任务的循环开始日期');
        return;
      }
      
      // 验证结束重复设置
      if (editTask.endRepeat === 'on_date' && !editTask.endRepeatDate) {
        alert('请选择结束重复的日期');
        return;
      }
      
      if (editTask.endRepeat === 'on_date') {
        const startDate = new Date(editTask.repeatStartDate!);
        const endDate = new Date(editTask.endRepeatDate!);
        if (endDate <= startDate) {
          alert('结束重复日期必须晚于开始日期');
          return;
        }
      }
      
      // 如果指定了任务时间段，验证时间段有效性
      if (editTask.taskTimeStart && editTask.taskTimeEnd) {
        const startTime = editTask.taskTimeStart;
        const endTime = editTask.taskTimeEnd;
        if (startTime >= endTime) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      } else if (editTask.taskTimeStart && !editTask.taskTimeEnd) {
        alert('指定了开始时间，请同时指定结束时间');
        return;
      } else if (!editTask.taskTimeStart && editTask.taskTimeEnd) {
        alert('指定了结束时间，请同时指定开始时间');
        return;
      }
    }

    try {
      // 准备数据库更新数据
      const dbUpdates: any = {
        title: editTask.title.trim(),
        description: editTask.description || '',
        points: editTask.points || 50,
        task_type: editTask.taskType,
        requires_proof: editTask.requiresProof || false,
      };

      // 根据任务类型添加相应字段
      if (editTask.repeat === 'never') {
        // 一次性任务
        dbUpdates.repeat_type = 'once';
        dbUpdates.deadline = new Date(editTask.taskEndTime!).toISOString();
        
        // 如果有开始时间，保存到task_start_time字段
        if (editTask.taskStartTime) {
          dbUpdates.task_start_time = new Date(editTask.taskStartTime).toISOString();
        }
        
        // 保存结束时间到task_end_time字段
        dbUpdates.task_end_time = new Date(editTask.taskEndTime!).toISOString();
      } else {
        // 重复任务
        dbUpdates.repeat_type = 'repeat';
        dbUpdates.repeat_frequency = editTask.repeat;
        
        // 设置循环开始日期
        dbUpdates.start_date = editTask.repeatStartDate;
        
        // 设置结束日期
        if (editTask.endRepeat === 'on_date') {
          dbUpdates.end_date = editTask.endRepeatDate;
          dbUpdates.deadline = `${editTask.endRepeatDate}T23:59:59.000Z`;
        } else {
          // 默认设置结束日期为3年后
          const startDate = new Date(editTask.repeatStartDate!);
          const threeYearsLater = new Date(startDate);
          threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
          const endDateStr = threeYearsLater.toISOString().split('T')[0];
          dbUpdates.end_date = endDateStr;
          dbUpdates.deadline = `${endDateStr}T23:59:59.000Z`;
        }
        
        // 如果指定了任务时间段，保存时间信息
        if (editTask.taskTimeStart && editTask.taskTimeEnd) {
          // 将开始时间保存到repeat_time字段（兼容现有数据库结构）
          dbUpdates.repeat_time = editTask.taskTimeStart;
          // 将结束时间保存到task_end_time字段
          dbUpdates.task_end_time = `1970-01-01T${editTask.taskTimeEnd}:00.000Z`; // 使用固定日期+时间
        }
      }

      await taskService.updateTask(selectedTask.id, dbUpdates);
      
      // 刷新任务列表
      await reloadTasks();
      
      // 关闭编辑模式
      setIsEditing(false);
                                        handleCloseTaskDetail();
      
      // 触发全局事件
      globalEventService.emit(GlobalEvents.TASKS_UPDATED);
      
      alert('任务更新成功！');
    } catch (error: any) {
      console.error('❌ 更新任务失败:', error);
      alert(`更新任务失败: ${error?.message || '未知错误'}`);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTask({});
  };

  // 统一的关闭任务详情函数
  const handleCloseTaskDetail = () => {
    setIsEditing(false);
    setEditTask({});
    setSelectedTask(null);
  };

  // 自动将过期任务移动到abandoned状态
  const moveOverdueTasksToAbandoned = async () => {
    const overdueTasksUpdates = tasks.filter(task => {
      // 检查各种状态的过期任务
          return (
        (task.status === 'in_progress' && isTaskOverdue(task)) ||
        (task.status === 'assigned' && isTaskOverdue(task)) ||
        (task.status === 'recruiting' && isTaskOverdue(task))
      );
    });
    
    // 批量更新过期任务
    for (const task of overdueTasksUpdates) {
      await updateTaskInDatabase(task.id, { status: 'abandoned' });
    }
    
    if (overdueTasksUpdates.length > 0) {

    }
  };

  // 在组件加载时检查并移动过期任务
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      moveOverdueTasksToAbandoned();
    }
  }, [loading, tasks]);

  // 订阅全局事件，响应其他组件的数据更新
  useEffect(() => {
    // 订阅事件更新（日历可能影响任务显示）
    const unsubscribeEvents = globalEventService.subscribe(GlobalEvents.EVENTS_UPDATED, () => {
      console.log('📅 TaskBoard 收到事件更新通知');
      // 任务页面可能需要响应事件变化，暂时不做处理
    });

    // 订阅任务数据更新（包括其他用户的操作）
    const unsubscribeTasks = globalEventService.subscribe(GlobalEvents.TASKS_UPDATED, () => {
      console.log('📋 TaskBoard 收到任务更新通知（可能来自其他用户）');
      // 如果任务已经加载过，则自动刷新
      if (tasksLoaded && !loading) {
        handleRefresh();
      }
    });

    // 订阅用户资料更新
    const unsubscribeProfile = globalEventService.subscribe(GlobalEvents.USER_PROFILE_UPDATED, () => {
      console.log('👤 TaskBoard 收到用户资料更新通知');
      // 可能需要重新加载用户映射
    });

    return () => {
      unsubscribeEvents();
      unsubscribeTasks();
      unsubscribeProfile();
    };
  }, []);

  // 创建新任务
  const handleCreateTask = async () => {
    // 验证必填字段
    if (!newTask.title.trim()) {
      alert('请填写任务标题');
      return;
    }

    // 🎯 修正后的时间验证逻辑
    if (!newTask.isUnlimited) {
      if (newTask.repeat === 'never') {
        // 一次性任务：开始时间和结束时间至少要有一个
        const hasStartTime = Boolean(newTask.start_time);
        const hasEndTime = Boolean(newTask.end_time);
        
        if (!hasStartTime && !hasEndTime) {
          alert('限时任务必须设置开始时间或结束时间（或两者都设置）');
          return;
        }
        
        const now = new Date();
        
        // 验证开始时间（如果有）
        if (hasStartTime) {
          const startTime = new Date(newTask.start_time!);
          if (startTime <= now) {
            alert('任务开始时间不能是过去时间');
            return;
          }
        }
        
        // 验证结束时间（如果有）
        if (hasEndTime) {
          const endTime = new Date(newTask.end_time!);
          if (endTime <= now) {
            alert('任务结束时间不能是过去时间');
            return;
          }
        }
        
        // 如果同时有开始和结束时间，验证时间顺序
        if (hasStartTime && hasEndTime) {
          const startTime = new Date(newTask.start_time!);
          const endTime = new Date(newTask.end_time!);
          if (startTime >= endTime) {
            alert('任务开始时间必须早于结束时间');
            return;
          }
        }
                  } else {
        // 重复任务：循环开始日期必填
        if (!newTask.repeat_start) {
          alert('请选择重复任务的循环开始日期');
          return;
        }
        
        // 验证开始日期不能是过去
        const startDate = new Date(newTask.repeat_start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          alert('循环开始日期不能是过去日期');
          return;
        }
        
        // 验证结束重复设置
        if (newTask.endRepeat === 'on_date' && !newTask.repeat_end) {
          alert('请选择结束重复的日期');
          return;
        }
        
        if (newTask.endRepeat === 'on_date' && newTask.repeat_end) {
          const endDate = new Date(newTask.repeat_end);
          if (endDate <= startDate) {
            alert('结束重复日期必须晚于开始日期');
            return;
          }
        }
      }
      
      // 如果指定了任务时间段，验证时间段有效性
      if (newTask.taskTimeStart && newTask.taskTimeEnd) {
        const startTime = newTask.taskTimeStart;
        const endTime = newTask.taskTimeEnd;
        if (startTime >= endTime) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      } else if (newTask.taskTimeStart && !newTask.taskTimeEnd) {
        alert('指定了开始时间，请同时指定结束时间');
        return;
      } else if (!newTask.taskTimeStart && newTask.taskTimeEnd) {
        alert('指定了结束时间，请同时指定开始时间');
        return;
      }
    } // 结束 if (!newTask.isUnlimited)

    if (user && coupleId) {
      try {
        // 构建数据库任务数据
        const dbTaskData: any = {
          title: newTask.title,
          description: newTask.description,
          points: newTask.points,
          status: 'recruiting' as const,
          couple_id: coupleId,
          creator_id: user.id,
          requires_proof: newTask.requiresProof,
          task_type: newTask.taskType,
          created_at: new Date().toISOString()
        };

        // 🎯 习惯任务特殊处理
        if (newTask.taskType === 'habit') {
          dbTaskData.repeat_type = 'repeat';
          dbTaskData.repeat_frequency = 'daily'; // 习惯任务固定为每日
          dbTaskData.duration = newTask.duration; // 习惯任务持续时间
          dbTaskData.start_date = newTask.repeat_start;
          dbTaskData.end_date = newTask.repeat_end;
          
          // 习惯任务不设置deadline，由个人挑战管理
          dbTaskData.deadline = null;
          
          // 验证习惯任务的时间设置
          if (!newTask.repeat_start || !newTask.repeat_end) {
            alert('习惯任务必须设置开始和结束日期');
            return;
          }
          
          // 验证时间范围是否足够完成挑战
          const startDate = new Date(newTask.repeat_start);
          const endDate = new Date(newTask.repeat_end);
          const durationDays = newTask.duration === '21days' ? 21 : 
                              newTask.duration === '1month' ? 30 :
                              newTask.duration === '6months' ? 180 : 365;
          
          const availableDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          if (availableDays < durationDays) {
            alert(`时间范围不足：需要${durationDays}天，但只有${availableDays}天可用`);
            return;
          }
        } else {
          // 根据重复性设置任务类型
        if (newTask.repeat === 'never') {
          // 一次性任务
          dbTaskData.repeat_type = 'once';
          
          if (newTask.isUnlimited) {
            // 一次性不限时任务
            dbTaskData.deadline = null;
            dbTaskData.task_start_time = null;
            dbTaskData.task_end_time = null;
          } else {
            // 🎯 一次性限时任务 - 使用新的时间逻辑
            const hasStartTime = Boolean(newTask.start_time);
            const hasEndTime = Boolean(newTask.end_time);
            
            // 保存开始时间（如果有）
            if (hasStartTime) {
              dbTaskData.task_start_time = new Date(newTask.start_time!).toISOString();
            } else {
              dbTaskData.task_start_time = null;
            }
            
            // 保存结束时间（如果有）
            if (hasEndTime) {
              dbTaskData.deadline = new Date(newTask.end_time!).toISOString();
              dbTaskData.task_end_time = new Date(newTask.end_time!).toISOString();
            } else {
              dbTaskData.deadline = null;
              dbTaskData.task_end_time = null;
            }
          }
        } else {
          // 普通重复性任务
          dbTaskData.repeat_type = 'repeat';
          dbTaskData.repeat_frequency = newTask.repeat;
          
          // 设置循环开始日期
          dbTaskData.start_date = newTask.repeat_start;
          
          if (newTask.isUnlimited) {
            // 重复性不限时任务
            dbTaskData.deadline = null;
            
            // 如果设置了连续次数，保存连续任务相关字段
            if (newTask.consecutiveCount && newTask.consecutiveCount > 0) {
              dbTaskData.consecutive_count = newTask.consecutiveCount;
              dbTaskData.current_streak = 0;
              dbTaskData.completion_record = JSON.stringify([]);
            }
            
            // 设置结束日期（用于控制重复周期的结束，但不作为deadline）
            if (newTask.endRepeat === 'on_date') {
              dbTaskData.end_date = newTask.repeat_end;
            } else {
              // 默认设置结束日期为3年后
              const startDate = new Date(newTask.repeat_start!);
              const threeYearsLater = new Date(startDate);
              threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
              const endDateStr = threeYearsLater.toISOString().split('T')[0];
              dbTaskData.end_date = endDateStr;
            }
          } else {
            // 重复性限时任务
            // 设置结束日期
            if (newTask.endRepeat === 'on_date') {
              dbTaskData.end_date = newTask.repeat_end;
              dbTaskData.deadline = `${newTask.repeat_end}T23:59:59.000Z`;
            } else {
              // 默认设置结束日期为3年后
              const startDate = new Date(newTask.repeat_start!);
              const threeYearsLater = new Date(startDate);
              threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
              const endDateStr = threeYearsLater.toISOString().split('T')[0];
              dbTaskData.end_date = endDateStr;
              dbTaskData.deadline = `${endDateStr}T23:59:59.000Z`;
            }
          }
          
          // 如果指定了任务时间段，保存时间信息
          if (newTask.taskTimeStart && newTask.taskTimeEnd) {
            // 将开始时间保存到repeat_time字段（兼容现有数据库结构）
            dbTaskData.repeat_time = newTask.taskTimeStart;
            // 将结束时间保存到task_end_time字段
            dbTaskData.task_end_time = `1970-01-01T${newTask.taskTimeEnd}:00.000Z`; // 使用固定日期+时间
          }
        }
        }

        console.log('🚀 创建任务数据:', dbTaskData);
        await taskService.createTask(dbTaskData);
        await reloadTasks(); // 重新加载数据
        
        // 发布全局事件，通知其他组件任务数据已更新
        globalEventService.emit(GlobalEvents.TASKS_UPDATED);

        console.log('✅ 任务创建成功');

      } catch (error) {
        console.error('❌ 创建任务失败:', error);
        alert('创建任务失败，请重试');
        return;
      }
    } else {
      alert('用户未登录或缺少情侣关系信息');
      return;
    }

            // 重置表单
        setNewTask({
          title: '',
          description: '',
          taskType: 'daily',
          points: 50,
          requiresProof: false,
          // 🎯 统一的时间字段
          start_time: '',
          end_time: '',
          repeat_start: '',
          repeat_end: '',
          // UI控制字段
          isUnlimited: false,
          repeat: 'never',
          endRepeat: 'never',
          // 🎯 习惯任务字段
          duration: '21days',
          // 连续任务字段
          consecutiveCount: 7,
          // 🔧 向后兼容字段
          taskStartTime: '',
          taskEndTime: '',
          repeatStartDate: '',
          endRepeatDate: '',
          taskTimeStart: '',
          taskTimeEnd: ''
        });
        setShowAddForm(false);
  };

  // 🎯 渲染任务时间字段（修正后的逻辑）
  const renderTaskTimeFields = () => {
    // 🎯 习惯任务的特殊UI
    if (newTask.taskType === 'habit') {
      return (
        <div className="space-y-4">
          <div className={`text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted' : 
            theme === 'modern' ? 'text-slate-600' : 'text-gray-600'
          }`}>
            {theme === 'pixel' ? 'HABIT_CHALLENGE_SETTINGS' : 
             theme === 'modern' ? 'Habit Challenge Settings' : 
             '习惯挑战设置'}
          </div>

          {/* 挑战持续时间 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'CHALLENGE_DURATION' : theme === 'modern' ? 'Challenge Duration' : '挑战持续时间'}
            description={theme === 'pixel' ? 'HOW_MANY_DAYS_NEEDED' : theme === 'modern' ? 'How many days need to be completed?' : '需要完成多少天？'}
          >
            <ThemeSelect
              value={newTask.duration}
              onChange={(e) => setNewTask(prev => ({ ...prev, duration: e.target.value as '21days' | '1month' | '6months' | '1year' }))}
            >
              <option value="21days">{theme === 'pixel' ? '21_DAYS' : theme === 'modern' ? '21 Days' : '21天'}</option>
              <option value="1month">{theme === 'pixel' ? '30_DAYS' : theme === 'modern' ? '30 Days (1 Month)' : '30天（1个月）'}</option>
              <option value="6months">{theme === 'pixel' ? '180_DAYS' : theme === 'modern' ? '180 Days (6 Months)' : '180天（6个月）'}</option>
              <option value="1year">{theme === 'pixel' ? '365_DAYS' : theme === 'modern' ? '365 Days (1 Year)' : '365天（1年）'}</option>
            </ThemeSelect>
          </ThemeFormField>

          {/* 任务开始日期 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_START_DATE' : theme === 'modern' ? 'Task Start Date' : '任务开始日期'}
            description={theme === 'pixel' ? 'WHEN_USERS_CAN_JOIN' : theme === 'modern' ? 'When can users start joining this challenge?' : '用户什么时候可以开始加入这个挑战？'}
          >
            <ThemeInput
              type="date"
              value={newTask.repeat_start}
              onChange={(e) => setNewTask(prev => ({ ...prev, repeat_start: e.target.value }))}
            />
          </ThemeFormField>

          {/* 任务截止日期 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_END_DATE' : theme === 'modern' ? 'Task End Date' : '任务截止日期'}
            description={theme === 'pixel' ? 'ALL_CHALLENGES_MUST_FINISH' : theme === 'modern' ? 'All personal challenges must finish by this date' : '所有个人挑战必须在此日期前完成'}
          >
            <ThemeInput
              type="date"
              value={newTask.repeat_end}
              onChange={(e) => setNewTask(prev => ({ ...prev, repeat_end: e.target.value }))}
            />
          </ThemeFormField>

          {/* 显示计算的最晚领取日期 */}
          {newTask.repeat_start && newTask.repeat_end && (
            <div className={`p-3 rounded-lg ${
              theme === 'pixel' ? 'bg-pixel-bg border border-pixel-border' :
              theme === 'modern' ? 'bg-slate-50 border border-slate-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`text-sm font-medium ${
                theme === 'pixel' ? 'text-pixel-text' :
                theme === 'modern' ? 'text-slate-900' :
                'text-gray-900'
              }`}>
                {theme === 'pixel' ? 'CALCULATED_INFO' : theme === 'modern' ? 'Calculated Information' : '计算信息'}
              </div>
              <div className={`text-xs mt-1 ${
                theme === 'pixel' ? 'text-pixel-textMuted' :
                theme === 'modern' ? 'text-slate-600' :
                'text-gray-600'
              }`}>
                {(() => {
                  const startDate = new Date(newTask.repeat_start);
                  const endDate = new Date(newTask.repeat_end);
                  const durationDays = newTask.duration === '21days' ? 21 : 
                                      newTask.duration === '1month' ? 30 :
                                      newTask.duration === '6months' ? 180 : 365;
                  const latestJoinDate = calculateLatestJoinDate(newTask.repeat_end, durationDays);
                  const availableDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <>
                      <div>
                        {theme === 'pixel' ? 'LATEST_JOIN_DATE' : theme === 'modern' ? 'Latest join date' : '最晚领取日期'}: {latestJoinDate}
                      </div>
                      <div>
                        {theme === 'pixel' ? 'AVAILABLE_DAYS' : theme === 'modern' ? 'Available days' : '可用天数'}: {availableDays} 
                        {theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天'} 
                        ({theme === 'pixel' ? 'NEED' : theme === 'modern' ? 'need' : '需要'} {durationDays} 
                        {theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天'})
                      </div>
                      {availableDays < durationDays && (
                        <div className={theme === 'pixel' ? 'text-pixel-error' : theme === 'modern' ? 'text-red-600' : 'text-red-600'}>
                          ⚠️ {theme === 'pixel' ? 'TIME_NOT_ENOUGH' : theme === 'modern' ? 'Time range is not sufficient' : '时间范围不足'}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (newTask.repeat === 'never') {
      // 一次性任务：开始时间和结束时间都是可选的，但至少要有一个
      return (
        <div className="space-y-4">
          <div className={`text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted' : 
            theme === 'modern' ? 'text-slate-600' : 'text-gray-600'
          }`}>
            {theme === 'pixel' ? 'TIME_CONSTRAINT_OPTIONAL' : 
             theme === 'modern' ? 'Time constraints (optional): Set start time, end time, or both' : 
             '时间限制（可选）：可以设置开始时间、结束时间，或两者都设置'}
          </div>
          
          {/* 最早开始时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'EARLIEST_START_TIME' : theme === 'modern' ? 'Earliest Start Time' : '最早开始时间'}
            description={theme === 'pixel' ? 'WHEN_CAN_START' : theme === 'modern' ? 'When can this task be started? (Leave empty if anytime)' : '任务最早什么时候可以开始？（留空表示随时可以开始）'}
          >
            <ThemeInput
              type="datetime-local"
              value={newTask.start_time}
              onChange={(e) => setNewTask(prev => ({ ...prev, start_time: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>

          {/* 最晚结束时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'LATEST_END_TIME' : theme === 'modern' ? 'Latest End Time' : '最晚结束时间'}
            description={theme === 'pixel' ? 'WHEN_MUST_FINISH' : theme === 'modern' ? 'When must this task be finished? (Leave empty if no deadline)' : '任务最晚什么时候必须完成？（留空表示没有截止时间）'}
          >
            <ThemeInput
              type="datetime-local"
              value={newTask.end_time}
              onChange={(e) => setNewTask(prev => ({ ...prev, end_time: e.target.value }))}
              min={newTask.start_time || new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>
        </div>
      );
    } else {
      // 重复任务：循环开始日期（必填）+ 指定任务时间段（可选）
      return (
        <div className="space-y-4">
          {/* 循环开始日期（必填） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'REPEAT_START_DATE' : theme === 'modern' ? 'Repeat Start Date' : '循环开始日期'}
            required
            description={theme === 'pixel' ? 'WHEN_TO_START_REPEATING' : theme === 'modern' ? 'When should this recurring task start' : '重复任务从哪天开始循环'}
          >
            <ThemeInput
              type="date"
              value={newTask.repeat_start}
              onChange={(e) => setNewTask(prev => ({ ...prev, repeat_start: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </ThemeFormField>

          {/* 持续时间设置 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'DURATION' : theme === 'modern' ? 'Duration' : '持续时间'}
            description={theme === 'pixel' ? 'DAYS_AUTO_CALC_END_DATE' : theme === 'modern' ? 'Duration in days (will auto-calculate end date if specified)' : '持续天数（如填写将自动计算结束日期）'}
          >
            <ThemeInput
              type="number"
              value={newTask.consecutiveCount || ''}
              onChange={(e) => {
                const consecutiveCount = parseInt(e.target.value) || 7;
                setNewTask(prev => ({ ...prev, consecutiveCount }));
              }}
              placeholder={theme === 'pixel' ? 'ENTER_DAYS' : theme === 'modern' ? 'Enter days...' : '输入天数...'}
              min="1"
            />
          </ThemeFormField>

          {/* 结束重复设置 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'END_REPEAT' : theme === 'modern' ? 'End Repeat' : '结束重复'}
            required
          >
            <ThemeSelect
              value={newTask.endRepeat}
              onChange={(e) => setNewTask(prev => ({ ...prev, endRepeat: e.target.value as 'never' | 'on_date' }))}
            >
              <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不结束'}</option>
              <option value="on_date">{theme === 'pixel' ? 'ON_DATE' : theme === 'modern' ? 'On Date' : '在指定日期'}</option>
            </ThemeSelect>
          </ThemeFormField>

          {/* 结束日期选择（当选择"在指定日期"时显示） */}
          {newTask.endRepeat === 'on_date' && (
            <ThemeFormField
              label={theme === 'pixel' ? 'END_DATE' : theme === 'modern' ? 'End Date' : '结束日期'}
              required
            >
              <ThemeInput
                type="date"
                value={newTask.repeat_end}
                onChange={(e) => setNewTask(prev => ({ ...prev, repeat_end: e.target.value }))}
                min={newTask.repeat_start || new Date().toISOString().split('T')[0]}
              />
            </ThemeFormField>
          )}

          {/* 指定任务时间段（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_TIME_PERIOD' : theme === 'modern' ? 'Task Time Period' : '指定任务时间'}
            description={theme === 'pixel' ? 'OPTIONAL_ANY_TIME_IF_EMPTY' : theme === 'modern' ? 'Optional: Leave empty if task can be completed anytime during the day' : '可选：留空表示任务可以在当天任意时间提交'}
          >
            <div className="grid grid-cols-2 gap-3">
          <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'FROM' : theme === 'modern' ? 'From' : '开始时间'}
            </label>
                <ThemeInput
                  type="time"
                  value={newTask.taskTimeStart}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskTimeStart: e.target.value }))}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'TO' : theme === 'modern' ? 'To' : '结束时间'}
                </label>
                <ThemeInput
                  type="time"
                  value={newTask.taskTimeEnd}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskTimeEnd: e.target.value }))}
                />
              </div>
            </div>
          </ThemeFormField>
        </div>
      );
    }
  };

  // 渲染编辑任务的时间字段（根据repeat类型动态显示）
  const renderEditTaskTimeFields = () => {
    if ((editTask.repeat || 'never') === 'never') {
      // 一次性任务：任务开始时间（可选）+ 任务结束时间（必填）
      return (
        <div className="space-y-4">
          {/* 任务开始时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_START_TIME' : theme === 'modern' ? 'Task Start Time' : '任务开始时间'}
            description={theme === 'pixel' ? 'OPTIONAL_ANY_TIME_BEFORE_END' : theme === 'modern' ? 'Optional: Leave empty if task can be completed anytime before end time' : '可选：留空表示在结束时间前任意时间开始都可以'}
          >
            <ThemeInput
              type="datetime-local"
              value={editTask.taskStartTime || ''}
              onChange={(e) => setEditTask({...editTask, taskStartTime: e.target.value})}
              min={new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>

          {/* 任务结束时间（必填） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_END_TIME' : theme === 'modern' ? 'Task End Time' : '任务结束时间'}
            required
          >
            <ThemeInput
              type="datetime-local"
              value={editTask.taskEndTime || ''}
              onChange={(e) => setEditTask({...editTask, taskEndTime: e.target.value})}
              min={editTask.taskStartTime || new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>
        </div>
      );
    } else {
      // 重复任务：循环开始日期（必填）+ 结束重复设置 + 指定任务时间段（可选）
      return (
        <div className="space-y-4">
          {/* 循环开始日期（必填） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'REPEAT_START_DATE' : theme === 'modern' ? 'Repeat Start Date' : '循环开始日期'}
            required
            description={theme === 'pixel' ? 'WHEN_TO_START_REPEATING' : theme === 'modern' ? 'When should this recurring task start' : '重复任务从哪天开始循环'}
          >
            <ThemeInput
              type="date"
              value={editTask.repeatStartDate || ''}
              onChange={(e) => setEditTask({...editTask, repeatStartDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
          </ThemeFormField>

          {/* 结束重复设置 */}
          <ThemeFormField
            label={theme === 'pixel' ? 'END_REPEAT' : theme === 'modern' ? 'End Repeat' : '结束重复'}
            required
          >
            <ThemeSelect
              value={editTask.endRepeat || 'never'}
              onChange={(e) => setEditTask({...editTask, endRepeat: e.target.value as 'never' | 'on_date'})}
            >
              <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不结束'}</option>
              <option value="on_date">{theme === 'pixel' ? 'ON_DATE' : theme === 'modern' ? 'On Date' : '在指定日期'}</option>
            </ThemeSelect>
          </ThemeFormField>

          {/* 结束日期选择（当选择"在指定日期"时显示） */}
          {editTask.endRepeat === 'on_date' && (
            <ThemeFormField
              label={theme === 'pixel' ? 'END_DATE' : theme === 'modern' ? 'End Date' : '结束日期'}
              required
            >
              <ThemeInput
              type="date"
                value={editTask.endRepeatDate || ''}
                onChange={(e) => setEditTask({...editTask, endRepeatDate: e.target.value})}
                min={editTask.repeatStartDate || new Date().toISOString().split('T')[0]}
              />
            </ThemeFormField>
          )}

          {/* 指定任务时间段（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'TASK_TIME_PERIOD' : theme === 'modern' ? 'Task Time Period' : '指定任务时间'}
            description={theme === 'pixel' ? 'OPTIONAL_ANY_TIME_IF_EMPTY' : theme === 'modern' ? 'Optional: Leave empty if task can be completed anytime during the day' : '可选：留空表示任务可以在当天任意时间提交'}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'FROM' : theme === 'modern' ? 'From' : '开始时间'}
            </label>
                <ThemeInput
                  type="time"
                  value={editTask.taskTimeStart || ''}
                  onChange={(e) => setEditTask({...editTask, taskTimeStart: e.target.value})}
                />
          </div>
              <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'TO' : theme === 'modern' ? 'To' : '结束时间'}
                </label>
                <ThemeInput
                  type="time"
                  value={editTask.taskTimeEnd || ''}
                  onChange={(e) => setEditTask({...editTask, taskTimeEnd: e.target.value})}
                />
              </div>
            </div>
          </ThemeFormField>
        </div>
      );
    }
  };

  // 按状态筛选任务
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // 按视图筛选任务
  const getTasksByView = () => {
    const currentUserName = getCurrentUserName();
    const currentUserId = getCurrentUserId();
    
    switch (view) {
      case 'published':
        return tasks.filter(task => task.creator === currentUserName || task.creator === currentUserId);
      case 'assigned':
        return tasks.filter(task => task.assignee === currentUserName);
      case 'available':
        return tasks.filter(task => task.status === 'recruiting' && task.creator !== currentUserName && task.creator !== currentUserId);
      default:
        return tasks;
    }
  };

  // 获取我发布的任务
  const getPublishedTasks = () => {
    const currentUserName = getCurrentUserName();
    const currentUserId = getCurrentUserId();
    const result = tasks.filter(task => task.creator === currentUserName || task.creator === currentUserId);

    return result;
  };

  // 获取我领取的任务
  const getAssignedTasks = () => {
    const currentUserName = getCurrentUserName();
    return tasks.filter(task => task.assignee === currentUserName);
  };

  // 获取可领取的任务
  const getAvailableTasks = () => {
    const currentUserName = getCurrentUserName();
    const currentUserId = getCurrentUserId();
    return tasks.filter(task => task.status === 'recruiting' && task.creator !== currentUserName && task.creator !== currentUserId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'recruiting': '招募中',
      'assigned': '已分配',
      'in_progress': '进行中', 
      'completed': '已完成',
      'abandoned': '已关闭',
      'pending_review': '待审核'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 任务样式函数（从原版TaskBoard恢复）
  const getCategoryColor = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'bg-pixel-info text-black';
        case 'habit': return 'bg-pixel-success text-black';
        case 'special': return 'bg-pixel-purple text-white';
        default: return 'bg-pixel-textMuted text-white';
      }
    }
    
    switch (category) {
      case 'daily': return 'bg-blue-500';
      case 'habit': return 'bg-green-500';
      case 'special': return 'bg-secondary-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'DAILY';
        case 'habit': return 'HABIT';
        case 'special': return 'SPECIAL';
        default: return 'UNKNOWN';
      }
    }
    
    switch (category) {
      case 'daily': return '日常';
      case 'habit': return '习惯';
      case 'special': return '特殊';
      default: return '其他';
    }
  };

  const getRepeatTypeName = (task: Task) => {
    if (theme === 'pixel') {
      return task.repeatType === 'repeat' ? 'REPEAT' : 'ONCE';
    }
    return task.repeatType === 'repeat' ? '重复' : '单次';
  };

  // 获取重复频率显示名称
  const getRepeatFrequencyName = (frequency?: string) => {
    if (!frequency) return '--';
    const names = {
      'daily': theme === 'pixel' ? 'DAILY' : '每日',
      'weekly': theme === 'pixel' ? 'WEEKLY' : '每周',
      'biweekly': theme === 'pixel' ? 'BIWEEKLY' : '双周',
      'monthly': theme === 'pixel' ? 'MONTHLY' : '每月',
      'yearly': theme === 'pixel' ? 'YEARLY' : '每年'
    };
    return names[frequency as keyof typeof names] || frequency;
  };

  // 获取星期几显示名称
  const getWeekdaysDisplay = (weekdays?: number[]) => {
    if (!weekdays || weekdays.length === 0) return '--';
    const dayNames = theme === 'pixel' 
      ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      : ['日', '一', '二', '三', '四', '五', '六'];
    return weekdays.map(day => dayNames[day]).join(',');
  };

  // 检查是否为时间范围模式
  const isTimeRangeMode = (task: Task) => {
    return task.repeatType === 'once' && task.taskStartTime;
  };

  // 格式化时间范围显示
  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    };
    
    const startTimeStr = start.toLocaleTimeString('zh-CN', timeOptions);
    const endTimeStr = end ? end.toLocaleTimeString('zh-CN', timeOptions) : '';
    
    return endTimeStr ? `${startTimeStr}-${endTimeStr}` : startTimeStr;
  };

  const getStatusColor = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'recruiting': return 'border-pixel-info bg-pixel-card border-4';
        case 'assigned': return 'border-pixel-warning bg-pixel-card border-4';
        case 'in_progress': return 'border-pixel-info bg-pixel-panel border-4';
        case 'completed': return 'border-pixel-success bg-pixel-card border-4';
        case 'abandoned': return 'border-pixel-accent bg-pixel-card border-4';
        case 'pending_review': return 'border-pixel-warning bg-pixel-card border-4';
        default: return 'border-pixel-border bg-pixel-panel border-4';
      }
    }
    
    switch (status) {
      case 'recruiting': return 'border-blue-300 bg-blue-50';
      case 'assigned': return 'border-yellow-300 bg-yellow-50';
      case 'in_progress': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'abandoned': return 'border-red-300 bg-red-50';
      case 'pending_review': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // 判断任务是否即将到期
  const isTaskExpiringSoon = (deadline: string | null) => {
    if (!deadline) return false; // 不限时任务不会过期
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };



  // 渲染任务卡片 - 遵循设计系统的统一卡片样式
  const renderTaskCard = (task: Task) => {
    // 判断当前视图和当前用户，决定显示内容
    const isCurrentUserCreator = task.creator === currentUserName || task.creator === currentUserId;
    const isPublishedView = view === 'published';
    const isAssignedView = view === 'assigned';
    const isAvailableView = view === 'available';
    const isExpiringSoon = isTaskExpiringSoon(task.end_time || task.deadline || null);
    const isOverdue = isTaskOverdue(task);
    
    // 🎯 习惯任务特殊处理
    const isHabitTask = task.taskType === 'habit';
    const userHabitChallenge = isHabitTask ? userHabitChallenges.find(c => c.task_id === task.id) : null;
    const canJoinHabit = isHabitTask && task.repeat_end ? canJoinHabitTask(task.repeat_end, 
      task.duration === '21days' ? 21 : 
      task.duration === '1month' ? 30 :
      task.duration === '6months' ? 180 : 365
    ) : false;
    
    return (
      <ThemeCard
        key={task.id}
        onClick={() => setSelectedTask(task)}
        variant="interactive"
        size="md"
        className={`mb-4 ${getStatusColor(task.status)} ${isExpiringSoon ? 'border-yellow-500' : ''} ${isOverdue ? 'border-red-500 opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className={`font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
              theme === 'fresh' ? 'text-fresh-text' : 'text-gray-800'
          }`}>
            {task.title}
          </h4>
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              theme === 'pixel'
                ? `font-mono uppercase ${getCategoryColor(task.taskType)}`
                : `text-white ${getCategoryColor(task.taskType)}`
            }`}>
              {getCategoryName(task.taskType)}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              theme === 'pixel'
                ? 'bg-pixel-purple text-pixel-text font-mono uppercase'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {getRepeatTypeName(task)}
            </span>
            {isOverdue && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'pixel'
                  ? 'bg-pixel-accent text-black font-mono uppercase'
                  : 'bg-red-100 text-red-800'
              }`}>
                {theme === 'pixel' ? 'OVERDUE' : '已过期'}
              </span>
            )}
            {task.submittedAt && task.deadline && new Date(task.submittedAt) > new Date(task.deadline) && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'pixel'
                  ? 'bg-pixel-orange text-black font-mono uppercase'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {theme === 'pixel' ? 'LATE_SUBMISSION' : '逾期提交'}
              </span>
            )}
          </div>
        </div>

        <p className={`mb-3 ${
          theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 
          theme === 'fresh' ? 'text-fresh-textMuted' : 'text-gray-600'
        }`}>
          {task.description}
        </p>

        <div className="space-y-2">
          {/* 用户信息行 */}
          <div className="flex items-center space-x-4">
            {/* 只在"我领取的"和"可领取的"视图中显示创建者 */}
            {!isPublishedView && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-accent' : 'text-blue-600'
              }`}>
                  {theme === 'pixel' ? (
                  <PixelIcon name="user" size="sm" />
                ) : (
                  <Icon name="user" size="sm" />
                )}
                <span className={`text-xs ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  {theme === 'pixel' ? 'CREATOR:' : '创建者:'} {task.creator}
                  </span>
                </div>
            )}
            
            {/* 只在"我发布的"和"可领取的"视图中显示执行者 */}
            {task.assignee && (isPublishedView || isAvailableView) && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-info' : 'text-green-600'
              }`}>
                    {theme === 'pixel' ? (
                  <PixelIcon name="user" size="sm" />
                ) : (
                  <Icon name="user" size="sm" />
                )}
                <span className={`text-xs ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  {theme === 'pixel' ? 'ASSIGNEE:' : '执行者:'} {task.assignee}
                </span>
                  </div>
                )}
        </div>

          {/* 任务详情信息行 - 改为可换行布局 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 日期和时间信息 */}
            <div className={`flex items-center space-x-1 ${
              theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-600'
            }`}>
                {theme === 'pixel' ? (
                  <PixelIcon name="calendar" size="sm" />
                ) : (
                  <Icon name="calendar" size="sm" />
                )}
              <span className={`text-xs ${
                theme === 'pixel' ? 'font-mono' : ''
              }`}>
                {task.repeatType === 'once' ? (
                  isTimeRangeMode(task) ? (
                    // 时间范围模式：显示开始时间范围
                    <>
                      {formatDate(task.taskStartTime!)}
                      {task.taskStartTime && (
                        <span className="ml-1 text-xs opacity-75">
                          {formatTimeRange(task.taskStartTime, task.taskEndTime)}
                        </span>
                )}
              </>
            ) : (
                    // 简单模式：显示截止日期
                    task.deadline ? formatDate(task.deadline) : (theme === 'pixel' ? 'NO_DEADLINE' : theme === 'modern' ? 'No Deadline' : '不限时')
                  )
                ) : (
                  // 重复任务：显示日期范围
                  <>
                    {task.startDate && task.endDate && (
                      <>
                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
                      </>
                    )}
                  </>
                )}
              </span>
              </div>

            <div className={`flex items-center space-x-1 ${
              theme === 'pixel' ? 'text-pixel-accent' : 'text-yellow-600'
            }`}>
                {theme === 'pixel' ? (
                <PixelIcon name="star" size="sm" />
              ) : (
                <Icon name="star" size="sm" />
              )}
              <span className={`text-xs font-medium ${
                theme === 'pixel' ? 'font-mono' : ''
              }`}>
                {task.repeatType === 'repeat' ? (
                  <span className="flex items-center">
                    {task.points}
                    <span className={`text-xs ml-0.5 ${
                      theme === 'pixel' ? 'text-pixel-textMuted' : 'text-yellow-500'
                    }`}>
                      /次
                    </span>
                  </span>
                ) : (
                  task.points
                )}
              </span>
              </div>

            {/* 重复任务的详细信息 */}
            {task.repeatType === 'repeat' && task.repeatFrequency && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-info' : 'text-blue-600'
              }`}>
              {theme === 'pixel' ? (
                  <PixelIcon name="refresh" size="sm" />
                ) : (
                  <Icon name="refresh" size="sm" />
                )}
                <span className={`text-xs ${
                  theme === 'pixel' ? 'font-mono' : ''
                }`}>
                  {getRepeatFrequencyName(task.repeatFrequency)}
                  {task.repeatTime && (
                    <span className="ml-1 opacity-75">
                      {task.repeatTime.slice(0, 5)}
                    </span>
                  )}
                </span>
          </div>
            )}

            {/* 每周重复的星期显示 */}
            {task.repeatType === 'repeat' && task.repeatFrequency === 'weekly' && task.repeatWeekdays && task.repeatWeekdays.length > 0 && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-purple' : 'text-purple-600'
              }`}>
              {theme === 'pixel' ? (
                  <PixelIcon name="calendar" size="sm" />
                ) : (
                  <Icon name="calendar" size="sm" />
                )}
                <span className={`text-xs ${
                  theme === 'pixel' ? 'font-mono' : ''
                }`}>
                  {getWeekdaysDisplay(task.repeatWeekdays)}
                </span>
            </div>
            )}

            {task.requiresProof && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-500'
              }`}>
                {theme === 'pixel' ? (
                  <PixelIcon name="document" size="sm" />
                ) : (
                  <Icon name="document" size="sm" />
                )}
                <span className={`text-xs ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  {theme === 'pixel' ? 'PROOF_REQ' : '需要凭证'}
                </span>
              </div>
            )}
          </div>
        </div>
      </ThemeCard>
    );
  };

  // 判断是否为不限时任务
  // 判断任务是否为不限时任务（更新为使用统一字段）
  const isUnlimitedTask = (task: Task): boolean => {
    // 使用新的统一字段，同时保持向后兼容
    return task.end_time === null || task.end_time === undefined || 
           task.deadline === null || task.deadline === undefined;
  };

  // 判断任务的类型组合
  const getTaskTypeInfo = (task: Task) => {
    const isRepeating = task.repeatType === 'repeat';
    const isUnlimited = isUnlimitedTask(task);
    const hasConsecutiveCount = isRepeating && isUnlimited && (task.consecutiveCount && task.consecutiveCount > 0);
    
    return {
      isRepeating,
      isUnlimited,
      hasConsecutiveCount,
      taskCategory: isRepeating 
        ? (isUnlimited ? (hasConsecutiveCount ? 'repeat-unlimited-consecutive' : 'repeat-unlimited') : 'repeat-limited')
        : (isUnlimited ? 'once-unlimited' : 'once-limited')
    };
  };

  // 🎯 获取任务的时间状态（完全重构的时间逻辑）
  const getTaskTimeStatus = (task: Task) => {
    const now = new Date();
    
    // 使用新的统一字段，向后兼容
    const startTimeStr = task.start_time || task.taskStartTime;
    const endTimeStr = task.end_time || task.deadline;
    
    const hasStartTime = Boolean(startTimeStr);
    const hasEndTime = Boolean(endTimeStr);
    
    // 场景1：完全不限时任务（既无开始时间也无结束时间）
    if (!hasStartTime && !hasEndTime) {
      return {
        status: 'unlimited',
        canSubmit: true,
        isOverdue: false,
        isNotStarted: false,
        message: '随时可完成'
      };
    }
    
    const startTime = hasStartTime ? new Date(startTimeStr!) : null;
    const endTime = hasEndTime ? new Date(endTimeStr!) : null;
    
    // 场景2：只有开始时间限制（"某日期之后完成"）
    if (hasStartTime && !hasEndTime) {
      if (now < startTime!) {
        return {
          status: 'not_started',
          canSubmit: false,
          isOverdue: false,
          isNotStarted: true,
          message: `${startTime!.toLocaleString()} 之后可开始`
        };
      } else {
        return {
          status: 'active',
          canSubmit: true,
          isOverdue: false,
          isNotStarted: false,
          message: `${startTime!.toLocaleString()} 之后可完成`
        };
      }
    }
    
    // 场景3：只有结束时间限制（"某日期之前完成"）
    if (!hasStartTime && hasEndTime) {
      if (now > endTime!) {
        return {
          status: 'overdue',
          canSubmit: false,
          isOverdue: true,
          isNotStarted: false,
          message: `已于 ${endTime!.toLocaleString()} 过期`
        };
      } else {
        return {
          status: 'active',
          canSubmit: true,
          isOverdue: false,
          isNotStarted: false,
          message: `${endTime!.toLocaleString()} 前完成`
        };
      }
    }
    
    // 场景4：时间窗口（既有开始时间又有结束时间）
    if (hasStartTime && hasEndTime) {
      if (now < startTime!) {
        return {
          status: 'not_started',
          canSubmit: false,
          isOverdue: false,
          isNotStarted: true,
          message: `${startTime!.toLocaleString()} - ${endTime!.toLocaleString()}`
        };
      } else if (now > endTime!) {
        return {
          status: 'overdue',
          canSubmit: false,
          isOverdue: true,
          isNotStarted: false,
          message: `已于 ${endTime!.toLocaleString()} 过期`
        };
      } else {
        return {
          status: 'active',
          canSubmit: true,
          isOverdue: false,
          isNotStarted: false,
          message: `${startTime!.toLocaleString()} - ${endTime!.toLocaleString()}`
        };
      }
    }
    
    // 默认情况（理论上不应该到达这里）
    return {
      status: 'unlimited',
      canSubmit: true,
      isOverdue: false,
      isNotStarted: false,
      message: '随时可完成'
    };

  };



  // 判断任务是否在时间范围内（保持向后兼容）
  const isTaskInTimeRange = (task: Task) => {
    return getTaskTimeStatus(task).canSubmit;
  };

  // 判断任务是否尚未开始
  const isTaskNotStarted = (task: Task) => {
    return getTaskTimeStatus(task).isNotStarted;
  };

  // 重复不限时连续任务的专用逻辑
  const getConsecutiveTaskStatus = (task: Task) => {
    const taskInfo = getTaskTypeInfo(task);
    if (!taskInfo.hasConsecutiveCount) return null;
    
    const consecutiveCount = task.consecutiveCount || 7;
    const currentStreak = task.currentStreak || 0;
    const isCompleted = currentStreak >= consecutiveCount;
    
    // 根据重复频率确定单位
    const getUnitText = (frequency?: string) => {
      switch (frequency) {
        case 'daily': return theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天';
        case 'weekly': return theme === 'pixel' ? 'WEEKS' : theme === 'modern' ? 'weeks' : '周';
        case 'biweekly': return theme === 'pixel' ? 'PERIODS' : theme === 'modern' ? 'periods' : '期';
        case 'monthly': return theme === 'pixel' ? 'MONTHS' : theme === 'modern' ? 'months' : '月';
        case 'yearly': return theme === 'pixel' ? 'YEARS' : theme === 'modern' ? 'years' : '年';
        default: return theme === 'pixel' ? 'TIMES' : theme === 'modern' ? 'times' : '次';
      }
    };
    
    // 检查当前周期是否已完成（今天/本周/本月是否已打卡）
    const checkCurrentPeriodCompleted = () => {
      try {
        const completionRecord: string[] = task.completionRecord ? JSON.parse(task.completionRecord) : [];
        const today = new Date();
        let periodKey = '';
        
        switch (task.repeatFrequency) {
          case 'daily':
            periodKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'weekly':
            const startOfWeek = new Date(today);
            const dayOfWeek = today.getDay();
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            periodKey = startOfWeek.toISOString().split('T')[0];
            break;
          case 'biweekly':
            const weekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
            const biweekNumber = Math.floor(weekNumber / 2);
            periodKey = `${today.getFullYear()}-BW${biweekNumber}`;
            break;
          case 'monthly':
            periodKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            periodKey = String(today.getFullYear());
            break;
          default:
            periodKey = today.toISOString().split('T')[0];
        }
        
        return completionRecord.includes(periodKey);
      } catch (e) {
        return false;
      }
    };
    
    const currentPeriodCompleted = checkCurrentPeriodCompleted();
    
    return {
      consecutiveCount,
      currentStreak,
      progress: currentStreak / consecutiveCount,
      progressText: `${currentStreak}/${consecutiveCount}${getUnitText(task.repeatFrequency)}`,
      isCompleted,
      isStarted: currentStreak > 0,
      currentPeriodCompleted,
      canCheckIn: !isCompleted && !currentPeriodCompleted,
      remaining: Math.max(0, consecutiveCount - currentStreak),
      unitText: getUnitText(task.repeatFrequency)
    };
  };

  // 连续任务打卡
  const handleConsecutiveTaskCheckIn = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const taskInfo = getTaskTypeInfo(task!);
      if (!task || !taskInfo.hasConsecutiveCount) return;

      const today = new Date();
      const currentStreak = (task.currentStreak || 0) + 1;
      const consecutiveCount = task.consecutiveCount || 7;
      
      // 生成当前周期的标识符
      let periodKey = '';
      switch (task.repeatFrequency) {
        case 'daily':
          periodKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay();
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          periodKey = startOfWeek.toISOString().split('T')[0];
          break;
        case 'biweekly':
          const weekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          const biweekNumber = Math.floor(weekNumber / 2);
          periodKey = `${today.getFullYear()}-BW${biweekNumber}`;
          break;
        case 'monthly':
          periodKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = String(today.getFullYear());
          break;
        default:
          periodKey = today.toISOString().split('T')[0];
      }
      
      // 解析已有的完成记录
      let completionRecord: string[] = [];
      try {
        completionRecord = task.completionRecord ? JSON.parse(task.completionRecord) : [];
      } catch (e) {
        completionRecord = [];
      }
      
      // 添加当前周期的记录
      if (!completionRecord.includes(periodKey)) {
        completionRecord.push(periodKey);
      }
      
      // 检查是否完成了整个连续周期
      const isCompleted = currentStreak >= consecutiveCount;
      
      const updateData = {
        current_streak: currentStreak,
        completion_record: JSON.stringify(completionRecord),
        ...(currentStreak === 1 && { streak_start_date: periodKey }), // 记录连续开始时间
        ...(isCompleted && { status: 'completed' })
      };
      
      await taskService.updateTask(taskId, updateData);
      await reloadTasks();
    } catch (error) {
      console.error('❌ 连续任务打卡失败:', error);
      throw error;
    }
  };

  // 重置连续任务
  const handleResetConsecutiveTask = async (taskId: string) => {
    try {
      const updateData = {
        current_streak: 0,
        streak_start_date: null,
        completion_record: JSON.stringify([])
      };
      
      await taskService.updateTask(taskId, updateData);
      await reloadTasks();
    } catch (error) {
      console.error('❌ 重置连续任务失败:', error);
      throw error;
    }
  };

  // 渲染任务详情弹窗
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    // 检查任务所有者 - 如果creator是UUID则与用户ID比较，否则与用户名比较
    const isTaskOwner = selectedTask.creator === currentUserId || selectedTask.creator === currentUserName;
    const isAssignee = selectedTask.assignee === currentUserName;
    const isRecruiting = selectedTask.status === 'recruiting';
    const isAssigned = selectedTask.status === 'assigned';
    const isInProgress = selectedTask.status === 'in_progress';
    const isPendingReview = selectedTask.status === 'pending_review';
    const isCompleted = selectedTask.status === 'completed';
    const isAbandoned = selectedTask.status === 'abandoned';
    const hasProof = selectedTask.proof !== undefined;
    const canComplete = !selectedTask.requiresProof || hasProof;
    
    // 🎯 习惯任务特殊处理
    const isHabitTask = selectedTask.taskType === 'habit';
    const userHabitChallenge = isHabitTask ? userHabitChallenges.find(c => c.task_id === selectedTask.id) : null;
    const canJoinHabit = isHabitTask && selectedTask.repeat_end ? canJoinHabitTask(selectedTask.repeat_end, 
      selectedTask.duration === '21days' ? 21 : 
      selectedTask.duration === '1month' ? 30 :
      selectedTask.duration === '6months' ? 180 : 365
    ) : false;

  return (
      <ThemeDialog open={true} onOpenChange={handleCloseTaskDetail}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {theme === 'pixel' ? 'TASK_DETAILS' : theme === 'modern' ? 'Task Details' : '任务详情'}
              </DialogTitle>
              {theme === 'modern' ? (
        <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                  onClick={handleCloseTaskDetail}
                  aria-label="关闭"
                >
                  <Icon name="x" size="sm" />
        </button>
              ) : (
          <button
                  className={`rounded-full p-2 transition-colors ${
              theme === 'pixel'
                      ? 'bg-pixel-card border-2 border-pixel-border hover:bg-pixel-accent text-pixel-text' 
                      : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'
            }`}
                  onClick={handleCloseTaskDetail}
                  aria-label="关闭"
          >
                  <Icon name="x" size="sm" />
          </button>
              )}
          </div>
          </DialogHeader>
          
          <DialogContent>
            <div className="space-y-4">
              {/* 没有权限时显示只读标识 */}
              {!(isTaskOwner && (isRecruiting || isAbandoned)) && (
                <div className={`flex items-center space-x-2 px-3 py-1 mb-4 ${
                theme === 'pixel'
                    ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel'
                    : theme === 'modern'
                    ? 'bg-muted rounded-md'
                    : 'bg-gray-100 rounded-lg'
                }`}>
                  <span className={`text-xs ${
              theme === 'pixel'
                      ? 'text-pixel-textMuted font-mono uppercase'
                      : theme === 'modern'
                      ? 'text-muted-foreground'
                      : 'text-gray-500'
                  }`}>
                    {theme === 'pixel' ? (
                      <div className="flex items-center space-x-1">
                        <span>READONLY</span>
          </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span>只读</span>
          </div>
                    )}
                  </span>
        </div>
              )}

            {isEditing ? (
              // 编辑表单
              <>
                <h4 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
                  {theme === 'pixel' ? 'EDIT_TASK' : theme === 'modern' ? 'Edit Task' : '编辑任务'}
                </h4>
                
                {/* 任务标题输入 */}
                <ThemeFormField
                  label={theme === 'pixel' ? 'TASK_TITLE' : theme === 'modern' ? 'Task Title' : '任务标题'}
                  required
                >
                  <ThemeInput
                    type="text"
                    value={editTask.title || ''}
                    onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                    placeholder={theme === 'pixel' ? 'ENTER_TITLE...' : theme === 'modern' ? 'Enter task title...' : '输入任务标题...'}
                  />
                </ThemeFormField>

                {/* 任务描述输入 */}
          <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'DESCRIPTION:' : '任务描述'}
                  </label>
                  <textarea
                    value={editTask.description || ''}
                    onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                    rows={3}
                    className={`w-full px-3 py-2 ${
            theme === 'pixel'
                        ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono'
                        : 'border border-gray-300 rounded-lg'
                    }`}
                    placeholder={theme === 'pixel' ? 'ENTER_DESCRIPTION...' : '输入任务描述...'}
                  />
          </div>

                {/* 任务类型选择 */}
          <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'TASK_TYPE *' : '任务类型 *'}
                  </label>
                  <select
                    value={editTask.taskType || 'daily'}
                    onChange={(e) => setEditTask({...editTask, taskType: e.target.value as Task['taskType']})}
                    className={`w-full px-3 py-2 ${
              theme === 'pixel' 
                        ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono'
                        : 'border border-gray-300 rounded-lg'
                    }`}
                  >
                    <option value="daily">{theme === 'pixel' ? 'DAILY' : '日常生活'}</option>
                    <option value="health">{theme === 'pixel' ? 'HEALTH' : '健康运动'}</option>
                    <option value="learning">{theme === 'pixel' ? 'LEARNING' : '学习成长'}</option>
                    <option value="household">{theme === 'pixel' ? 'HOUSEHOLD' : '家务清洁'}</option>
                    <option value="special">{theme === 'pixel' ? 'SPECIAL' : '特殊任务'}</option>
                  </select>
          </div>

                {/* 重复频率 */}
                <ThemeFormField
                  label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                  required
                >
                  <ThemeSelect
                    value={editTask.repeat || 'never'}
                    onChange={(e) => setEditTask({...editTask, repeat: e.target.value as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'})}
                  >
                    <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复'}</option>
                    <option value="daily">{theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每天'}</option>
                    <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周'}</option>
                    <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '每两周'}</option>
                    <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月'}</option>
                    <option value="yearly">{theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年'}</option>
                  </ThemeSelect>
                </ThemeFormField>

                {/* 任务时间字段（动态显示） */}
                {renderEditTaskTimeFields()}

                {/* 积分输入 */}
          <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'POINTS *' : '积分奖励 *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editTask.points || ''}
                    onChange={(e) => setEditTask({...editTask, points: e.target.value === '' ? undefined : parseInt(e.target.value) || 0})}
                    className={`w-full px-3 py-2 ${
              theme === 'pixel' 
                        ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono'
                        : 'border border-gray-300 rounded-lg'
                    }`}
                  />
                  {editTask.repeat !== 'never' && (
                    <p className={`text-sm mt-1 ${
                      theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                    }`}>
                      {theme === 'pixel' ? 'POINTS PER COMPLETION' : '每次完成获得的积分'}
                    </p>
                  )}
      </div>

                {/* 是否需要凭证 */}
            <div>
                  <label className={`flex items-center space-x-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editTask.requiresProof || false}
                      onChange={(e) => setEditTask({...editTask, requiresProof: e.target.checked})}
                      className={`${
              theme === 'pixel' 
                          ? 'w-4 h-4 text-pixel-accent bg-pixel-card border-2 border-pixel-border rounded-pixel'
                          : 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                      }`}
                    />
                    <span>
                      {theme === 'pixel' ? 'REQUIRES_PROOF' : '需要提交凭证'}
                    </span>
                  </label>
                    </div>


              </>
            ) : (
              // 任务详情显示 - 与新建任务表单字段保持一致
              <div className="space-y-4">
                <DetailField
                  label={theme === 'pixel' ? 'TASK_TITLE' : theme === 'modern' ? 'Task Title' : '任务标题'}
                  value={selectedTask.title}
                  valueClassName="text-lg font-medium"
                />

                <DetailField
                  label={theme === 'pixel' ? 'TASK_DESCRIPTION' : theme === 'modern' ? 'Task Description' : '任务描述'}
                  value={selectedTask.description || '--'}
                />

                <DetailField
                  label={theme === 'pixel' ? 'TASK_TYPE' : theme === 'modern' ? 'Task Type' : '任务类型'}
                  value={selectedTask.taskType === 'daily' ? (theme === 'pixel' ? 'DAILY_TASK' : theme === 'modern' ? 'Daily Task' : '日常任务') : 
                         selectedTask.taskType === 'habit' ? (theme === 'pixel' ? 'HABIT_TASK' : theme === 'modern' ? 'Habit Task' : '习惯任务') :
                         selectedTask.taskType === 'special' ? (theme === 'pixel' ? 'SPECIAL_TASK' : theme === 'modern' ? 'Special Task' : '特殊任务') : selectedTask.taskType}
                />

                {/* 🎯 习惯任务特殊信息显示 */}
                {isHabitTask && (
                  <>
                    <DetailField
                      label={theme === 'pixel' ? 'CHALLENGE_DURATION' : theme === 'modern' ? 'Challenge Duration' : '挑战持续时间'}
                      value={selectedTask.duration === '21days' ? (theme === 'pixel' ? '21_DAYS' : theme === 'modern' ? '21 Days' : '21天') :
                             selectedTask.duration === '1month' ? (theme === 'pixel' ? '30_DAYS' : theme === 'modern' ? '30 Days' : '30天') :
                             selectedTask.duration === '6months' ? (theme === 'pixel' ? '180_DAYS' : theme === 'modern' ? '180 Days' : '180天') :
                             selectedTask.duration === '1year' ? (theme === 'pixel' ? '365_DAYS' : theme === 'modern' ? '365 Days' : '365天') :
                             selectedTask.duration || '--'}
                    />
                    
                    <DetailField
                      label={theme === 'pixel' ? 'TASK_PERIOD' : theme === 'modern' ? 'Task Period' : '任务期间'}
                      value={`${selectedTask.repeat_start || '--'} ~ ${selectedTask.repeat_end || '--'}`}
                    />
                    
                    {selectedTask.repeat_end && (
                      <DetailField
                        label={theme === 'pixel' ? 'LATEST_JOIN_DATE' : theme === 'modern' ? 'Latest Join Date' : '最晚加入日期'}
                        value={calculateLatestJoinDate(selectedTask.repeat_end, 
                          selectedTask.duration === '21days' ? 21 : 
                          selectedTask.duration === '1month' ? 30 :
                          selectedTask.duration === '6months' ? 180 : 365
                        )}
                      />
                    )}
                    
                    {userHabitChallenge && (
                      <>
                        <DetailField
                          label={theme === 'pixel' ? 'MY_PROGRESS' : theme === 'modern' ? 'My Progress' : '我的进度'}
                          value={`${userHabitChallenge.total_completions}/${
                            selectedTask.duration === '21days' ? 21 : 
                            selectedTask.duration === '1month' ? 30 :
                            selectedTask.duration === '6months' ? 180 : 365
                          } ${theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天'}`}
                        />
                        
                        <DetailField
                          label={theme === 'pixel' ? 'CHALLENGE_STATUS' : theme === 'modern' ? 'Challenge Status' : '挑战状态'}
                          value={userHabitChallenge.status === 'active' ? (theme === 'pixel' ? 'ACTIVE' : theme === 'modern' ? 'Active' : '进行中') :
                                 userHabitChallenge.status === 'completed' ? (theme === 'pixel' ? 'COMPLETED' : theme === 'modern' ? 'Completed' : '已完成') :
                                 userHabitChallenge.status === 'failed' ? (theme === 'pixel' ? 'FAILED' : theme === 'modern' ? 'Failed' : '失败') :
                                 userHabitChallenge.status === 'abandoned' ? (theme === 'pixel' ? 'ABANDONED' : theme === 'modern' ? 'Abandoned' : '已放弃') :
                                 userHabitChallenge.status}
                        />
                        
                        {userHabitChallenge.last_completion_date && (
                          <DetailField
                            label={theme === 'pixel' ? 'LAST_CHECKIN' : theme === 'modern' ? 'Last Check-in' : '最后打卡'}
                            value={userHabitChallenge.last_completion_date}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                <DetailField
                  label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                  value={selectedTask.repeatType === 'once' ? (theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复') :
                         selectedTask.repeatFrequency === 'daily' ? (theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每天') :
                         selectedTask.repeatFrequency === 'weekly' ? (theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周') :
                         selectedTask.repeatFrequency === 'biweekly' ? (theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '每两周') :
                         selectedTask.repeatFrequency === 'monthly' ? (theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月') :
                         selectedTask.repeatFrequency === 'yearly' ? (theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年') : 
                         selectedTask.repeatFrequency || '--'}
                />

                <DetailField
                  label={theme === 'pixel' ? 'TIME_LIMIT' : theme === 'modern' ? 'Time Limit' : '时间限制'}
                  value={isUnlimitedTask(selectedTask) ? (theme === 'pixel' ? 'UNLIMITED' : theme === 'modern' ? 'Unlimited' : '不限时') : (theme === 'pixel' ? 'LIMITED' : theme === 'modern' ? 'Limited' : '限时')}
                />

                <DetailField
                  label={theme === 'pixel' ? 'POINTS' : theme === 'modern' ? 'Points' : '奖励积分'}
                  value={`${selectedTask.points || 0}`}
                />
                {/* 时间信息 - 根据四种任务类型显示 */}
                {(() => {
                  const taskInfo = getTaskTypeInfo(selectedTask);
                  
                  if (taskInfo.taskCategory === 'once-limited') {
                    // 🎯 一次性限时任务 - 显示新的时间逻辑
                    const timeStatus = getTaskTimeStatus(selectedTask);
                    const hasStartTime = Boolean(selectedTask.start_time || selectedTask.taskStartTime);
                    const hasEndTime = Boolean(selectedTask.end_time || selectedTask.deadline);
                    
                    return (
                      <>
                        {hasStartTime && (
                          <DetailField
                            label={theme === 'pixel' ? 'EARLIEST_START' : theme === 'modern' ? 'Earliest Start' : '最早开始时间'}
                            value={formatDate(selectedTask.start_time || selectedTask.taskStartTime!)}
                          />
                        )}
                        {hasEndTime && (
                          <DetailField
                            label={theme === 'pixel' ? 'LATEST_END' : theme === 'modern' ? 'Latest End' : '最晚结束时间'}
                            value={formatDate(selectedTask.end_time || selectedTask.deadline!)}
                          />
                        )}
                        <DetailField
                          label={theme === 'pixel' ? 'TIME_STATUS' : theme === 'modern' ? 'Time Status' : '时间状态'}
                          value={timeStatus.message}
                        />
                      </>
                    );
                  } else if (taskInfo.taskCategory === 'once-unlimited') {
                    // 一次性不限时任务
                    return (
                      <DetailField
                        label={theme === 'pixel' ? 'COMPLETION_TIME' : theme === 'modern' ? 'Completion Time' : '完成时间'}
                        value={theme === 'pixel' ? 'ANYTIME' : theme === 'modern' ? 'Anytime' : '随时可完成'}
                      />
                    );
                  } else if (taskInfo.taskCategory === 'repeat-limited') {
                    // 重复性限时任务
                    return (
                      <>
                        <DetailField
                          label={theme === 'pixel' ? 'REPEAT_START_DATE' : theme === 'modern' ? 'Repeat Start Date' : '循环开始日期'}
                          value={selectedTask.repeat_start || selectedTask.startDate ? formatDate(selectedTask.repeat_start || selectedTask.startDate!) : '--'}
                        />
                        {(selectedTask.repeat_end || selectedTask.endDate) && (
                          <DetailField
                            label={theme === 'pixel' ? 'REPEAT_END_DATE' : theme === 'modern' ? 'Repeat End Date' : '循环结束日期'}
                            value={formatDate(selectedTask.repeat_end || selectedTask.endDate!)}
                          />
                        )}
                        {selectedTask.startDate && selectedTask.endDate && (
                          <DetailField
                            label={theme === 'pixel' ? 'TOTAL_DURATION' : theme === 'modern' ? 'Total Duration' : '总持续时间'}
                            value={`${calculateDuration(selectedTask.startDate, selectedTask.endDate)} ${theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天'}`}
                          />
                        )}
                        {(selectedTask.repeatTime || selectedTask.taskEndTime) && (
                          <DetailField
                            label={theme === 'pixel' ? 'DAILY_TIME_PERIOD' : theme === 'modern' ? 'Daily Time Period' : '每日时间段'}
                            value={(() => {
                              const startTime = selectedTask.repeatTime;
                              const endTime = selectedTask.taskEndTime;
                              
                              if (startTime && endTime) {
                                const formatTime = (timeStr: string) => {
                                  if (timeStr.includes('T')) {
                                    const timePart = timeStr.split('T')[1];
                                    return timePart.substring(0, 5);
                                  }
                                  return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
                                };
                                return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                              } else if (startTime) {
                                const formatTime = (timeStr: string) => {
                                  if (timeStr.includes('T')) {
                                    const timePart = timeStr.split('T')[1];
                                    return timePart.substring(0, 5);
                                  }
                                  return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
                                };
                                return formatTime(startTime);
                              } else {
                                return '--';
                              }
                            })()}
                          />
                        )}
                      </>
                    );
                  } else if (taskInfo.taskCategory === 'repeat-unlimited') {
                    // 重复性不限时任务
                    return (
                      <>
                        <DetailField
                          label={theme === 'pixel' ? 'REPEAT_START_DATE' : theme === 'modern' ? 'Repeat Start Date' : '循环开始日期'}
                          value={selectedTask.startDate ? formatDate(selectedTask.startDate) : '--'}
                        />
                        {selectedTask.endDate && (
                          <DetailField
                            label={theme === 'pixel' ? 'REPEAT_END_DATE' : theme === 'modern' ? 'Repeat End Date' : '循环结束日期'}
                            value={formatDate(selectedTask.endDate)}
                          />
                        )}
                        <DetailField
                          label={theme === 'pixel' ? 'COMPLETION_TIME' : theme === 'modern' ? 'Completion Time' : '完成时间'}
                          value={theme === 'pixel' ? 'ANYTIME_PER_CYCLE' : theme === 'modern' ? 'Anytime per cycle' : '每个周期内随时可完成'}
                        />
                      </>
                    );
                  } else if (taskInfo.taskCategory === 'repeat-unlimited-consecutive') {
                    // 重复不限时连续任务
                    const consecutiveStatus = getConsecutiveTaskStatus(selectedTask);
                    if (!consecutiveStatus) return null;
                    
                    return (
                      <>
                        <DetailField
                          label={theme === 'pixel' ? 'REPEAT_START_DATE' : theme === 'modern' ? 'Repeat Start Date' : '循环开始日期'}
                          value={selectedTask.startDate ? formatDate(selectedTask.startDate) : '--'}
                        />
                        {selectedTask.endDate && (
                          <DetailField
                            label={theme === 'pixel' ? 'REPEAT_END_DATE' : theme === 'modern' ? 'Repeat End Date' : '循环结束日期'}
                            value={formatDate(selectedTask.endDate)}
                          />
                        )}
                        <DetailField
                          label={theme === 'pixel' ? 'CONSECUTIVE_REQUIREMENT' : theme === 'modern' ? 'Consecutive Requirement' : '连续要求'}
                          value={`${consecutiveStatus.consecutiveCount} ${consecutiveStatus.unitText}`}
                        />
                        <DetailField
                          label={theme === 'pixel' ? 'CURRENT_PROGRESS' : theme === 'modern' ? 'Current Progress' : '当前进度'}
                          value={consecutiveStatus.progressText}
                          valueClassName={consecutiveStatus.progress >= 1 ? 'text-green-600' : consecutiveStatus.progress > 0.5 ? 'text-yellow-600' : 'text-gray-600'}
                        />
                        {consecutiveStatus.isStarted && selectedTask.streakStartDate && (
                          <DetailField
                            label={theme === 'pixel' ? 'STREAK_START_DATE' : theme === 'modern' ? 'Streak Start Date' : '连续开始日期'}
                            value={formatDate(selectedTask.streakStartDate)}
                          />
                        )}
                        <DetailField
                          label={theme === 'pixel' ? 'COMPLETION_STATUS' : theme === 'modern' ? 'Completion Status' : '完成状态'}
                          value={consecutiveStatus.isCompleted 
                            ? (theme === 'pixel' ? 'COMPLETED' : theme === 'modern' ? 'Completed' : '已完成')
                            : consecutiveStatus.isStarted 
                              ? (theme === 'pixel' ? 'IN_PROGRESS' : theme === 'modern' ? 'In Progress' : '进行中')
                              : (theme === 'pixel' ? 'NOT_STARTED' : theme === 'modern' ? 'Not Started' : '未开始')
                          }
                          valueClassName={
                            consecutiveStatus.isCompleted ? 'text-green-600' :
                            consecutiveStatus.isStarted ? 'text-blue-600' : 'text-gray-600'
                          }
                        />
                        {consecutiveStatus.remaining > 0 && (
                          <DetailField
                            label={theme === 'pixel' ? 'REMAINING' : theme === 'modern' ? 'Remaining' : '剩余'}
                            value={`${consecutiveStatus.remaining} ${consecutiveStatus.unitText}`}
                          />
                        )}
                      </>
                    );
                  }
                  
                  return null;
                })()}

                {/* 需要凭证 */}
                {selectedTask.requiresProof && (
                  <DetailField
                    label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要凭证'}
                    value={theme === 'pixel' ? 'YES' : theme === 'modern' ? 'Yes' : '是'}
                  />
                )}

                {/* 领取者信息 */}
                {selectedTask.assignee && (
                  <DetailField
                    label={theme === 'pixel' ? 'ASSIGNEE' : theme === 'modern' ? 'Assignee' : '领取者'}
                    value={selectedTask.assignee}
                  />
                )}

                {/* 发布者信息 */}
                <DetailField
                  label={theme === 'pixel' ? 'CREATOR' : theme === 'modern' ? 'Creator' : '发布者'}
                  value={selectedTask.creator}
                />



              {/* 需要凭证提示 */}
              {selectedTask.requiresProof && (
                <div className={`flex items-center space-x-2 p-3 rounded ${
                theme === 'pixel'
                    ? 'bg-pixel-warning border-2 border-pixel-border text-pixel-text'
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                }`}>
                  {theme === 'pixel' ? (
                    <PixelIcon name="warning" size="sm" />
                  ) : (
                    <Icon name="document" />
                  )}
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' ? 'font-mono uppercase' : ''
                  }`}>
                    {theme === 'pixel' ? 'PROOF REQUIRED' : '此任务需要提交完成凭证'}
                  </span>
                </div>
              )}

                {/* 完成凭证 */}
                  {selectedTask.proof && (
                  <DetailField
                    label={theme === 'pixel' ? 'PROOF' : theme === 'modern' ? 'Proof' : '完成凭证'}
                    value={selectedTask.proof}
                  />
                )}

                {/* 审核评价 */}
                {selectedTask.reviewComment && (
                  <DetailField
                    label={theme === 'pixel' ? 'REVIEW' : theme === 'modern' ? 'Review Comment' : '审核评价'}
                    value={selectedTask.reviewComment}
                  />
                )}
              </div>
            )}
            </div>
        </DialogContent>
                    
                    <DialogFooter>
                      {isEditing ? (
                        // 编辑模式的按钮
                        <>
                          <ThemeButton
                            variant="secondary"
                      onClick={() => {
                              setIsEditing(false);
                              setEditTask({});
                            }}
                          >
                            {theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消'}
                          </ThemeButton>
                          <ThemeButton
                            variant="primary"
                            onClick={handleSaveEdit}
                          >
                            {theme === 'pixel' ? 'SAVE' : theme === 'modern' ? 'Save' : '保存'}
                          </ThemeButton>
                        </>
                      ) : (
                        // 详情模式的操作按钮：编辑、删除、任务操作、关闭
                        <>
                          {/* 编辑和删除按钮 - 任务所有者可编辑 */}
                          {isTaskOwner && (isRecruiting || isAbandoned) && (
                            <>
                              <ThemeButton
                                variant="secondary"
                      onClick={() => {
                                  handleEditTask(selectedTask);
                                  setIsEditing(true);
                                }}
                              >
                                {theme === 'pixel' ? 'EDIT' : theme === 'modern' ? 'Edit' : '编辑'}
                              </ThemeButton>
                            </>
                          )}

                          {/* 任务操作按钮 */}
                          {/* 🎯 习惯任务特殊按钮 */}
                          {isHabitTask && !isTaskOwner && (
                            <>
                              {!userHabitChallenge && canJoinHabit && (
                                <ThemeButton
                                  variant="primary"
                                  onClick={async () => {
                                    try {
                                      await handleJoinHabitChallenge(selectedTask.id);
                                      handleCloseTaskDetail();
                                    } catch (error) {
                                      console.error('❌ 加入习惯挑战失败:', error);
                                    }
                                  }}
                                >
                                  {theme === 'pixel' ? 'JOIN_CHALLENGE' : theme === 'modern' ? 'Join Challenge' : '加入挑战'}
                                </ThemeButton>
                              )}
                              
                              {userHabitChallenge && userHabitChallenge.status === 'active' && (
                                <>
                                  <ThemeButton
                                    variant="primary"
                                    onClick={async () => {
                                      try {
                                        await handleDailyCheckIn(userHabitChallenge.id);
                                        handleCloseTaskDetail();
                                      } catch (error) {
                                        console.error('❌ 打卡失败:', error);
                                      }
                                    }}
                                  >
                                    {theme === 'pixel' ? 'DAILY_CHECKIN' : theme === 'modern' ? 'Daily Check-in' : '今日打卡'}
                                  </ThemeButton>
                                  
                                  <ThemeButton
                                    variant="secondary"
                                    onClick={async () => {
                                      try {
                                        await handleAbandonChallenge(userHabitChallenge.id);
                                        handleCloseTaskDetail();
                                      } catch (error) {
                                        console.error('❌ 放弃挑战失败:', error);
                                      }
                                    }}
                                  >
                                    {theme === 'pixel' ? 'ABANDON_CHALLENGE' : theme === 'modern' ? 'Abandon Challenge' : '放弃挑战'}
                                  </ThemeButton>
                                </>
                              )}
                              
                              {!canJoinHabit && !userHabitChallenge && (
                                <div className={`text-sm ${
                                  theme === 'pixel' ? 'text-pixel-textMuted' :
                                  theme === 'modern' ? 'text-slate-600' :
                                  'text-gray-600'
                                }`}>
                                  {theme === 'pixel' ? 'JOIN_DEADLINE_PASSED' : 
                                   theme === 'modern' ? 'Join deadline has passed' : 
                                   '加入截止日期已过'}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* 普通任务的领取按钮 - 招募中 */}
                          {!isHabitTask && !isTaskOwner && isRecruiting && (
                            <ThemeButton
                              variant="primary"
                              onClick={async () => {
                                try {
                                  await handleAcceptTask(selectedTask.id);
                        handleCloseTaskDetail();
                                } catch (error) {
                                  console.error('❌ 领取任务按钮处理失败:', error);
                                }
                              }}
                            >
                              {theme === 'pixel' ? 'ACCEPT_TASK' : theme === 'modern' ? 'Accept Task' : '领取任务'}
                            </ThemeButton>
                          )}

                                                    {/* 任务时间状态显示和操作按钮 */}
                          {isAssignee && (isAssigned || isInProgress) && (() => {
                            const timeStatus = getTaskTimeStatus(selectedTask);
                            
                            // 任务尚未开始
                            if (timeStatus.isNotStarted) {
                              return (
                                <div className="flex flex-col space-y-2">
                                  <div className="text-yellow-600 text-sm font-medium">
                                    {timeStatus.message}
                                  </div>
                                  <ThemeButton
                                    variant="danger"
                                    onClick={async () => {
                                      await handleAbandonTask(selectedTask.id);
                                      handleCloseTaskDetail();
                                    }}
                                  >
                                    {theme === 'pixel' ? 'ABANDON' : theme === 'modern' ? 'Abandon' : '放弃'}
                                  </ThemeButton>
                                </div>
                              );
                            }
                            
                            // 任务已过期
                            if (timeStatus.isOverdue) {
                              return (
                                <div className="flex flex-col space-y-2">
                                  <div className="text-red-600 text-sm font-medium">
                                    {timeStatus.message}
                                  </div>
                                  <ThemeButton
                                    variant="danger"
                                    onClick={async () => {
                                      await handleAbandonTask(selectedTask.id);
                                      handleCloseTaskDetail();
                                    }}
                                  >
                                    {theme === 'pixel' ? 'ABANDON' : theme === 'modern' ? 'Abandon' : '放弃'}
                                  </ThemeButton>
                                </div>
                              );
                            }
                            
                            // 任务可以提交
                            if (timeStatus.canSubmit || timeStatus.status === 'unlimited') {
                              return (
                                <div className="flex flex-col space-y-2">
                                  {timeStatus.status !== 'unlimited' && (
                                    <div className="text-green-600 text-sm font-medium">
                                      {timeStatus.message}
                                    </div>
                                  )}
                                  {isAssigned && (
                                    <ThemeButton
                                      variant="primary"
                                      onClick={async () => {
                                        try {
                                          await handleStartTask(selectedTask.id);
                                          handleCloseTaskDetail();
                                        } catch (error) {
                                          console.error('❌ 按钮点击处理失败:', error);
                                        }
                                      }}
                                    >
                                      {theme === 'pixel' ? 'START_TASK' : theme === 'modern' ? 'Start Task' : '开始任务'}
                                    </ThemeButton>
                                  )}
                                  <ThemeButton
                                    variant="danger"
                                    onClick={async () => {
                                      await handleAbandonTask(selectedTask.id);
                                      handleCloseTaskDetail();
                                    }}
                                  >
                                    {theme === 'pixel' ? 'ABANDON' : theme === 'modern' ? 'Abandon' : '放弃'}
                                  </ThemeButton>
                                </div>
                              );
                            }
                            
                            return null;
                          })()}

                          {/* 提交任务按钮 - 进行中 */}
                          {isAssignee && isInProgress && (() => {
                            const timeStatus = getTaskTimeStatus(selectedTask);
                            return timeStatus.canSubmit || timeStatus.status === 'unlimited';
                          })() && (
                            <ThemeButton
                              variant="primary"
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                                handleCloseTaskDetail();
                              }}
                              disabled={isTaskNotStarted(selectedTask)}
                            >
                              {theme === 'pixel' ? 'COMPLETE_TASK' : theme === 'modern' ? 'Complete Task' : '完成任务'}
                            </ThemeButton>
                          )}

                          {/* 审核任务按钮 - 待审核 */}
                          {isTaskOwner && isPendingReview && (
                <>
                              <ThemeButton
                                variant="primary"
                    onClick={() => {
                                  handleReviewTask(selectedTask.id, true);
                      handleCloseTaskDetail();
                    }}
                              >
                                {theme === 'pixel' ? 'APPROVE' : theme === 'modern' ? 'Approve' : '通过'}
                              </ThemeButton>
                              <ThemeButton
                                variant="danger"
                    onClick={() => {
                                  handleReviewTask(selectedTask.id, false);
                        handleCloseTaskDetail();
                    }}
                  >
                                {theme === 'pixel' ? 'REJECT' : theme === 'modern' ? 'Reject' : '拒绝'}
                              </ThemeButton>
                </>
              )}

                                                    {/* 重新发布按钮 - 已放弃 */}
                          {isTaskOwner && isAbandoned && (
                            <ThemeButton
                              variant="primary"
                              onClick={async () => {
                                await handleRepublishTask(selectedTask.id);
                                handleCloseTaskDetail();
                              }}
                            >
                              {theme === 'pixel' ? 'REPUBLISH' : theme === 'modern' ? 'Republish' : '重新发布'}
                            </ThemeButton>
                          )}

                                                    {/* 连续任务的特殊操作按钮 */}
                          {(() => {
                            const taskInfo = getTaskTypeInfo(selectedTask);
                            if (!taskInfo.hasConsecutiveCount) return null;
                            
                            const consecutiveStatus = getConsecutiveTaskStatus(selectedTask);
                            if (!consecutiveStatus) return null;
                            
                            // 检查任务的时间状态（是否可以开始/提交）
                            const timeStatus = getTaskTimeStatus(selectedTask);

                            if (isAssignee && (isInProgress || isAssigned)) {
                              // 已完成的连续任务
                              if (consecutiveStatus.isCompleted) {
                                return (
                                  <div className="text-green-600 text-sm font-medium">
                                    {theme === 'pixel' ? 'STREAK_COMPLETED' : theme === 'modern' ? 'Streak completed!' : '连续任务已完成！'}
                                  </div>
                                );
                              }

                              // 任务时间未到或已过期
                              if (timeStatus.isNotStarted) {
                                return (
                                  <div className="text-yellow-600 text-sm font-medium">
                                    {timeStatus.message}
                                  </div>
                                );
                              }

                              if (timeStatus.isOverdue) {
                                return (
                                  <div className="text-red-600 text-sm font-medium">
                                    {timeStatus.message}
                                  </div>
                                );
                              }

                              // 可以进行连续任务打卡
                              if (timeStatus.canSubmit || timeStatus.status === 'unlimited') {
                                return (
                                  <div className="flex flex-col space-y-2">
                                    {consecutiveStatus.canCheckIn && (
                                      <ThemeButton
                                        variant="primary"
                                        onClick={async () => {
                                          try {
                                            await handleConsecutiveTaskCheckIn(selectedTask.id);
                                            handleCloseTaskDetail();
                                          } catch (error) {
                                            console.error('❌ 连续任务打卡失败:', error);
                                          }
                                        }}
                                      >
                                        {theme === 'pixel' ? 'CHECK_IN' : theme === 'modern' ? 'Check In' : '打卡'}
                                      </ThemeButton>
                                    )}
                                    {consecutiveStatus.currentPeriodCompleted && (
                                      <div className="text-green-600 text-sm font-medium">
                                        {theme === 'pixel' ? 'PERIOD_COMPLETED' : theme === 'modern' ? 'Period completed!' : '本期已完成！'}
                                      </div>
                                    )}
                                    <ThemeButton
                                      variant="secondary"
                                      onClick={async () => {
                                        try {
                                          await handleResetConsecutiveTask(selectedTask.id);
                                          handleCloseTaskDetail();
                                        } catch (error) {
                                          console.error('❌ 重置连续任务失败:', error);
                                        }
                                      }}
                                    >
                                      {theme === 'pixel' ? 'RESET_STREAK' : theme === 'modern' ? 'Reset Streak' : '重置连续'}
                                    </ThemeButton>
                                  </div>
                                );
                              }
                            }

                            return null;
                          })()}

                          {/* 关闭按钮 - 始终显示 */}
                          <ThemeButton
                            variant="secondary"
                            onClick={handleCloseTaskDetail}
                          >
                            {theme === 'pixel' ? 'CLOSE' : theme === 'modern' ? 'Close' : '关闭'}
                          </ThemeButton>
                        </>
                      )}
                    </DialogFooter>
                  </ThemeDialog>
              );
  };

  // 渲染任务列表（原始的复杂布局）
  const renderTaskList = (taskList: Task[], type: 'published' | 'assigned' | 'available') => {
    if (type === 'published') {
      const recruitingTasks = taskList.filter(task => task.status === 'recruiting');
      const inProgressTasks = taskList.filter(task => task.status === 'in_progress');
      const pendingReviewTasks = taskList.filter(task => task.status === 'pending_review');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

      if (publishedPage === 'active') {
  return (
          <div className="space-y-6">
            {/* 活跃任务页面 */}
            <div className="relative mb-6">
              {/* 左侧箭头 */}
              <NavigationButton
                direction="left"
                onClick={() => setPublishedPage('completed')}
                aria-label="上一页"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10"
              />
              
              {/* 右侧箭头 */}
              <NavigationButton
                direction="right"
                onClick={() => setPublishedPage('completed')}
                aria-label="下一页"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
              />
              
              {/* 分类标题 */}
              <div className="grid grid-cols-3 gap-4 px-12">
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  <h3 className={`font-bold text-lg mb-1 ${
                    theme === 'pixel' ? 'text-pixel-info' : 'text-blue-600'
                  }`}>
                    {theme === 'pixel' ? 'RECRUITING' : '招募中'}
            </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {recruitingTasks.length} 个任务
                  </span>
          </div>
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
                  <h3 className={`font-bold text-lg mb-1 ${
                    theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-600'
                  }`}>
                    {theme === 'pixel' ? 'IN_PROGRESS' : '进行中'}
            </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {inProgressTasks.length} 个任务
                  </span>
          </div>
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
          }`}>
                  <h3 className={`font-bold text-lg mb-1 ${
                    theme === 'pixel' ? 'text-pixel-purple' : 'text-purple-600'
                  }`}>
                    {theme === 'pixel' ? 'PENDING_REVIEW' : '待审核'}
            </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {pendingReviewTasks.length} 个任务
                  </span>
          </div>
          </div>
        </div>

            {/* 任务卡片区域 - 三列布局 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
                {recruitingTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            {inProgressTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
                {pendingReviewTasks.map(task => renderTaskCard(task))}
                    </div>
                  </div>
                </div>
              );
    } else {
        return (
          <div className="space-y-6">
            {/* 已完成/已关闭任务页面 */}
            <div className="relative mb-6">
              {/* 左侧箭头 */}
            <NavigationButton
                direction="left"
                onClick={() => setPublishedPage('active')}
                aria-label="上一页"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10"
            />
              
              {/* 右侧箭头 */}
              <NavigationButton
                direction="right"
                onClick={() => setPublishedPage('active')}
                aria-label="下一页"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
              />
              
              {/* 分类标题 */}
              <div className="grid grid-cols-2 gap-8 px-16">
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  <h3 className={`font-bold text-lg mb-1 ${
                    theme === 'pixel' ? 'text-pixel-success' : 'text-green-600'
          }`}>
              {theme === 'pixel' ? 'COMPLETED' : '已完成'}
            </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {completedTasks.length} 个任务
                  </span>
              </div>
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
                  <h3 className={`font-bold text-lg mb-1 ${
                    theme === 'pixel' ? 'text-pixel-accent' : 'text-red-600'
                  }`}>
                    {theme === 'pixel' ? 'ABANDONED' : '已关闭'}
            </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {abandonedTasks.length} 个任务
                  </span>
          </div>
        </div>
        </div>

            {/* 任务卡片区域 - 两列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {completedTasks.map(task => renderTaskCard(task))}
          </div>
              <div>
                {abandonedTasks.map(task => renderTaskCard(task))}
          </div>
        </div>
      </div>
    );
    }
    } else if (type === 'assigned') {
      // "我领取的"视图 - 按状态分类为四列
      const notStartedTasks = taskList.filter(task => task.status === 'assigned');
      const inProgressTasks = taskList.filter(task => task.status === 'in_progress');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

  return (
    <div className="space-y-6">
          {/* 状态分类标题 */}
          <div className="grid grid-cols-4 gap-4 px-8">
            <div className={`text-center ${
              theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
              <h3 className={`font-bold text-lg mb-1 ${
                theme === 'pixel' ? 'text-pixel-info' : 'text-blue-600'
              }`}>
                {theme === 'pixel' ? 'NOT_STARTED' : '未开始'}
            </h3>
              <span className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
              }`}>
                {notStartedTasks.length} 个任务
              </span>
      </div>
            <div className={`text-center ${
              theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
              <h3 className={`font-bold text-lg mb-1 ${
                theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-600'
              }`}>
                {theme === 'pixel' ? 'IN_PROGRESS' : '进行中'}
              </h3>
              <span className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
              }`}>
                {inProgressTasks.length} 个任务
              </span>
                    </div>
            <div className={`text-center ${
              theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
              <h3 className={`font-bold text-lg mb-1 ${
                theme === 'pixel' ? 'text-pixel-success' : 'text-green-600'
              }`}>
                {theme === 'pixel' ? 'COMPLETED' : '已完成'}
              </h3>
              <span className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
              }`}>
                {completedTasks.length} 个任务
            </span>
                </div>
            <div className={`text-center ${
              theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
              <h3 className={`font-bold text-lg mb-1 ${
                theme === 'pixel' ? 'text-pixel-accent' : 'text-red-600'
              }`}>
                {theme === 'pixel' ? 'ABANDONED' : '已关闭'}
              </h3>
              <span className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
              }`}>
                {abandonedTasks.length} 个任务
              </span>
          </div>
        </div>

          {/* 任务卡片区域 - 四列布局 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              {notStartedTasks.map(task => renderTaskCard(task))}
                </div>
            <div>
              {inProgressTasks.map(task => renderTaskCard(task))}
                    </div>
            <div>
              {completedTasks.map(task => renderTaskCard(task))}
            </div>
            <div>
              {abandonedTasks.map(task => renderTaskCard(task))}
                    </div>
                  </div>
                </div>
              );
    } else {
      // available 视图 - 带有"即将过期"标签
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {taskList.map(task => (
            <div key={task.id} className={`relative ${
              isTaskExpiringSoon(task.end_time || task.deadline || null) ? 'animate-pulse' : ''
            }`}>
              {isTaskExpiringSoon(task.end_time || task.deadline || null) && (
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
            theme === 'pixel'
                    ? 'bg-pixel-warning text-black border-2 border-black'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {theme === 'pixel' ? 'EXPIRING_SOON' : '即将过期'}
                </div>
              )}
              {renderTaskCard(task)}
      </div>
            ))}
      </div>
    );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={theme === 'pixel' ? 'TASK_MANAGER.EXE' : theme === 'modern' ? 'Task Board' : '任务看板'}
        viewSwitcher={{
          views: [
            { id: 'published', name: theme === 'pixel' ? 'MY_PUBLISHED' : theme === 'modern' ? 'My Published' : '我发布的' },
            { id: 'assigned', name: theme === 'pixel' ? 'MY_CLAIMED' : theme === 'modern' ? 'My Claimed' : '我领取的' },
            { id: 'available', name: theme === 'pixel' ? 'AVAILABLE' : theme === 'modern' ? 'Available' : '可领取的' }
          ],
          currentView: view,
          onViewChange: (viewId) => setView(viewId as any)
        }}
        actions={[
          {
            label: theme === 'pixel' ? 'REFRESH' : theme === 'modern' ? 'Refresh' : '刷新',
            variant: 'secondary',
            icon: 'refresh',
            onClick: handleRefresh,
            loading: isRefreshing
          },
          {
            label: theme === 'pixel' ? 'NEW_TASK' : theme === 'modern' ? 'New Task' : '新建任务',
            variant: 'primary',
            icon: 'plus',
            onClick: () => setShowAddForm(true)
          }
        ]}
      />

      {/* Task Columns */}
      <div className="space-y-8">
        {loading || !tasksLoaded || !userProfile ? (
          <LoadingSpinner
            size="lg"
            title={theme === 'pixel' ? 'LOADING TASKS...' : theme === 'modern' ? 'Loading Tasks...' : '正在加载任务列表...'}
            subtitle={theme === 'pixel' ? 'FETCHING DATA...' : theme === 'modern' ? 'Fetching task data from database' : '正在从数据库获取任务数据'}
          />
        ) : (
          <>
        {view === 'published' && (
          <div>
            {renderTaskList(getPublishedTasks(), 'published')}
                  </div>
                  )}

        {view === 'assigned' && (
          <div>
            {renderTaskList(getAssignedTasks(), 'assigned')}
                  </div>
                )}

        {view === 'available' && (
          <div>
            {renderTaskList(getAvailableTasks(), 'available')}
                  </div>
        )}
          </>
                )}
      </div>

      {/* 任务详情弹窗 */}
      {selectedTask && renderTaskDetailModal()}

      {/* 新建任务表单 */}
      <ThemeDialog 
        open={showAddForm} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            setNewTask({
              title: '',
              description: '',
              taskType: 'daily',
              points: 50,
              requiresProof: false,
              // 🎯 统一的时间字段
              start_time: '',
              end_time: '',
              repeat_start: '',
              repeat_end: '',
              // UI控制字段
              isUnlimited: false,
              repeat: 'never',
              endRepeat: 'never',
              // 连续任务字段
              consecutiveCount: 7,
              // 🔧 向后兼容字段
              taskStartTime: '',
              taskEndTime: '',
              repeatStartDate: '',
              endRepeatDate: '',
              taskTimeStart: '',
              taskTimeEnd: '',
              duration: '21days'
            });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {theme === 'pixel' ? 'CREATE_NEW_TASK' : theme === 'modern' ? 'Create New Task' : '新建任务'}
          </DialogTitle>
        </DialogHeader>
        
        <DialogContent>
            
            <div className="space-y-4">
              {/* 1. 任务标题 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'TASK_TITLE' : theme === 'modern' ? 'Task Title' : '任务标题'}
                required
              >
                <ThemeInput
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={theme === 'pixel' ? 'ENTER_TITLE...' : theme === 'modern' ? 'Enter task title...' : '输入任务标题'}
                />
              </ThemeFormField>

              {/* 2. 任务描述 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'TASK_DESCRIPTION' : theme === 'modern' ? 'Task Description' : '任务描述'}
              >
                <ThemeTextarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder={theme === 'pixel' ? 'ENTER_DESCRIPTION...' : theme === 'modern' ? 'Enter task description...' : '输入任务描述'}
                />
              </ThemeFormField>

              {/* 3. 任务类型 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'TASK_TYPE' : theme === 'modern' ? 'Task Type' : '任务类型'}
                required
              >
                <ThemeSelect
                  value={newTask.taskType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value as 'daily' | 'habit' | 'special' }))}
                >
                  <option value="daily">{theme === 'pixel' ? 'DAILY_TASK' : theme === 'modern' ? 'Daily Task' : '日常任务'}</option>
                  <option value="habit">{theme === 'pixel' ? 'HABIT_TASK' : theme === 'modern' ? 'Habit Task' : '习惯任务'}</option>
                  <option value="special">{theme === 'pixel' ? 'SPECIAL_TASK' : theme === 'modern' ? 'Special Task' : '特殊任务'}</option>
                </ThemeSelect>
              </ThemeFormField>

              {/* 4. 积分奖励 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'POINTS_REWARD' : theme === 'modern' ? 'Points Reward' : '积分奖励'}
                required
                description={newTask.repeat !== 'never' 
                  ? (theme === 'modern' ? 'Repeating task: earn this reward for each completion' : '重复性任务：每次完成都可获得此积分奖励')
                  : (theme === 'modern' ? 'One-time task: earn this reward upon completion' : '一次性任务：完成后获得此积分奖励')
                }
              >
                <ThemeInput
                  type="number"
                  value={newTask.points}
                  onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="1000"
                  placeholder={theme === 'pixel' ? '50' : theme === 'modern' ? 'Enter points (1-1000)' : '输入积分 (1-1000)'}
                />
              </ThemeFormField>

              {/* 5. 需要凭证 */}
              <ThemeCheckbox
                label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要提交凭证'}
                    checked={newTask.requiresProof}
                onChange={(e) => setNewTask(prev => ({ ...prev, requiresProof: e.target.checked }))}
              />

              {/* 6. 重复频率 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                required
              >
                <ThemeSelect
                  value={newTask.repeat}
                  onChange={(e) => setNewTask(prev => ({ ...prev, repeat: e.target.value as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' }))}
                >
                  <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复'}</option>
                  <option value="daily">{theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每天'}</option>
                  <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周'}</option>
                  <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '每两周'}</option>
                  <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月'}</option>
                  <option value="yearly">{theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年'}</option>
                </ThemeSelect>
              </ThemeFormField>

              {/* 7. 是否不限时任务 */}
              <ThemeCheckbox
                label={theme === 'pixel' ? 'UNLIMITED_TIME' : theme === 'modern' ? 'Unlimited Time Task' : '不限时任务'}
                checked={newTask.isUnlimited}
                onChange={(e) => setNewTask(prev => ({ ...prev, isUnlimited: e.target.checked }))}
                description={theme === 'pixel' ? 'NO_TIME_LIMIT' : theme === 'modern' ? 'Task can be completed at any time without deadline' : '任务可以在任何时间完成，没有截止日期'}
              />

              {/* 连续次数设置（仅当重复+不限时任务时显示） */}
              {newTask.repeat !== 'never' && newTask.isUnlimited && (
                <ThemeFormField
                  label={theme === 'pixel' ? 'CONSECUTIVE_COUNT' : theme === 'modern' ? 'Consecutive Count' : '连续次数'}
                  description={(() => {
                    const getUnitName = () => {
                      switch (newTask.repeat) {
                        case 'daily': return theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天';
                        case 'weekly': return theme === 'pixel' ? 'WEEKS' : theme === 'modern' ? 'weeks' : '周';
                        case 'biweekly': return theme === 'pixel' ? 'PERIODS' : theme === 'modern' ? 'periods' : '期';
                        case 'monthly': return theme === 'pixel' ? 'MONTHS' : theme === 'modern' ? 'months' : '月';
                        case 'yearly': return theme === 'pixel' ? 'YEARS' : theme === 'modern' ? 'years' : '年';
                        default: return theme === 'pixel' ? 'TIMES' : theme === 'modern' ? 'times' : '次';
                      }
                    };
                    return theme === 'pixel' ? `CONSECUTIVE_${getUnitName()}_NEEDED` : theme === 'modern' ? `Number of consecutive ${getUnitName()} required` : `需要连续完成的${getUnitName()}数`;
                  })()}
                >
                  <ThemeInput
                    type="number"
                    value={newTask.consecutiveCount || 7}
                    onChange={(e) => setNewTask(prev => ({ ...prev, consecutiveCount: parseInt(e.target.value) || 7 }))}
                    placeholder={theme === 'pixel' ? 'ENTER_COUNT' : theme === 'modern' ? 'Enter count...' : '输入次数...'}
                    min="1"
                    max="365"
                  />
                </ThemeFormField>
              )}

              {/* 8. 任务时间字段（仅当不是不限时任务时显示） */}
              {!newTask.isUnlimited && renderTaskTimeFields()}

            </div>
        </DialogContent>
        
        <DialogFooter>
          <ThemeButton
            variant="secondary"
            onClick={() => {
              setShowAddForm(false);
              setNewTask({
                title: '',
                description: '',
                taskType: 'daily',
                points: 50,
                requiresProof: false,
                // 🎯 统一的时间字段
                start_time: '',
                end_time: '',
                repeat_start: '',
                repeat_end: '',
                // UI控制字段
                isUnlimited: false,
                repeat: 'never',
                endRepeat: 'never',
                // 连续任务字段
                consecutiveCount: 7,
                // 🔧 向后兼容字段
                taskStartTime: '',
                taskEndTime: '',
                repeatStartDate: '',
                endRepeatDate: '',
                taskTimeStart: '',
                taskTimeEnd: '',
                duration: '21days'
              });
            }}
          >
            {theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消'}
          </ThemeButton>
          <ThemeButton
            variant="primary"
            onClick={handleCreateTask}
          >
            {theme === 'pixel' ? 'CREATE_TASK' : theme === 'modern' ? 'Create Task' : '创建任务'}
          </ThemeButton>
        </DialogFooter>
      </ThemeDialog>
      
      {/* 开发工具面板 */}
      <DevTools />
    </div>
  );
};

export default TaskBoard; 
