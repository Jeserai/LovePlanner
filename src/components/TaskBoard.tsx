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
  ConfirmDialog,
  useToast,
  AlertDialog
} from './ui/Components';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import { userService, pointService, taskService } from '../services/database';
import { habitTaskService, calculateLatestJoinDate, canJoinHabitTask } from '../services/habitTaskService';
import type { PersonalHabitChallenge } from '../services/habitTaskService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { globalEventService, GlobalEvents } from '../services/globalEventService';
import type { Task, CreateTaskForm, EditTaskForm } from '../types/task';

// 🎯 使用统一的Task类型，不再重复定义

// 编辑任务的状态类型（使用新数据结构）
interface EditTaskState {
  title?: string;
  description?: string;
  task_type?: 'daily' | 'habit' | 'special';
  points?: number;
  requires_proof?: boolean;
  repeat_frequency?: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever';
  earliest_start_time?: string;
  task_deadline?: string;
  required_count?: number;
  daily_time_start?: string;
  daily_time_end?: string;
  repeat_weekdays?: number[];
  
  // UI控制字段
  isUnlimited?: boolean;
  endRepeat?: 'never' | 'on_date';
}

interface TaskBoardProps {
  currentUser?: string | null;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userProfile } = useUser();
  const { addToast } = useToast();
  const [view, setView] = useState<'published' | 'assigned' | 'available'>('published');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [publishedPage, setPublishedPage] = useState<string>('active'); // 添加分页状态
  // 🎯 创建任务表单状态 - 完全匹配CreateTaskForm + UI控制字段
  const [newTask, setNewTask] = useState<CreateTaskForm & {
    isUnlimited: boolean;
    endRepeat: 'never' | 'on_date';
  }>({
    title: '',
    description: '',
    task_type: 'daily',
    points: 50,
    requires_proof: false,
    repeat_frequency: 'never',
    
    // 时间配置 - 匹配数据库字段
    earliest_start_time: undefined,
    required_count: undefined,
    task_deadline: undefined,
    
    // 重复配置 - 匹配数据库字段
    repeat_weekdays: undefined,
    daily_time_start: undefined,
    daily_time_end: undefined,
    
    // UI控制字段
    isUnlimited: false,
    endRepeat: 'never'
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
  
  // 🎯 确认对话框状态
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<'abandon' | 'delete'>('abandon');
  
  // 调试信息
  console.log('📋 TaskBoard 加载状态:', { loading, tasksLoaded, user: !!user, tasksCount: tasks.length });
  const [userMap, setUserMap] = useState<{[id: string]: string}>({});

  // 🎯 工具函数
  // 检查任务是否已过期
  const isTaskOverdue = (task: Task): boolean => {
    const task_deadline = task.task_deadline;
    if (!task_deadline) return false;
    const now = new Date();
    const task_deadlineDate = new Date(task_deadline);
    return now > task_deadlineDate;
  };

  // 计算任务持续天数（用于习惯任务）
  const getTaskDuration = (task: Task): number => {
    if (!task.earliest_start_time || !task.task_deadline) return 30; // 默认30天
    const start = new Date(task.earliest_start_time);
    const end = new Date(task.task_deadline);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // 手动刷新功能
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 模拟API开关
  const [useMockApi, setUseMockApi] = useState(false);
  
  // 编辑任务状态
  const [isEditing, setIsEditing] = useState(false);
  const [editTask, setEditTask] = useState<EditTaskState>({});
  
  // 计算持续时间（天数）
  const calculateDuration = (earliest_start_time: string, task_deadline: string): number => {
    if (!earliest_start_time || !task_deadline) return 0;
    const start = new Date(earliest_start_time);
    const end = new Date(task_deadline);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 包含开始日期
    return diffDays > 0 ? diffDays : 0;
  };

  // 根据开始日期和持续时间计算结束日期
  const calculateEndDate = (earliest_start_time: string, duration: number): string => {
    if (!earliest_start_time || duration <= 0) return '';
    const start = new Date(earliest_start_time);
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
  const getDurationLabel = (earliest_start_time?: string, task_deadline?: string): string => {
    if (!earliest_start_time || !task_deadline) return '--';
    
    const start = new Date(earliest_start_time);
    const end = new Date(task_deadline);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '--';
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 25) return '21天';
    if (diffDays <= 35) return '1个月';
    if (diffDays <= 200) return '6个月';
    return '1年';
  };


  // 注意：现在使用taskService，统一的任务数据结构

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
        // 🎯 使用新的任务服务获取任务
        const newTasks = await taskService.getTasks(coupleId);
        setTasks(newTasks);
        setTasksLoaded(true);
        console.log('✅ 使用新任务服务加载任务成功:', newTasks.length, '个任务');
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
      // 🎯 使用新的任务服务重新加载任务
      const newTasks = await taskService.getTasks(coupleId);
      setTasks(newTasks);
      setTasksLoaded(true);
      console.log('✅ 使用新任务服务重新加载任务成功:', newTasks.length, '个任务');
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
      if (updates.assignee_id !== undefined) dbUpdates.assignee_id = updates.assignee_id;
      if (updates.proof_url !== undefined) dbUpdates.proof_url_url = updates.proof_url;
      if (updates.review_comment !== undefined) dbUpdates.review_comment = updates.review_comment;
      if (updates.submitted_at) dbUpdates.submitted_at = updates.submitted_at;

      // 2. 检查任务是否存在（防止无效操作）
      const taskBefore = tasks.find(t => t.id === taskId);
      if (!taskBefore) {
        throw new Error(`找不到ID为 ${taskId} 的任务`);
      }

      // 3. 更新数据库 - 使用新任务服务
      await taskService.updateTask({ id: taskId, ...updates } as EditTaskForm);

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
      const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
      const task_typeDescription = taskType === 'repeat' ? '重复性任务' : '一次性任务';
      const description = `完成${task_typeDescription}：${task.title}`;
      
      const success = await pointService.addTransaction(
        userId,
        coupleId,
        task.points,
        'task_completion',
        description,
        task.id
      );
      
      if (success) {
        const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
        const pointsMessage = taskType === 'repeat' 
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
      await taskService.assignTask(taskId, currentUserId);
      await reloadTasks();
      
      // 成功反馈
      addToast({
        variant: 'success',
        title: '任务领取成功',
        description: '任务已成功分配给您，可以开始执行了！'
      });
    } catch (error: any) {
      console.error('❌ 领取任务失败:', error?.message);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: '领取任务失败',
        description: error?.message || '请稍后重试'
      });
      
      throw error;
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await taskService.startTask(taskId);
      await reloadTasks();
      
      // 成功反馈
      addToast({
        variant: 'success',
        title: '任务已开始',
        description: '任务状态已更新为进行中'
      });
    } catch (error: any) {
      console.error('❌ 开始任务失败:', error?.message);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: '开始任务失败',
        description: error?.message || '请稍后重试'
      });
      
      throw error;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      // 找到任务以检查是否需要凭证
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // 检查任务是否过期，如果过期则移动到abandoned状态
      if (isTaskOverdue(task)) {
        await taskService.abandonTask(taskId);
        await reloadTasks();
        return;
      }

      // 使用适配器完成任务
      await taskService.completeTask(taskId);
      await reloadTasks();
      
      // 如果不需要凭证，奖励积分给完成任务的用户
      if (!task.requires_proof) {
        await awardTaskPoints(task, currentUserId);
      }
      
      // 成功反馈
      addToast({
        variant: 'success',
        title: '任务完成',
        description: task.requires_proof ? '任务已提交，等待审核' : `任务完成！获得 ${task.points} 积分`
      });
    } catch (error: any) {
      console.error('❌ 完成任务失败:', error);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: '完成任务失败',
        description: error?.message || '请稍后重试'
      });
      
      throw error;
    }
  };

    const handleReviewTask = async (taskId: string, approved: boolean, comment?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (approved) {
      await updateTaskInDatabase(taskId, { 
        status: 'completed',
        review_comment: comment 
      });
      
      // 审核通过时奖励积分（如果任务被分配给其他用户）
      if (task.assignee_id && currentUserId !== task.assignee_id) {
        // 这里需要获取assignee_id的实际ID，因为task.assignee_id可能是显示名
        const assignee_idId = Object.keys(userMap).find(id => userMap[id] === task.assignee_id) || task.assignee_id;
        await awardTaskPoints(task, assignee_idId);
      }
    } else {
      await updateTaskInDatabase(taskId, { 
        status: 'assigned',
        review_comment: comment 
      });
    }
  };

  // 放弃任务 - 显示确认对话框
  const handleAbandonTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 只有assigned状态的任务才能手动放弃
    if (task.status === 'assigned') {
      setTaskToDelete(taskId);
      setDeleteAction('abandon');
      setShowDeleteTaskConfirm(true);
    }
  };

  // 统一的确认删除/放弃任务
  const confirmTaskAction = async () => {
    if (!taskToDelete) return;
    
    try {
      const task = tasks.find(t => t.id === taskToDelete);
      if (!task) return;
      
      if (deleteAction === 'abandon') {
        console.log('🚫 放弃任务:', { taskId: taskToDelete });
        await taskService.abandonTask(taskToDelete);
        
        // 成功反馈
        addToast({
          variant: 'warning',
          title: '任务已放弃',
          description: `任务"${task.title}"已从您的任务列表中移除`
        });
      } else {
        console.log('🗑️ 删除任务:', { taskId: taskToDelete });
        
        // 这里需要调用删除任务的API
        // 暂时使用abandon作为删除的替代方案
        await taskService.abandonTask(taskToDelete);
        
        // 成功反馈
        addToast({
          variant: 'success',
          title: '任务已删除',
          description: `任务"${task.title}"已被永久删除`
        });
      }
      
      await reloadTasks();
      
      // 关闭任务详情（如果当前显示的是被操作的任务）
      if (selectedTask?.id === taskToDelete) {
        setSelectedTask(null);
        setIsEditing(false);
        setEditTask({});
      }
    } catch (error: any) {
      console.error(`❌ ${deleteAction === 'abandon' ? '放弃' : '删除'}任务失败:`, error);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: `${deleteAction === 'abandon' ? '放弃' : '删除'}任务失败`,
        description: error?.message || '请稍后重试'
      });
    } finally {
      setShowDeleteTaskConfirm(false);
      setTaskToDelete(null);
      setDeleteAction('abandon');
    }
  };

  // 删除任务（仅限任务所有者）
  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 只有recruiting或abandoned状态的任务才能被删除
    if (task.status === 'recruiting' || task.status === 'abandoned') {
      setTaskToDelete(taskId);
      setDeleteAction('delete');
      setShowDeleteTaskConfirm(true);
    }
  };

  // 重新发布任务
  const handleRepublishTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.status !== 'abandoned') return;
      
      console.log('📢 重新发布任务:', { taskId });
      await updateTaskInDatabase(taskId, { 
        status: 'recruiting',
        assignee_id: null,  // 使用null而不是undefined
        proof_url: null,
        review_comment: null
      });
      
      await reloadTasks();
      
      // 成功反馈
      addToast({
        variant: 'success',
        title: '任务已重新发布',
        description: `任务"${task.title}"已重新发布，等待其他人领取`
      });
    } catch (error: any) {
      console.error('❌ 重新发布任务失败:', error);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: '重新发布失败',
        description: error?.message || '请稍后重试'
      });
    }
  };

  // 提交凭证
  const handleSubmitProof = async (taskId: string, proof_url: string) => {
    await updateTaskInDatabase(taskId, { 
      proof_url,
      status: 'pending_review',
      submitted_at: new Date().toISOString()
    });
  };

  // 🎯 编辑任务 - 使用新数据结构
  const handleEditTask = (task: Task) => {
    console.log('🔧 编辑任务数据:', task);
    
    // 判断是否为不限时任务的逻辑
    // 不限时任务：既没有开始时间也没有结束时间，与重复频率无关
    const isTaskUnlimited = () => {
      return !task.earliest_start_time && !task.task_deadline;
    };
    
    // 将任务数据转换为编辑状态
    const editData: EditTaskState = {
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      points: task.points,
      requires_proof: task.requires_proof,
      repeat_frequency: task.repeat_frequency,
      earliest_start_time: task.earliest_start_time || '',
      task_deadline: task.task_deadline || '',
      required_count: task.required_count || undefined,
      daily_time_start: task.daily_time_start || '',
      daily_time_end: task.daily_time_end || '',
      repeat_weekdays: task.repeat_weekdays || [],
      
      // UI控制字段
      isUnlimited: isTaskUnlimited(),
      endRepeat: task.task_deadline ? 'on_date' : 'never'
    };
    
    console.log('🔧 编辑状态数据:', editData);
    
    setEditTask(editData);
    setIsEditing(true);
  };

  // 🎯 保存编辑的任务 - 使用新数据结构
  const handleSaveEdit = async () => {
    if (!selectedTask || !editTask.title?.trim()) {
      alert('请填写任务标题');
      return;
    }

    try {
      // 🎯 验证逻辑（参考创建任务的验证）
      if (!editTask.isUnlimited) {
        if (editTask.repeat_frequency === 'never') {
          // 一次性任务：开始时间和结束时间至少要有一个
          const hasStartTime = Boolean(editTask.earliest_start_time);
          const hasEndTime = Boolean(editTask.task_deadline);
          
          if (!hasStartTime && !hasEndTime) {
            alert('一次性任务必须设置开始时间或结束时间');
            return;
          }
          
      const now = new Date();
          
          // 验证开始时间（如果有）
          if (hasStartTime) {
            const startTime = new Date(editTask.earliest_start_time!);
            if (startTime <= now) {
              alert('任务开始时间不能是过去时间');
              return;
            }
          }
          
          // 验证结束时间（如果有）
          if (hasEndTime) {
            const endTime = new Date(editTask.task_deadline!);
            if (endTime <= now) {
              alert('任务结束时间不能是过去时间');
              return;
            }
          }
          
          // 如果同时设置了开始和结束时间，验证时间顺序
          if (hasStartTime && hasEndTime) {
            const startTime = new Date(editTask.earliest_start_time!);
            const endTime = new Date(editTask.task_deadline!);
            if (startTime >= endTime) {
              alert('任务开始时间必须早于结束时间');
              return;
            }
          }
        } else {
          // 🎯 重复任务：最早开始时间必填
          if (!editTask.earliest_start_time) {
            alert('请设置重复任务的最早开始时间');
            return;
          }
          
          // 验证开始时间不能是过去
          const startTime = new Date(editTask.earliest_start_time);
    const now = new Date();
          if (startTime <= now) {
            alert('重复任务的开始时间不能是过去时间');
            return;
          }
          
          // 验证截止时间（如果设置了）
          if (editTask.task_deadline) {
            const deadlineTime = new Date(editTask.task_deadline);
            if (deadlineTime <= now) {
              alert('截止时间不能是过去时间');
              return;
            }
            
            if (deadlineTime <= startTime) {
              alert('截止时间必须晚于开始时间');
              return;
            }
          }
          
          // 验证重复次数（如果设置了）
          if (editTask.required_count && editTask.required_count < 1) {
            alert('重复次数必须大于0');
            return;
          }
        }
      }
      
      // 如果指定了任务时间段，验证时间段有效性
      if (editTask.daily_time_start && editTask.daily_time_end) {
        if (editTask.daily_time_start >= editTask.daily_time_end) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      } else if (editTask.daily_time_start && !editTask.daily_time_end) {
        alert('指定了开始时间，请同时指定结束时间');
        return;
      } else if (!editTask.daily_time_start && editTask.daily_time_end) {
        alert('指定了结束时间，请同时指定开始时间');
        return;
      }

      // 🎯 构建更新数据
      const updateData: EditTaskForm = {
        id: selectedTask.id,
        title: editTask.title.trim(),
        description: editTask.description || '',
        points: editTask.points || 50,
        task_type: editTask.task_type || 'daily',
        repeat_frequency: editTask.repeat_frequency || 'never',
        earliest_start_time: editTask.earliest_start_time || undefined,
        task_deadline: editTask.task_deadline || undefined,
        required_count: editTask.repeat_frequency === 'never' ? 1 : (editTask.required_count || undefined),
        daily_time_start: editTask.daily_time_start || undefined,
        daily_time_end: editTask.daily_time_end || undefined,
        requires_proof: editTask.requires_proof || false
      };

      console.log('🚀 更新任务数据:', updateData);
      
      // 直接使用新的任务服务更新任务
      await taskService.updateTask(updateData);

      // 刷新任务列表
      await reloadTasks();
      
      // 发送全局事件
      globalEventService.emit('TASKS_UPDATED');
      
      // 关闭编辑模式
      setIsEditing(false);
      setEditTask({});
      setSelectedTask(null);
      
      console.log('✅ 任务更新成功');
      
      // 成功反馈
      addToast({
        variant: 'success',
        title: '任务更新成功',
        description: `任务"${editTask.title}"已成功更新`
      });
    } catch (error: any) {
      console.error('❌ 更新任务失败:', error);
      
      // 错误反馈
      addToast({
        variant: 'error',
        title: '更新任务失败',
        description: error?.message || '请检查输入信息后重试'
      });
    }
  };

  // 🎯 取消编辑 - 检查是否有未保存的更改
  const handleCancelEdit = () => {
    // 检查是否有未保存的更改
    const hasChanges = selectedTask && (
      editTask.title !== selectedTask.title ||
      editTask.description !== selectedTask.description ||
      editTask.task_type !== selectedTask.task_type ||
      editTask.points !== selectedTask.points ||
      editTask.requires_proof !== selectedTask.requires_proof ||
      editTask.repeat_frequency !== selectedTask.repeat_frequency ||
      editTask.earliest_start_time !== (selectedTask.earliest_start_time || '') ||
      editTask.task_deadline !== (selectedTask.task_deadline || '') ||
      editTask.required_count !== selectedTask.required_count ||
      editTask.daily_time_start !== (selectedTask.daily_time_start || '') ||
      editTask.daily_time_end !== (selectedTask.daily_time_end || '')
    );

    if (hasChanges) {
      // 有未保存的更改，显示确认对话框
      setShowCancelEditConfirm(true);
    } else {
      // 没有更改，直接退出编辑模式
      confirmCancelEdit();
    }
  };

  // 确认取消编辑
  const confirmCancelEdit = () => {
    setIsEditing(false);
    setEditTask({});
    setShowCancelEditConfirm(false);
    
    // 提示用户更改已丢弃
    addToast({
      variant: 'warning',
      title: '编辑已取消',
      description: '未保存的更改已丢弃'
    });
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

    // 🎯 使用新数据结构的验证逻辑
    if (!newTask.isUnlimited) {
      if (newTask.repeat_frequency === 'never') {
        // 一次性任务：开始时间和结束时间至少要有一个
        const hasStartTime = Boolean(newTask.earliest_start_time);
        const hasEndTime = Boolean(newTask.task_deadline);
        
        if (!hasStartTime && !hasEndTime) {
          alert('限时任务必须设置开始时间或结束时间（或两者都设置）');
          return;
        }
        
        const now = new Date();
        
        // 验证开始时间（如果有）
        if (hasStartTime) {
          const startTime = new Date(newTask.earliest_start_time!);
          if (startTime <= now) {
            alert('任务开始时间不能是过去时间');
            return;
          }
        }
        
        // 验证结束时间（如果有）
        if (hasEndTime) {
          const endTime = new Date(newTask.task_deadline!);
          if (endTime <= now) {
            alert('任务结束时间不能是过去时间');
            return;
          }
        }
        
        // 如果同时有开始和结束时间，验证时间顺序
        if (hasStartTime && hasEndTime) {
          const startTime = new Date(newTask.earliest_start_time!);
          const endTime = new Date(newTask.task_deadline!);
          if (startTime >= endTime) {
            alert('任务开始时间必须早于结束时间');
            return;
          }
        }
                  } else {
          // 🎯 重复任务：最早开始时间必填
          if (!newTask.earliest_start_time) {
            alert('请设置重复任务的最早开始时间');
            return;
          }
          
          // 验证开始时间不能是过去
          const startTime = new Date(newTask.earliest_start_time);
          const now = new Date();
          if (startTime <= now) {
            alert('重复任务的开始时间不能是过去时间');
            return;
          }
          
          // 验证截止时间（如果设置了）
          if (newTask.task_deadline) {
            const deadlineTime = new Date(newTask.task_deadline);
            if (deadlineTime <= now) {
              alert('截止时间不能是过去时间');
              return;
            }
            
            if (deadlineTime <= startTime) {
              alert('截止时间必须晚于开始时间');
              return;
            }
          }
          
          // 验证重复次数（如果设置了）
          if (newTask.required_count && newTask.required_count < 1) {
            alert('重复次数必须大于0');
            return;
          }
        }
      
      // 如果指定了任务时间段，验证时间段有效性
      if (newTask.daily_time_start && newTask.daily_time_end) {
        if (newTask.daily_time_start >= newTask.daily_time_end) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      } else if (newTask.daily_time_start && !newTask.daily_time_end) {
        alert('指定了开始时间，请同时指定结束时间');
        return;
      } else if (!newTask.daily_time_start && newTask.daily_time_end) {
        alert('指定了结束时间，请同时指定开始时间');
        return;
      }
    }

    if (user && coupleId) {
      try {
        // 🎯 直接使用新数据结构创建任务
        const createTaskData = {
          title: newTask.title.trim(),
          description: newTask.description || '',
          points: newTask.points,
          task_type: newTask.task_type,
          repeat_frequency: newTask.repeat_frequency,
          earliest_start_time: newTask.earliest_start_time || undefined,
          task_deadline: newTask.task_deadline || undefined,
          required_count: newTask.repeat_frequency === 'never' ? 1 : (newTask.required_count || undefined),
          daily_time_start: newTask.daily_time_start || undefined,
          daily_time_end: newTask.daily_time_end || undefined,
          requires_proof: newTask.requires_proof
        };

        console.log('🚀 创建任务数据:', createTaskData);
        
        // 直接使用新的任务服务创建任务
        await taskService.createTask(createTaskData, user.id, coupleId);
        await reloadTasks(); // 重新加载数据
        
        // 发布全局事件，通知其他组件任务数据已更新
        globalEventService.emit(GlobalEvents.TASKS_UPDATED);

        console.log('✅ 任务创建成功');
        
        // 成功反馈
        addToast({
          variant: 'success',
          title: '任务创建成功',
          description: `任务"${newTask.title}"已成功创建`
        });

      } catch (error: any) {
        console.error('❌ 创建任务失败:', error);
        
        // 错误反馈
        addToast({
          variant: 'error',
          title: '创建任务失败',
          description: error?.message || '请检查输入信息后重试'
        });
        return;
      }
                    } else {
      addToast({
        variant: 'error',
        title: '创建任务失败',
        description: '用户未登录或缺少情侣关系信息'
      });
      return;
    }

            // 重置表单
        setNewTask({
          title: '',
          description: '',
          task_type: 'daily',
          points: 50,
          requires_proof: false,
          // 🎯 新数据结构字段
          repeat_frequency: 'never',
          earliest_start_time: '',
          task_deadline: '',
          required_count: 1,
          daily_time_start: '',
          daily_time_end: '',
          // UI控制字段
          isUnlimited: false,
          endRepeat: 'never'
        });
        setShowAddForm(false);
  };

  // 🎯 渲染任务时间字段（使用新数据结构）
  const renderTaskTimeFields = () => {

    if (newTask.repeat_frequency === 'never') {
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
              value={newTask.earliest_start_time}
              onChange={(e) => setNewTask(prev => ({ ...prev, earliest_start_time: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
          </ThemeFormField>

          {/* 最晚结束时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'LATEST_END_TIME' : theme === 'modern' ? 'Latest End Time' : '最晚结束时间'}
            description={theme === 'pixel' ? 'WHEN_MUST_FINISH' : theme === 'modern' ? 'When must this task be finished? (Leave empty if no task_deadline)' : '任务最晚什么时候必须完成？（留空表示没有截止时间）'}
          >
            <ThemeInput
                  type="datetime-local"
              value={newTask.task_deadline}
              onChange={(e) => setNewTask(prev => ({ ...prev, task_deadline: e.target.value }))}
              min={newTask.earliest_start_time || new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>
              </div>
      );
    } else {
        // 重复任务：按照要求的字段顺序
      return (
          <div className="space-y-4">
            <div className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-textMuted' : 
              theme === 'modern' ? 'text-slate-600' : 'text-gray-600'
            }`}>
              {theme === 'pixel' ? 'REPEAT_TASK_CONFIG' : 
               theme === 'modern' ? 'Recurring task configuration' : 
               '重复任务配置'}
          </div>

            {/* 1. 最早开始时间（必填） */}
            <ThemeFormField
              label={theme === 'pixel' ? 'EARLIEST_START_TIME' : theme === 'modern' ? 'Earliest Start Time' : '最早开始时间'}
              required
              description={theme === 'pixel' ? 'WHEN_CAN_START_REPEATING' : theme === 'modern' ? 'When can this recurring task start' : '重复任务最早什么时候可以开始'}
            >
              <ThemeInput
                type="datetime-local"
                value={newTask.earliest_start_time || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, earliest_start_time: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </ThemeFormField>

            {/* 2. 重复次数（可选） */}
            <ThemeFormField
              label={theme === 'pixel' ? 'REPEAT_COUNT' : theme === 'modern' ? 'Repeat Count' : '重复次数'}
              description={theme === 'pixel' ? 'HOW_MANY_TIMES_REPEAT' : theme === 'modern' ? 'How many times should this task repeat? (Leave empty for unlimited)' : '任务需要重复多少次？（留空表示无限重复）'}
            >
              <ThemeInput
                type="number"
                value={newTask.required_count || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, required_count: parseInt(e.target.value) || undefined }))}
                placeholder={theme === 'pixel' ? 'UNLIMITED_IF_EMPTY' : theme === 'modern' ? 'Unlimited if empty' : '留空表示无限重复'}
                min="1"
              />
            </ThemeFormField>

            {/* 3. 截止时间（可选） */}
            <ThemeFormField
              label={theme === 'pixel' ? 'DEADLINE' : theme === 'modern' ? 'Deadline' : '截止时间'}
              description={theme === 'pixel' ? 'WHEN_MUST_FINISH' : theme === 'modern' ? 'When must this recurring task be finished? (Leave empty for no deadline)' : '重复任务最晚什么时候必须完成？（留空表示没有截止时间）'}
            >
              <ThemeInput
                type="datetime-local"
                value={newTask.task_deadline || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, task_deadline: e.target.value }))}
                min={newTask.earliest_start_time || new Date().toISOString().slice(0, 16)}
              />
            </ThemeFormField>

            {/* 4. 每日任务时间段（可选） */}
            <ThemeFormField
              label={theme === 'pixel' ? 'DAILY_TIME_WINDOW' : theme === 'modern' ? 'Daily Time Window' : '每日任务时间段'}
              description={theme === 'pixel' ? 'OPTIONAL_DAILY_TIME_LIMIT' : theme === 'modern' ? 'Optional: Specify time window for daily task completion' : '可选：指定每日任务完成的时间窗口'}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                    {theme === 'pixel' ? 'FROM' : theme === 'modern' ? 'From' : '开始时间'}
                  </label>
                  <ThemeInput
                    type="time"
                    value={newTask.daily_time_start || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, daily_time_start: e.target.value }))}
                  />
              </div>
              <div>
                  <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                    {theme === 'pixel' ? 'TO' : theme === 'modern' ? 'To' : '结束时间'}
                  </label>
                  <ThemeInput
                  type="time"
                    value={newTask.daily_time_end || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, daily_time_end: e.target.value }))}
                  />
              </div>
            </div>
            </ThemeFormField>
            </div>
          );
      }
  };

  // 🎯 格式化日期时间为datetime-local输入格式
  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // 🎯 渲染编辑任务的时间字段（使用新数据结构）
  const renderEditTaskTimeFields = () => {
    if (editTask.repeat_frequency === 'never') {
      // 一次性任务：开始时间和结束时间都是可选的，但至少要有一个
      return (
        <div className="space-y-4">
          <div className={`text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted' : 
            theme === 'modern' ? 'text-slate-600' : 'text-gray-600'
          }`}>
            {theme === 'pixel' ? 'TIME_CONSTRAINT_OPTIONAL' :
             theme === 'modern' ? 'Time constraints (optional)' :
             '时间限制（可选）'}
          </div>

          {/* 开始时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'START_TIME' : theme === 'modern' ? 'Start Time' : '开始时间'}
            description={theme === 'pixel' ? 'WHEN_CAN_START' : theme === 'modern' ? 'When can this task be started' : '任务什么时候可以开始'}
          >
            <ThemeInput
                  type="datetime-local"
              value={formatDateTimeLocal(editTask.earliest_start_time)}
              onChange={(e) => setEditTask(prev => ({ ...prev, earliest_start_time: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
          </ThemeFormField>

          {/* 结束时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'END_TIME' : theme === 'modern' ? 'End Time' : '结束时间'}
            description={theme === 'pixel' ? 'WHEN_MUST_FINISH' : theme === 'modern' ? 'When must this task be finished' : '任务什么时候必须完成'}
          >
            <ThemeInput
                  type="datetime-local"
              value={formatDateTimeLocal(editTask.task_deadline)}
              onChange={(e) => setEditTask(prev => ({ ...prev, task_deadline: e.target.value }))}
              min={formatDateTimeLocal(editTask.earliest_start_time) || new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>
            </div>
      );
    } else {
      // 重复任务：按照要求的字段顺序
      return (
        <div className="space-y-4">
          <div className={`text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted' : 
            theme === 'modern' ? 'text-slate-600' : 'text-gray-600'
          }`}>
            {theme === 'pixel' ? 'REPEAT_TASK_CONFIG' : 
             theme === 'modern' ? 'Recurring task configuration' : 
             '重复任务配置'}
          </div>

          {/* 1. 最早开始时间（必填） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'EARLIEST_START_TIME' : theme === 'modern' ? 'Earliest Start Time' : '最早开始时间'}
            required
            description={theme === 'pixel' ? 'WHEN_CAN_START_REPEATING' : theme === 'modern' ? 'When can this recurring task start' : '重复任务最早什么时候可以开始'}
          >
            <ThemeInput
              type="datetime-local"
              value={formatDateTimeLocal(editTask.earliest_start_time)}
              onChange={(e) => setEditTask(prev => ({ ...prev, earliest_start_time: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>

          {/* 2. 重复次数（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'REPEAT_COUNT' : theme === 'modern' ? 'Repeat Count' : '重复次数'}
            description={theme === 'pixel' ? 'HOW_MANY_TIMES_REPEAT' : theme === 'modern' ? 'How many times should this task repeat? (Leave empty for unlimited)' : '任务需要重复多少次？（留空表示无限重复）'}
          >
            <ThemeInput
              type="number"
              value={editTask.required_count || ''}
              onChange={(e) => setEditTask(prev => ({ ...prev, required_count: parseInt(e.target.value) || undefined }))}
              placeholder={theme === 'pixel' ? 'UNLIMITED_IF_EMPTY' : theme === 'modern' ? 'Unlimited if empty' : '留空表示无限重复'}
              min="1"
            />
          </ThemeFormField>

          {/* 3. 截止时间（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'DEADLINE' : theme === 'modern' ? 'Deadline' : '截止时间'}
            description={theme === 'pixel' ? 'WHEN_MUST_FINISH' : theme === 'modern' ? 'When must this recurring task be finished? (Leave empty for no deadline)' : '重复任务最晚什么时候必须完成？（留空表示没有截止时间）'}
          >
            <ThemeInput
              type="datetime-local"
              value={formatDateTimeLocal(editTask.task_deadline)}
              onChange={(e) => setEditTask(prev => ({ ...prev, task_deadline: e.target.value }))}
              min={formatDateTimeLocal(editTask.earliest_start_time) || new Date().toISOString().slice(0, 16)}
            />
          </ThemeFormField>

          {/* 4. 每日任务时间段（可选） */}
          <ThemeFormField
            label={theme === 'pixel' ? 'DAILY_TIME_WINDOW' : theme === 'modern' ? 'Daily Time Window' : '每日任务时间段'}
            description={theme === 'pixel' ? 'OPTIONAL_DAILY_TIME_LIMIT' : theme === 'modern' ? 'Optional: Specify time window for daily task completion' : '可选：指定每日任务完成的时间窗口'}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'FROM' : theme === 'modern' ? 'From' : '开始时间'}
            </label>
                <ThemeInput
                  type="time"
                  value={editTask.daily_time_start || ''}
                  onChange={(e) => setEditTask(prev => ({ ...prev, daily_time_start: e.target.value }))}
                />
          </div>
              <div>
                <label className={`block text-xs mb-1 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : theme === 'modern' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  {theme === 'pixel' ? 'TO' : theme === 'modern' ? 'To' : '结束时间'}
            </label>
                <ThemeInput
                  type="time"
                  value={editTask.daily_time_end || ''}
                  onChange={(e) => setEditTask(prev => ({ ...prev, daily_time_end: e.target.value }))}
                />
          </div>
            </div>
          </ThemeFormField>
        </div>
      );
    }
  };

  // TODO: 重新实现编辑任务时间字段功能

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
        return tasks.filter(task => task.creator_id === currentUserName || task.creator_id === currentUserId);
      case 'assigned':
        return tasks.filter(task => task.assignee_id === currentUserName);
      case 'available':
        return tasks.filter(task => task.status === 'recruiting' && task.creator_id !== currentUserName && task.creator_id !== currentUserId);
      default:
        return tasks;
    }
  };

  // 获取我发布的任务
  const getPublishedTasks = () => {
    const currentUserName = getCurrentUserName();
    const currentUserId = getCurrentUserId();
    const result = tasks.filter(task => task.creator_id === currentUserName || task.creator_id === currentUserId);

    return result;
  };

  // 获取我领取的任务
  const getAssignedTasks = () => {
    const currentUserName = getCurrentUserName();
    return tasks.filter(task => task.assignee_id === currentUserName);
  };

  // 获取可领取的任务
  const getAvailableTasks = () => {
    const currentUserName = getCurrentUserName();
    const currentUserId = getCurrentUserId();
    return tasks.filter(task => task.status === 'recruiting' && task.creator_id !== currentUserName && task.creator_id !== currentUserId);
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
    const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
    if (theme === 'pixel') {
      return taskType === 'repeat' ? 'REPEAT' : 'ONCE';
    }
    return taskType === 'repeat' ? '重复' : '单次';
  };

  // 获取重复频率显示名称
  const getRepeatFrequencyName = (frequency?: string) => {
    if (!frequency) return '--';
    const names = {
      'never': theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复',
      'daily': theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每日',
      'weekly': theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周',
      'biweekly': theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '双周',
      'monthly': theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月',
      'yearly': theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年',
      'forever': theme === 'pixel' ? 'FOREVER' : theme === 'modern' ? 'Forever' : '永远循环'
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
    const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
    return taskType === 'once' && task.earliest_start_time;
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
  const isTaskExpiringSoon = (task_deadline: string | null) => {
    if (!task_deadline) return false; // 不限时任务不会过期
    const task_deadlineDate = new Date(task_deadline);
    const now = new Date();
    const diffDays = Math.floor((task_deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };



  // 渲染任务卡片 - 遵循设计系统的统一卡片样式
  const renderTaskCard = (task: Task) => {
    // 判断当前视图和当前用户，决定显示内容
    const isCurrentUserCreator = task.creator_id === currentUserName || task.creator_id === currentUserId;
    const isPublishedView = view === 'published';
    const isAssignedView = view === 'assigned';
    const isAvailableView = view === 'available';
    const isExpiringSoon = isTaskExpiringSoon(task.task_deadline || task.task_deadline || null);
    const isOverdue = isTaskOverdue(task);
    
    // 🎯 习惯任务特殊处理
    const isHabitTask = task.task_type === 'habit';
    const userHabitChallenge = isHabitTask ? userHabitChallenges.find(c => c.task_id === task.id) : null;
    const canJoinHabit = isHabitTask && task.task_deadline ? canJoinHabitTask(task.task_deadline, getTaskDuration(task)) : false;
    
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
                ? `font-mono uppercase ${getCategoryColor(task.task_type)}`
                : `text-white ${getCategoryColor(task.task_type)}`
            }`}>
              {getCategoryName(task.task_type)}
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
            {task.submitted_at && task.task_deadline && new Date(task.submitted_at) > new Date(task.task_deadline) && (
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
                  {theme === 'pixel' ? 'CREATOR:' : '创建者:'} {task.creator_id}
                  </span>
                </div>
            )}
            
            {/* 只在"我发布的"和"可领取的"视图中显示执行者 */}
            {task.assignee_id && (isPublishedView || isAvailableView) && (
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
                  {theme === 'pixel' ? 'ASSIGNEE:' : '执行者:'} {task.assignee_id}
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
                {(() => {
                  const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
                  return taskType === 'once' ? (
                    isTimeRangeMode(task) ? (
                    // 时间范围模式：显示开始时间范围
                    <>
                      {formatDate(task.earliest_start_time!)}
                      {task.earliest_start_time && (
                        <span className="ml-1 text-xs opacity-75">
                          {formatTimeRange(task.earliest_start_time, task.daily_time_end || undefined)}
                        </span>
                )}
              </>
            ) : (
                    // 简单模式：显示截止日期
                    task.task_deadline ? formatDate(task.task_deadline) : (theme === 'pixel' ? 'NO_DEADLINE' : theme === 'modern' ? 'No Deadline' : '不限时')
                  )
                ) : (
                  // 重复任务：显示日期范围
                  <>
                    {task.earliest_start_time && task.task_deadline && (
                      <>
                        {formatDate(task.earliest_start_time)} - {formatDate(task.task_deadline)}
                      </>
                    )}
                  </>
                )})()}
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
                {(() => {
                  const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
                  return taskType === 'repeat' ? (
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
                )})()}
              </span>
              </div>

            {/* 重复任务的详细信息 */}
            {(() => {
              const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
              return taskType === 'repeat' && task.repeat_frequency && (
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
                  {getRepeatFrequencyName(task.repeat_frequency)}
                  {task.daily_time_start && (
                    <span className="ml-1 opacity-75">
                      {task.daily_time_start.slice(0, 5)}
                    </span>
                  )}
                </span>
          </div>
            )})()}

            {/* 每周重复的星期显示 */}
            {(() => {
              const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
              return taskType === 'repeat' && task.repeat_frequency === 'weekly' && task.repeat_weekdays && task.repeat_weekdays.length > 0 && (
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
                  {getWeekdaysDisplay(task.repeat_weekdays)}
                </span>
            </div>
            )})()}

            {task.requires_proof && (
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
    return task.task_deadline === null || task.task_deadline === undefined || 
           task.task_deadline === null || task.task_deadline === undefined;
  };

  // 判断任务的类型组合
  const getTaskTypeInfo = (task: Task) => {
    const taskType = task.repeat_frequency !== 'never' ? 'repeat' : 'once';
    const isRepeating = taskType === 'repeat';
    const isUnlimited = isUnlimitedTask(task);
    const hasConsecutiveCount = isRepeating && isUnlimited && (task.required_count && task.required_count > 0);
    
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
    const startTimeStr = task.earliest_start_time || task.earliest_start_time;
    const endTimeStr = task.task_deadline || task.task_deadline;
    
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

  // 🎯 根据重复频率确定单位文本
  const getUnitText = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天';
      case 'weekly': return theme === 'pixel' ? 'WEEKS' : theme === 'modern' ? 'weeks' : '周';
      case 'biweekly': return theme === 'pixel' ? 'PERIODS' : theme === 'modern' ? 'periods' : '期';
      case 'monthly': return theme === 'pixel' ? 'MONTHS' : theme === 'modern' ? 'months' : '月';
      case 'yearly': return theme === 'pixel' ? 'YEARS' : theme === 'modern' ? 'years' : '年';
      case 'forever': return theme === 'pixel' ? 'TIMES' : theme === 'modern' ? 'times' : '次';
      default: return theme === 'pixel' ? 'TIMES' : theme === 'modern' ? 'times' : '次';
    }
  };

  // 重复不限时连续任务的专用逻辑
  const getConsecutiveTaskStatus = (task: Task) => {
    const taskInfo = getTaskTypeInfo(task);
    if (!taskInfo.hasConsecutiveCount) return null;
    
    const consecutiveCount = task.required_count || 7;
    const currentStreak = task.current_streak || 0;
    const isCompleted = currentStreak >= consecutiveCount;
    
    // 检查当前周期是否已完成（今天/本周/本月是否已打卡）
    const checkCurrentPeriodCompleted = () => {
      try {
        const completionRecord: string[] = task.completion_record ? JSON.parse(task.completion_record) : [];
    const today = new Date();
        let periodKey = '';
        
        switch (task.repeat_frequency) {
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
      progressText: `${currentStreak}/${consecutiveCount}${getUnitText(task.repeat_frequency)}`,
      isCompleted,
      isStarted: currentStreak > 0,
      currentPeriodCompleted,
      canCheckIn: !isCompleted && !currentPeriodCompleted,
      remaining: Math.max(0, consecutiveCount - currentStreak),
      unitText: getUnitText(task.repeat_frequency)
    };
  };

  // 连续任务打卡
  const handleConsecutiveTaskCheckIn = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const taskInfo = getTaskTypeInfo(task!);
      if (!task || !taskInfo.hasConsecutiveCount) return;

    const today = new Date();
      const currentStreak = (task.current_streak || 0) + 1;
      const consecutiveCount = task.required_count || 7;
      
      // 生成当前周期的标识符
      let periodKey = '';
      switch (task.repeat_frequency) {
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
        completionRecord = task.completion_record ? JSON.parse(task.completion_record) : [];
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
      
      await taskService.updateTask({ id: taskId, ...updateData } as EditTaskForm);
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
      
      await taskService.updateTask({ id: taskId, ...updateData } as EditTaskForm);
      await reloadTasks();
    } catch (error) {
      console.error('❌ 重置连续任务失败:', error);
      throw error;
    }
  };

  // 渲染任务详情弹窗
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    // 检查任务所有者 - 如果creator_id是UUID则与用户ID比较，否则与用户名比较
    const isTaskOwner = selectedTask.creator_id === currentUserId || selectedTask.creator_id === currentUserName;
    const isAssignee = selectedTask.assignee_id === currentUserName;
    const isRecruiting = selectedTask.status === 'recruiting';
    const isAssigned = selectedTask.status === 'assigned';
    const isInProgress = selectedTask.status === 'in_progress';
    const isPendingReview = selectedTask.status === 'pending_review';
    const isCompleted = selectedTask.status === 'completed';
    const isAbandoned = selectedTask.status === 'abandoned';
    const hasProof = selectedTask.proof_url !== undefined;
    const canComplete = !selectedTask.requires_proof || hasProof;
    
    // 🎯 习惯任务特殊处理
    const isHabitTask = selectedTask.task_type === 'habit';
    const userHabitChallenge = isHabitTask ? userHabitChallenges.find(c => c.task_id === selectedTask.id) : null;
    const canJoinHabit = isHabitTask && selectedTask.task_deadline ? canJoinHabitTask(selectedTask.task_deadline, getTaskDuration(selectedTask)) : false;

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
                <ThemeFormField
                  label={theme === 'pixel' ? 'TASK_DESCRIPTION' : theme === 'modern' ? 'Task Description' : '任务描述'}
                >
                  <ThemeTextarea
                    value={editTask.description || ''}
                    onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                    rows={3}
                    placeholder={theme === 'pixel' ? 'ENTER_DESCRIPTION...' : theme === 'modern' ? 'Enter task description...' : '输入任务描述'}
                  />
                </ThemeFormField>

                {/* 3. 任务类型选择 */}
                <ThemeFormField
                  label={theme === 'pixel' ? 'TASK_TYPE' : theme === 'modern' ? 'Task Type' : '任务类型'}
                  required
                >
                  <ThemeSelect
                    value={editTask.task_type || 'daily'}
                    onChange={(e) => setEditTask({...editTask, task_type: e.target.value as 'daily' | 'habit' | 'special'})}
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
                  description={editTask.repeat_frequency !== 'never' ? (theme === 'modern' ? 'Repeating task: earn this reward for each completion' : '重复性任务：每次完成都可获得此积分奖励') : (theme === 'modern' ? 'One-time task: earn this reward upon completion' : '一次性任务：完成后获得此积分奖励')}
                >
                  <ThemeInput
                    type="number"
                    value={editTask.points || ''}
                    onChange={(e) => setEditTask({...editTask, points: parseInt(e.target.value) || 0})}
                    min="1"
                    max="1000"
                    placeholder={theme === 'pixel' ? '50' : theme === 'modern' ? 'Enter points (1-1000)' : '输入积分 (1-1000)'}
                  />
                </ThemeFormField>

                {/* 5. 需要提交凭证 */}
                <ThemeCheckbox
                  label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要提交凭证'}
                  checked={editTask.requires_proof || false}
                  onChange={(e) => setEditTask({...editTask, requires_proof: e.target.checked})}
                />

                {/* 6. 重复频率 */}
                <ThemeFormField
                  label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                  required
                >
                  <ThemeSelect
                    value={editTask.repeat_frequency || 'never'}
                    onChange={(e) => setEditTask({...editTask, repeat_frequency: e.target.value as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever'})}
                  >
                    <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复'}</option>
                    <option value="daily">{theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每天'}</option>
                    <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周'}</option>
                    <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '每两周'}</option>
                    <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月'}</option>
                    <option value="yearly">{theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年'}</option>
                    <option value="forever">{theme === 'pixel' ? 'FOREVER' : theme === 'modern' ? 'Forever' : '永远循环'}</option>
                  </ThemeSelect>
                </ThemeFormField>

                {/* 7. 是否不限时任务 */}
                <ThemeCheckbox
                  label={theme === 'pixel' ? 'UNLIMITED_TIME' : theme === 'modern' ? 'Unlimited Time Task' : '不限时任务'}
                  checked={editTask.isUnlimited || false}
                  onChange={(e) => setEditTask(prev => ({ ...prev, isUnlimited: e.target.checked }))}
                  description={theme === 'pixel' ? 'NO_TIME_LIMIT' : theme === 'modern' ? 'Task can be completed at any time without deadline' : '任务可以在任何时间完成，没有截止日期'}
                />

                {/* 连续次数设置（仅当重复+不限时任务时显示） */}
                {editTask.repeat_frequency !== 'never' && editTask.isUnlimited && (
                  <ThemeFormField
                    label={theme === 'pixel' ? 'CONSECUTIVE_COUNT' : theme === 'modern' ? 'Consecutive Count' : '连续次数'}
                    description={(() => {
                      const getUnitName = () => {
                        switch (editTask.repeat_frequency) {
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
                      value={editTask.required_count || 7}
                      onChange={(e) => setEditTask(prev => ({ ...prev, required_count: parseInt(e.target.value) || 7 }))}
                      placeholder={theme === 'pixel' ? 'ENTER_COUNT' : theme === 'modern' ? 'Enter count...' : '输入次数...'}
                      min="1"
                      max="365"
                    />
                  </ThemeFormField>
                )}

                {/* 8. 任务时间字段（仅当不是不限时任务时显示） */}
                {!editTask.isUnlimited && renderEditTaskTimeFields()}


              </>
            ) : (
              // 🎯 任务详情显示 - 使用新数据结构
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
                  value={selectedTask.task_type === 'daily' ? (theme === 'pixel' ? 'DAILY_TASK' : theme === 'modern' ? 'Daily Task' : '日常任务') : 
                         selectedTask.task_type === 'habit' ? (theme === 'pixel' ? 'HABIT_TASK' : theme === 'modern' ? 'Habit Task' : '习惯任务') :
                         selectedTask.task_type === 'special' ? (theme === 'pixel' ? 'SPECIAL_TASK' : theme === 'modern' ? 'Special Task' : '特殊任务') : selectedTask.task_type}
                />

                <DetailField
                  label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                  value={getRepeatFrequencyName(selectedTask.repeat_frequency)}
                />

                <DetailField
                  label={theme === 'pixel' ? 'POINTS_REWARD' : theme === 'modern' ? 'Points Reward' : '积分奖励'}
                  value={`${selectedTask.points || 0} ${selectedTask.repeat_frequency !== 'never' ? (theme === 'pixel' ? 'PER_COMPLETION' : theme === 'modern' ? 'per completion' : '每次完成') : (theme === 'pixel' ? 'TOTAL' : theme === 'modern' ? 'total' : '总计')}`}
                />

                <DetailField
                  label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要凭证'}
                  value={selectedTask.requires_proof ? (theme === 'pixel' ? 'YES' : theme === 'modern' ? 'Yes' : '是') : (theme === 'pixel' ? 'NO' : theme === 'modern' ? 'No' : '否')}
                />

                {/* 🎯 习惯任务特殊信息显示 */}
                {isHabitTask && (
                  <>
                    <DetailField
                      label={theme === 'pixel' ? 'CHALLENGE_DURATION' : theme === 'modern' ? 'Challenge Duration' : '挑战持续时间'}
                      value={`${getTaskDuration(selectedTask)} ${theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'Days' : '天'}`}
                    />
                    
                    <DetailField
                      label={theme === 'pixel' ? 'TASK_PERIOD' : theme === 'modern' ? 'Task Period' : '任务期间'}
                      value={`${selectedTask.earliest_start_time || '--'} ~ ${selectedTask.task_deadline || '--'}`}
                    />
                    
                    {selectedTask.task_deadline && (
                      <DetailField
                        label={theme === 'pixel' ? 'LATEST_JOIN_DATE' : theme === 'modern' ? 'Latest Join Date' : '最晚加入日期'}
                        value={calculateLatestJoinDate(selectedTask.task_deadline, getTaskDuration(selectedTask))}
                      />
                    )}
                    
                    {userHabitChallenge && (
                      <>
                        <DetailField
                          label={theme === 'pixel' ? 'MY_PROGRESS' : theme === 'modern' ? 'My Progress' : '我的进度'}
                          value={`${userHabitChallenge.total_completions}/${getTaskDuration(selectedTask)} ${theme === 'pixel' ? 'DAYS' : theme === 'modern' ? 'days' : '天'}`}
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

                {/* 🎯 时间信息显示 - 简化版本 */}
                {selectedTask.repeat_frequency === 'never' ? (
                  // 一次性任务
                  <>
                    {selectedTask.earliest_start_time && (
                      <DetailField
                        label={theme === 'pixel' ? 'START_TIME' : theme === 'modern' ? 'Start Time' : '开始时间'}
                        value={formatDate(selectedTask.earliest_start_time)}
                      />
                    )}
                    {selectedTask.task_deadline && (
                      <DetailField
                        label={theme === 'pixel' ? 'END_TIME' : theme === 'modern' ? 'End Time' : '结束时间'}
                        value={formatDate(selectedTask.task_deadline)}
                      />
                    )}
                    {!selectedTask.earliest_start_time && !selectedTask.task_deadline && (
                      <DetailField
                        label={theme === 'pixel' ? 'TIME_LIMIT' : theme === 'modern' ? 'Time Limit' : '时间限制'}
                        value={theme === 'pixel' ? 'UNLIMITED' : theme === 'modern' ? 'Unlimited' : '不限时'}
                      />
                    )}
                  </>
                ) : (
                  // 重复任务
                  <>
                    {selectedTask.earliest_start_time && (
                      <DetailField
                        label={theme === 'pixel' ? 'EARLIEST_START_TIME' : theme === 'modern' ? 'Earliest Start Time' : '最早开始时间'}
                        value={formatDate(selectedTask.earliest_start_time)}
                      />
                    )}
                    {selectedTask.required_count && (
                      <DetailField
                        label={theme === 'pixel' ? 'REPEAT_COUNT' : theme === 'modern' ? 'Repeat Count' : '重复次数'}
                        value={`${selectedTask.required_count} ${getUnitText(selectedTask.repeat_frequency)}`}
                      />
                    )}
                    {selectedTask.task_deadline && (
                      <DetailField
                        label={theme === 'pixel' ? 'DEADLINE' : theme === 'modern' ? 'Deadline' : '截止时间'}
                        value={formatDate(selectedTask.task_deadline)}
                      />
                    )}
                    {(selectedTask.daily_time_start || selectedTask.daily_time_end) && (
                      <DetailField
                        label={theme === 'pixel' ? 'DAILY_TIME_WINDOW' : theme === 'modern' ? 'Daily Time Window' : '每日时间段'}
                        value={(() => {
                          const startTime = selectedTask.daily_time_start;
                          const endTime = selectedTask.daily_time_end;
                          
                          if (startTime && endTime) {
                            return `${startTime} - ${endTime}`;
                          } else if (startTime) {
                            return `${theme === 'pixel' ? 'FROM' : theme === 'modern' ? 'From' : '从'} ${startTime}`;
                          } else if (endTime) {
                            return `${theme === 'pixel' ? 'UNTIL' : theme === 'modern' ? 'Until' : '到'} ${endTime}`;
                          }
                          return '--';
                        })()}
                      />
                    )}
                    {!selectedTask.earliest_start_time && !selectedTask.task_deadline && !selectedTask.required_count && (
                      <DetailField
                        label={theme === 'pixel' ? 'TIME_LIMIT' : theme === 'modern' ? 'Time Limit' : '时间限制'}
                        value={theme === 'pixel' ? 'UNLIMITED' : theme === 'modern' ? 'Unlimited' : '不限时'}
                      />
                    )}
                  </>
                )}


                {/* 需要凭证 */}
                {selectedTask.requires_proof && (
                  <DetailField
                    label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要凭证'}
                    value={theme === 'pixel' ? 'YES' : theme === 'modern' ? 'Yes' : '是'}
                  />
                )}

                {/* 领取者信息 */}
                {selectedTask.assignee_id && (
                  <DetailField
                    label={theme === 'pixel' ? 'ASSIGNEE' : theme === 'modern' ? 'Assignee' : '领取者'}
                    value={selectedTask.assignee_id}
                  />
                )}

                {/* 发布者信息 */}
                <DetailField
                  label={theme === 'pixel' ? 'CREATOR' : theme === 'modern' ? 'Creator' : '发布者'}
                  value={selectedTask.creator_id}
                />



              {/* 需要凭证提示 */}
              {selectedTask.requires_proof && (
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
                  {selectedTask.proof_url && (
                  <DetailField
                    label={theme === 'pixel' ? 'PROOF' : theme === 'modern' ? 'Proof' : '完成凭证'}
                    value={selectedTask.proof_url}
                  />
                )}

                {/* 审核评价 */}
                {selectedTask.review_comment && (
                  <DetailField
                    label={theme === 'pixel' ? 'REVIEW' : theme === 'modern' ? 'Review Comment' : '审核评价'}
                    value={selectedTask.review_comment}
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
                              
                              <ThemeButton
                                variant="danger"
                                onClick={() => handleDeleteTask(selectedTask.id)}
                              >
                                {theme === 'pixel' ? 'DELETE' : theme === 'modern' ? 'Delete' : '删除'}
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
                                   theme === 'modern' ? 'Join task_deadline has passed' : 
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
              isTaskExpiringSoon(task.task_deadline || task.task_deadline || null) ? 'animate-pulse' : ''
            }`}>
              {isTaskExpiringSoon(task.task_deadline || task.task_deadline || null) && (
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
              task_type: 'daily',
              points: 50,
              requires_proof: false,
              // 🎯 新数据结构字段
              repeat_frequency: 'never',
              earliest_start_time: '',
              task_deadline: '',
              required_count: 1,
              daily_time_start: '',
              daily_time_end: '',
              // UI控制字段
              isUnlimited: false,
              endRepeat: 'never'
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
                  value={newTask.task_type}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value as 'daily' | 'habit' | 'special' }))}
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
                description={newTask.repeat_frequency !== 'never' 
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
                    checked={newTask.requires_proof}
                onChange={(e) => setNewTask(prev => ({ ...prev, requires_proof: e.target.checked }))}
              />

              {/* 6. 重复频率 */}
              <ThemeFormField
                label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                required
              >
                <ThemeSelect
                  value={newTask.repeat_frequency}
                  onChange={(e) => setNewTask(prev => ({ ...prev, repeat_frequency: e.target.value as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever' }))}
                >
                  <option value="never">{theme === 'pixel' ? 'NEVER' : theme === 'modern' ? 'Never' : '从不重复'}</option>
                  <option value="daily">{theme === 'pixel' ? 'DAILY' : theme === 'modern' ? 'Daily' : '每天'}</option>
                  <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : theme === 'modern' ? 'Weekly' : '每周'}</option>
                  <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : theme === 'modern' ? 'Biweekly' : '每两周'}</option>
                  <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : theme === 'modern' ? 'Monthly' : '每月'}</option>
                  <option value="yearly">{theme === 'pixel' ? 'YEARLY' : theme === 'modern' ? 'Yearly' : '每年'}</option>
                  <option value="forever">{theme === 'pixel' ? 'FOREVER' : theme === 'modern' ? 'Forever' : '永远循环'}</option>
                </ThemeSelect>
              </ThemeFormField>

              {/* 7. 是否不限时任务 */}
              <ThemeCheckbox
                label={theme === 'pixel' ? 'UNLIMITED_TIME' : theme === 'modern' ? 'Unlimited Time Task' : '不限时任务'}
                checked={newTask.isUnlimited}
                onChange={(e) => setNewTask(prev => ({ ...prev, isUnlimited: e.target.checked }))}
                description={theme === 'pixel' ? 'NO_TIME_LIMIT' : theme === 'modern' ? 'Task can be completed at any time without task_deadline' : '任务可以在任何时间完成，没有截止日期'}
              />

              {/* 连续次数设置（仅当重复+不限时任务时显示） */}
              {newTask.repeat_frequency !== 'never' && newTask.isUnlimited && (
                <ThemeFormField
                  label={theme === 'pixel' ? 'CONSECUTIVE_COUNT' : theme === 'modern' ? 'Consecutive Count' : '连续次数'}
                  description={(() => {
                    const getUnitName = () => {
                      switch (newTask.repeat_frequency) {
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
                    value={newTask.required_count || 7}
                    onChange={(e) => setNewTask(prev => ({ ...prev, required_count: parseInt(e.target.value) || 7 }))}
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
                task_type: 'daily',
                points: 50,
                requires_proof: false,
                // 🎯 新数据结构字段
                repeat_frequency: 'never',
                earliest_start_time: '',
                task_deadline: '',
                required_count: 1,
                daily_time_start: '',
                daily_time_end: '',
                // UI控制字段
                isUnlimited: false,
                endRepeat: 'never'
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

      {/* 取消编辑确认对话框 */}
      <AlertDialog
        open={showCancelEditConfirm}
        onOpenChange={setShowCancelEditConfirm}
        title="取消编辑"
        description="您有未保存的更改，确定要取消编辑吗？所有更改将丢失。"
        variant="default"
        confirmText="确定取消"
        cancelText="继续编辑"
        onConfirm={confirmCancelEdit}
        onCancel={() => setShowCancelEditConfirm(false)}
      />

      {/* 删除/放弃任务确认对话框 */}
      <AlertDialog
        open={showDeleteTaskConfirm}
        onOpenChange={setShowDeleteTaskConfirm}
        title={deleteAction === 'abandon' ? '放弃任务' : '删除任务'}
        description={taskToDelete ? 
          deleteAction === 'abandon' 
            ? `确定要放弃任务"${tasks.find(t => t.id === taskToDelete)?.title}"吗？任务将从您的列表中移除。`
            : `确定要删除任务"${tasks.find(t => t.id === taskToDelete)?.title}"吗？此操作无法撤销。`
          : deleteAction === 'abandon' ? '确定要放弃此任务吗？' : '确定要删除此任务吗？'
        }
        variant="destructive"
        confirmText={deleteAction === 'abandon' ? '确定放弃' : '确定删除'}
        cancelText="取消"
        onConfirm={confirmTaskAction}
        onCancel={() => {
          setShowDeleteTaskConfirm(false);
          setTaskToDelete(null);
          setDeleteAction('abandon');
        }}
      />
      
      {/* 🚫 开发工具面板已移除 */}
    </div>
  );
};

export default TaskBoard; 
