// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import Button from './ui/Button';
import NavigationButton from './ui/NavigationButton';
import LoadingSpinner from './ui/LoadingSpinner';
import Card from './ui/Card';
import PointsDisplay from './PointsDisplay';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import { taskService, userService, pointService } from '../services/database';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { globalEventService, GlobalEvents } from '../services/globalEventService';

// 前端Task接口（简化版 - 去除UI字段）
interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  points: number;
  status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review';
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
  startDate?: string;
  endDate?: string;
  repeatTime?: string;
  repeatWeekdays?: number[];
  // 一次性任务时间范围字段（可选）
  taskStartTime?: string;
  taskEndTime?: string;
}

// 数据库Task类型
type DatabaseTask = Database['public']['Tables']['tasks']['Row'];

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
    deadline: '', // 一次性任务的截止日期（简单模式）
    time: '', // 一次性任务的截止时间（简单模式）
    points: 50,
    requiresProof: false,
    taskType: 'daily' as 'daily' | 'habit' | 'special',
    repeatType: 'once' as 'once' | 'repeat',
    // 重复性任务字段
    repeatFrequency: 'daily' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    startDate: '',
    endDate: '',
    repeatTime: '',
    repeatWeekdays: [] as number[],
    // 一次性任务时间范围字段（可选）
    taskStartTime: '',
    taskEndTime: ''
  });

  // UI辅助状态（不存储到数据库）
  const [useTimeRange, setUseTimeRange] = useState(false); // 控制一次性任务是否使用时间范围
  const [selectedDuration, setSelectedDuration] = useState<'21days' | '1month' | '6months' | '1year'>('21days'); // 重复任务持续时间选择器
  const [repeatHasSpecificTime, setRepeatHasSpecificTime] = useState(false); // 控制重复任务是否指定时间
  
  // 数据库相关状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  
  // 调试信息
  console.log('📋 TaskBoard 加载状态:', { loading, tasksLoaded, user: !!user, tasksCount: tasks.length });
  const [userMap, setUserMap] = useState<{[id: string]: string}>({});
  
  // 手动刷新功能
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 编辑任务状态
  const [isEditing, setIsEditing] = useState(false);
  const [editTask, setEditTask] = useState<Partial<Task>>({});
  
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

  // 计算结束日期的辅助函数
  const calculateEndDate = (startDate: string, duration: '21days' | '1month' | '6months' | '1year'): string => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    let end = new Date(start);
    
    switch (duration) {
      case '21days':
        end.setDate(start.getDate() + 21);
        break;
      case '1month':
        end.setMonth(start.getMonth() + 1);
        break;
      case '6months':
        end.setMonth(start.getMonth() + 6);
        break;
      case '1year':
        end.setFullYear(start.getFullYear() + 1);
        break;
    }
    
    return end.toISOString().split('T')[0];
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


  // 数据库任务转换为前端Task格式
  const convertDatabaseTaskToTask = (dbTask: DatabaseTask): Task => {

    
    // 确保始终使用display_name
    const creatorName = userMap[dbTask.creator_id] || dbTask.creator_id;
    const assigneeName = dbTask.assignee_id ? (userMap[dbTask.assignee_id] || dbTask.assignee_id) : undefined;
    
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      deadline: dbTask.deadline,
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
      startDate: dbTask.start_date || undefined,
      endDate: dbTask.end_date || undefined,
      repeatTime: dbTask.repeat_time || undefined,
      repeatWeekdays: dbTask.repeat_weekdays || undefined,
      // 一次性任务时间范围字段
      taskStartTime: dbTask.task_start_time || undefined,
      taskEndTime: dbTask.task_end_time || undefined
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
    setEditTask({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      points: task.points,
      taskType: task.taskType,
      repeatType: task.repeatType,
      requiresProof: task.requiresProof,
      // 重复任务字段
      startDate: task.startDate,
      endDate: task.endDate,
      repeatFrequency: task.repeatFrequency,
      repeatTime: task.repeatTime,
      repeatWeekdays: task.repeatWeekdays,
      // 一次性任务时间范围字段
      taskStartTime: task.taskStartTime,
      taskEndTime: task.taskEndTime
    });
    setIsEditing(true);
  };

  // 保存编辑的任务
  const handleSaveEdit = async () => {
    if (!selectedTask || !editTask.title?.trim()) {
      alert('请填写任务标题');
      return;
    }

    try {
      // 准备数据库更新数据
      const dbUpdates: any = {
        title: editTask.title.trim(),
        description: editTask.description || '',
        deadline: editTask.deadline,
        points: editTask.points || 50,
        task_type: editTask.taskType,
        repeat_type: editTask.repeatType,
        requires_proof: editTask.requiresProof || false,
      };

      // 根据任务类型添加相应字段
      if (editTask.repeatType === 'repeat') {
        dbUpdates.start_date = editTask.startDate;
        dbUpdates.end_date = editTask.endDate;
        dbUpdates.repeat_frequency = editTask.repeatFrequency;
        dbUpdates.repeat_time = editTask.repeatTime;
        dbUpdates.repeat_weekdays = editTask.repeatWeekdays;
      } else {
        dbUpdates.task_start_time = editTask.taskStartTime;
        dbUpdates.task_end_time = editTask.taskEndTime;
      }

      await taskService.updateTask(selectedTask.id, dbUpdates);
      
      // 刷新任务列表
      await reloadTasks();
      
      // 关闭编辑模式
      setIsEditing(false);
      setSelectedTask(null);
      
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

    if (newTask.repeatType === 'once') {
      if (useTimeRange) {
        // 时间范围模式验证
        if (!newTask.taskStartTime) {
          alert('请选择开始时间');
          return;
        }
        if (newTask.taskEndTime && new Date(newTask.taskStartTime) >= new Date(newTask.taskEndTime)) {
          alert('结束时间必须晚于开始时间');
          return;
        }
      } else {
        // 简单模式验证
        if (!newTask.deadline) {
          alert('请选择截止日期');
          return;
        }
      }
    } else {
      if (!newTask.startDate) {
        alert('请选择开始日期');
        return;
      }
      
      // 验证每周重复任务的周日选择
      if (newTask.repeatFrequency === 'weekly' && repeatHasSpecificTime && (!newTask.repeatWeekdays || newTask.repeatWeekdays.length === 0)) {
        alert('请选择每周重复的日期');
        return;
      }
    }

    // 构建完整的截止时间（仅限一次性任务）
    let fullDeadline = '';
    if (newTask.repeatType === 'once') {
      if (useTimeRange) {
        // 时间范围模式：使用结束时间作为截止时间，如果没有则使用开始时间+24小时
        if (newTask.taskEndTime) {
          fullDeadline = `${newTask.taskEndTime}:00.000Z`;
        } else {
          const startTime = new Date(newTask.taskStartTime);
          const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
          fullDeadline = endTime.toISOString();
        }
      } else {
        // 简单模式：使用截止日期和时间
        if (newTask.time) {
          fullDeadline = `${newTask.deadline}T${newTask.time}:00.000Z`;
        } else {
          fullDeadline = `${newTask.deadline}T23:59:59.000Z`;
        }
      }
    }

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
          repeat_type: newTask.repeatType,
          created_at: new Date().toISOString()
        };

                // 一次性任务：添加截止时间和可选的时间范围字段
        if (newTask.repeatType === 'once') {
          dbTaskData.deadline = fullDeadline;
          
          // 只有在使用时间范围模式时才保存时间范围字段
          if (useTimeRange && newTask.taskStartTime) {
            dbTaskData.task_start_time = newTask.taskStartTime;
            if (newTask.taskEndTime) {
              dbTaskData.task_end_time = newTask.taskEndTime;
            }
          }
        } else {
          // 重复性任务：添加重复相关字段
          dbTaskData.start_date = newTask.startDate;
          dbTaskData.end_date = newTask.endDate;
          dbTaskData.repeat_frequency = newTask.repeatFrequency;
          
          if (newTask.repeatTime) {
            dbTaskData.repeat_time = newTask.repeatTime;
          }
          
          if (newTask.repeatFrequency === 'weekly' && newTask.repeatWeekdays && newTask.repeatWeekdays.length > 0) {
            dbTaskData.repeat_weekdays = newTask.repeatWeekdays;
          }
          
          // 注意：当前数据库表可能不支持所有这些字段，可能需要更新表结构
          // 暂时使用deadline字段存储结束日期
          dbTaskData.deadline = `${newTask.endDate}T23:59:59.000Z`;
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
      throw new Error('用户未登录或缺少情侣关系信息');
    }

    // 重置表单
    setNewTask({
      title: '',
      description: '',
      deadline: '',
      time: '',
      points: 50,
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once',
      repeatFrequency: 'daily',
      startDate: '',
      endDate: '',
      repeatTime: '',
      repeatWeekdays: [],
      taskStartTime: '',
      taskEndTime: ''
    });
    setUseTimeRange(false);
    setSelectedDuration('21days');
    setRepeatHasSpecificTime(false);
    setShowAddForm(false);
  };

  // 渲染任务时间字段（根据repeatType动态显示）
  const renderTaskTimeFields = () => {
    if (newTask.repeatType === 'once') {
      // 一次性任务：支持两种模式
      return (
        <div className="space-y-4">
          {/* 是否指定时间范围 */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useTimeRangeOnce"
                checked={useTimeRange}
                onChange={(e) => {
                  const useRange = e.target.checked;
                  setUseTimeRange(useRange);
                  if (useRange && newTask.taskStartTime && !newTask.taskEndTime) {
                    // 如果开启时间范围且有开始时间但没有结束时间，设置默认24小时后
                    const startTime = new Date(newTask.taskStartTime);
                    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
                    setNewTask(prev => ({
                      ...prev,
                      taskEndTime: endTime.toISOString().slice(0, 16)
                    }));
                  }
                }}
                className={`mr-3 ${
                  theme === 'pixel' ? 'text-pixel-accent' : theme === 'fresh' ? 'text-fresh-primary' : 'text-blue-500'
                }`}
              />
              <label htmlFor="useTimeRangeOnce" className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'SPECIFIC_TIME_RANGE' : '指定时间范围'}
              </label>
            </div>
            <p className={`text-xs mt-1 ${
              theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
            }`}>
              {theme === 'pixel' ? 'ENABLE_FOR_TIME_RANGE_TASKS' : '开启以设置任务的具体完成时间范围'}
            </p>
          </div>

          {useTimeRange ? (
            // 时间范围模式
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'START_TIME *' : '开始时间 *'}
                </label>
                <input
                  type="datetime-local"
                  value={newTask.taskStartTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    // 如果结束时间未设置，自动设置为24小时后
                    if (!newTask.taskEndTime) {
                      const start = new Date(startTime);
                      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                      setNewTask(prev => ({
                        ...prev,
                        taskStartTime: startTime,
                        taskEndTime: end.toISOString().slice(0, 16)
                      }));
                    } else {
                      setNewTask(prev => ({ ...prev, taskStartTime: startTime }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'END_TIME' : '结束时间'}
                </label>
                <input
                  type="datetime-local"
                  value={newTask.taskEndTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskEndTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min={newTask.taskStartTime || new Date().toISOString().slice(0, 16)}
                />
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? 'OPTIONAL_DEFAULT_24H_AFTER_START' : '可选：默认开始时间后24小时'}
                </p>
              </div>
            </div>
          ) : (
            // 简单模式：截止日期和时间
            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'DEADLINE_DATE *' : '截止日期 *'}
              </label>
              <input
                type="date"
                value={newTask.deadline}
                  onChange={(e) => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

          <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'DEADLINE_TIME' : '截止时间'}
            </label>
              <input
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // 重复性任务：需要开始日期、持续时间、重复频率等
      return (
        <div className="space-y-4">
          {/* 重复频率 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
              theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'REPEAT_FREQUENCY *' : '重复频率 *'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'daily', label: theme === 'pixel' ? 'DAILY' : '每天' },
                { value: 'weekly', label: theme === 'pixel' ? 'WEEKLY' : '每周' },
                { value: 'biweekly', label: theme === 'pixel' ? 'BIWEEKLY' : '每两周' },
                { value: 'monthly', label: theme === 'pixel' ? 'MONTHLY' : '每月' },
                { value: 'yearly', label: theme === 'pixel' ? 'YEARLY' : '每年' },
              ].map(freq => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setNewTask(prev => ({ ...prev, repeatFrequency: freq.value as any }))}
                  className={`py-2 px-3 text-sm transition-all duration-300 rounded-md border-2 ${
                          newTask.repeatFrequency === freq.value
                      ? theme === 'pixel'
                        ? 'bg-pixel-accent text-black border-pixel-accent'
                        : theme === 'fresh'
                        ? 'bg-fresh-primary text-white border-fresh-primary'
                        : 'bg-blue-500 text-white border-blue-500'
                      : theme === 'pixel'
                      ? 'border-pixel-border text-pixel-text hover:border-pixel-accent'
                      : theme === 'fresh'
                      ? 'border-fresh-border text-fresh-text hover:border-fresh-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  } ${theme === 'pixel' ? 'font-mono uppercase' : ''}`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* 开始日期和持续时间 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'START_DATE *' : '开始日期 *'}
            </label>
            <input
              type="date"
              value={newTask.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                  setNewTask(prev => ({
                    ...prev,
                  startDate,
                    endDate: calculateEndDate(startDate, selectedDuration)
                  }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  theme === 'pixel' 
                    ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                    : theme === 'fresh'
                    ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                    : 'border-gray-300 focus:ring-blue-500'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'DURATION *' : '持续时间 *'}
            </label>
              <select
                value={selectedDuration}
                onChange={(e) => {
                  const duration = e.target.value as '21days' | '1month' | '6months' | '1year';
                  setSelectedDuration(duration);
                  setNewTask(prev => ({
                    ...prev,
                    endDate: prev.startDate ? calculateEndDate(prev.startDate, duration) : ''
                  }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                    ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                    : theme === 'fresh'
                    ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="21days">{theme === 'pixel' ? '21_DAYS' : '21天'}</option>
                <option value="1month">{theme === 'pixel' ? '1_MONTH' : '1个月'}</option>
                <option value="6months">{theme === 'pixel' ? '6_MONTHS' : '6个月'}</option>
                <option value="1year">{theme === 'pixel' ? '1_YEAR' : '1年'}</option>
              </select>
            </div>
          </div>

          {/* 结束日期（只读，自动计算） */}
          {newTask.endDate && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'END_DATE' : '结束日期'}
            </label>
            <input
              type="date"
              value={newTask.endDate}
                readOnly
                className={`w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 ${
                  theme === 'pixel' ? 'font-mono' : ''
                }`}
            />
            <p className={`text-xs mt-1 ${
                theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
            }`}>
                {theme === 'pixel' ? 'AUTO_CALCULATED' : '根据开始日期和持续时间自动计算'}
            </p>
          </div>
          )}

          {/* 是否指定时间 */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repeatHasSpecificTime"
                checked={repeatHasSpecificTime}
                onChange={(e) => setRepeatHasSpecificTime(e.target.checked)}
                className={`mr-3 ${
                  theme === 'pixel' ? 'text-pixel-accent' : theme === 'fresh' ? 'text-fresh-primary' : 'text-blue-500'
                }`}
              />
              <label htmlFor="repeatHasSpecificTime" className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'SPECIFIC_TIME' : '指定时间'}
              </label>
            </div>
          </div>

          {/* 指定时间字段 */}
          {repeatHasSpecificTime && (
            <div className="space-y-4">
              {/* 重复时间 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REPEAT_TIME' : '重复时间'}
            </label>
            <input
                  type="time"
                  value={newTask.repeatTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, repeatTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              <p className={`text-xs mt-1 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
              }`}>
                  {theme === 'pixel' ? 'OPTIONAL' : '可选：如不设置，任务可在当天任意时间完成'}
              </p>
          </div>

              {/* 周日选择器（仅当重复频率为每周且指定时间时显示） */}
              {newTask.repeatFrequency === 'weekly' && repeatHasSpecificTime && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                    theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'SELECT_WEEKDAYS *' : '选择每周重复的日期 *'}
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { value: 0, label: theme === 'pixel' ? 'SUN' : '日' },
                      { value: 1, label: theme === 'pixel' ? 'MON' : '一' },
                      { value: 2, label: theme === 'pixel' ? 'TUE' : '二' },
                      { value: 3, label: theme === 'pixel' ? 'WED' : '三' },
                      { value: 4, label: theme === 'pixel' ? 'THU' : '四' },
                      { value: 5, label: theme === 'pixel' ? 'FRI' : '五' },
                      { value: 6, label: theme === 'pixel' ? 'SAT' : '六' }
                    ].map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const weekdays = newTask.repeatWeekdays || [];
                          const newWeekdays = weekdays.includes(day.value)
                            ? weekdays.filter(d => d !== day.value)
                            : [...weekdays, day.value].sort();
                          setNewTask(prev => ({ ...prev, repeatWeekdays: newWeekdays }));
                        }}
                        className={`py-2 px-1 text-xs transition-all duration-300 rounded-md border-2 ${
                          newTask.repeatWeekdays?.includes(day.value)
                            ? theme === 'pixel'
                              ? 'bg-pixel-accent text-black border-pixel-accent font-mono uppercase'
                              : theme === 'fresh'
                              ? 'bg-fresh-primary text-white border-fresh-primary'
                              : 'bg-blue-500 text-white border-blue-500'
                            : theme === 'pixel'
                            ? 'border-pixel-border text-pixel-text hover:border-pixel-accent font-mono uppercase'
                            : theme === 'fresh'
                            ? 'border-fresh-border text-fresh-text hover:border-fresh-primary'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
          </div>
                  <p className={`text-xs mt-1 ${
                    theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                  }`}>
                    {theme === 'pixel' ? 'SELECT_ONE_OR_MORE_DAYS' : '请选择一个或多个重复日期'}
                  </p>
                </div>
              )}
                  </div>
                )}
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
  const isTaskExpiringSoon = (deadline: string) => {
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
    const isExpiringSoon = isTaskExpiringSoon(task.deadline);
    const isOverdue = isTaskOverdue(task);

  return (
      <Card
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
            {task.submittedAt && new Date(task.submittedAt) > new Date(task.deadline) && (
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
                  <UserIcon className="w-4 h-4" />
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
                  <UserIcon className="w-4 h-4" />
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
                <CalendarIcon className="w-4 h-4" />
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
                    formatDate(task.deadline)
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
                <StarIcon className="w-4 h-4" />
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
                  <ArrowPathIcon className="w-4 h-4" />
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
                  <CalendarIcon className="w-4 h-4" />
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
                  <DocumentIcon className="w-4 h-4" />
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
      </Card>
    );
  };

  // 判断任务是否已过期
  const isTaskOverdue = (task: Task) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now;
  };

  // 判断任务是否在时间范围内
  const isTaskInTimeRange = (task: Task) => {
    // 所有任务都按日期判断，不考虑具体时间
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999); // 设置为当天最后一刻
    const now = new Date();
    return deadline >= now;
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
    


    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
          theme === 'pixel' 
            ? 'bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg' 
            : 'bg-white rounded-xl shadow-xl'
        }`}>
          {/* 关闭按钮 */}
          <div className="flex justify-end">
        <button
              onClick={() => setSelectedTask(null)}
              className={`p-2 rounded-full transition-colors ${
            theme === 'pixel'
                  ? 'hover:text-pixel-accent text-pixel-textMuted'
                  : 'hover:text-primary-500 text-gray-400'
          }`}
              aria-label="关闭"
        >
              {theme === 'pixel' ? (
                <PixelIcon name="close" size="sm" />
              ) : (
                <XMarkIcon className="w-6 h-6" />
              )}
        </button>
      </div>

          <div className="space-y-6">
            {isEditing ? (
              // 编辑表单
              <>
                <h4 className={`text-lg font-bold mb-4 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
                }`}>
                  {theme === 'pixel' ? 'EDIT_TASK' : '编辑任务'}
                </h4>
                
                {/* 任务标题输入 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'TASK_TITLE:' : '任务标题'}
                  </label>
                  <input
                    type="text"
                    value={editTask.title || ''}
                    onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                    className={`w-full px-3 py-2 ${
                      theme === 'pixel'
                        ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono'
                        : 'border border-gray-300 rounded-lg'
                    }`}
                    placeholder={theme === 'pixel' ? 'ENTER_TITLE...' : '输入任务标题...'}
                  />
                </div>

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

                {/* 积分输入 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'POINTS:' : '积分奖励'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editTask.points || 50}
                    onChange={(e) => setEditTask({...editTask, points: parseInt(e.target.value) || 50})}
                    className={`w-full px-3 py-2 ${
                      theme === 'pixel'
                        ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono'
                        : 'border border-gray-300 rounded-lg'
                    }`}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSaveEdit}
                    variant="primary"
                    className="flex-1"
                  >
                    {theme === 'pixel' ? 'SAVE' : '保存'}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="secondary"
                    className="flex-1"
                  >
                    {theme === 'pixel' ? 'CANCEL' : '取消'}
                  </Button>
                </div>
              </>
            ) : (
              // 任务详情显示
              <>
            {/* 任务标题 */}
            <div>
              <h4 className={`text-lg font-bold mb-2 ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
              }`}>
                {selectedTask.title}
              </h4>
              <p className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
              }`}>
                {selectedTask.description}
              </p>
                    </div>

            {/* 任务信息 */}
            <div className="space-y-4">
              {/* 基础信息 */}
            <div className={`grid grid-cols-2 gap-4 ${
              theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'
            }`}>
                {/* 时间信息 - 根据任务类型动态显示 */}
                {selectedTask.repeatType === 'once' ? (
                  // 一次性任务
                  isTimeRangeMode(selectedTask) ? (
                    <>
                      <div className="flex items-center space-x-2">
                        {theme === 'pixel' ? (
                          <PixelIcon name="clock" size="sm" />
                        ) : (
                          <ClockIcon className="w-5 h-5" />
                        )}
                        <span>执行日期：{formatDate(selectedTask.taskStartTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {theme === 'pixel' ? (
                          <PixelIcon name="clock" size="sm" />
                        ) : (
                          <ClockIcon className="w-5 h-5" />
                        )}
                        <span>时间范围：{formatTimeRange(selectedTask.taskStartTime, selectedTask.taskEndTime)}</span>
                      </div>
                    </>
                  ) : (
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="clock" size="sm" />
                ) : (
                  <ClockIcon className="w-5 h-5" />
                )}
                <span>截止日期：{formatDate(selectedTask.deadline)}</span>
                    </div>
                  )
                ) : (
                  // 重复性任务
                  <>
                    <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="calendar" size="sm" />
                      ) : (
                        <CalendarIcon className="w-5 h-5" />
                      )}
                      <span>开始日期：{formatDate(selectedTask.startDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="calendar" size="sm" />
                      ) : (
                        <CalendarIcon className="w-5 h-5" />
                      )}
                      <span>结束日期：{formatDate(selectedTask.endDate)}</span>
                    </div>
                  </>
                )}

              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="star" size="sm" className="text-pixel-accent" />
                ) : (
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  )}
                <span>
                  积分奖励：{selectedTask.points}
                  {selectedTask.repeatType === 'repeat' && (
                    <span className={`text-sm ml-1 ${
                      theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 
                      theme === 'fresh' ? 'text-fresh-textMuted' : 'text-gray-500'
                    }`}>
                      (每次完成)
                    </span>
                  )}
                </span>
              </div>

                    <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="user" size="sm" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                <span>发布者：{selectedTask.creator}</span>
                    </div>

              {selectedTask.assignee && (
                    <div className="flex items-center space-x-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="user" size="sm" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                  <span>执行者：{selectedTask.assignee}</span>
                    </div>
              )}

                <div className="flex items-center space-x-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="tag" size="sm" />
                  ) : (
                    <TagIcon className="w-5 h-5" />
                  )}
                  <span>类型：{getCategoryName(selectedTask.taskType)}</span>
                </div>
                  </div>

              {/* 重复性任务详情 */}
              {selectedTask.repeatType === 'repeat' && (
                <div className={`p-4 rounded ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h5 className={`font-bold mb-3 ${
                    theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
                  }`}>
                    {theme === 'pixel' ? 'REPEAT DETAILS' : '重复详情'}
                  </h5>
                  <div className={`grid grid-cols-2 gap-3 text-sm ${
                    theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'
                  }`}>
                  <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="refresh" size="sm" />
                      ) : (
                        <ArrowPathIcon className="w-4 h-4" />
                      )}
                      <span>频率：{getRepeatFrequencyName(selectedTask.repeatFrequency)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="calendar" size="sm" />
                      ) : (
                        <CalendarIcon className="w-4 h-4" />
                      )}
                      <span>持续时长：{getDurationLabel(selectedTask.startDate, selectedTask.endDate)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="clock" size="sm" />
                      ) : (
                        <ClockIcon className="w-4 h-4" />
                      )}
                      <span>指定时间：{selectedTask.repeatTime || '--'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {theme === 'pixel' ? (
                        <PixelIcon name="calendar" size="sm" />
                      ) : (
                        <CalendarIcon className="w-4 h-4" />
                      )}
                      <span>执行日：{getWeekdaysDisplay(selectedTask.repeatWeekdays)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 状态信息 */}
              <div className={`flex items-center justify-between p-3 rounded ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="status" size="sm" />
                  ) : (
                    <DocumentIcon className="w-5 h-5" />
                  )}
                  <span className={theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'}>
                    当前状态：
                    </span>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  theme === 'pixel'
                    ? `font-mono uppercase ${getStatusColor(selectedTask.status)}`
                    : getStatusColor(selectedTask.status)
                }`}>
                  {getStatusDisplay(selectedTask.status)}
                </span>
              </div>

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
                    <DocumentIcon className="w-5 h-5" />
                  )}
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' ? 'font-mono uppercase' : ''
                  }`}>
                    {theme === 'pixel' ? 'PROOF REQUIRED' : '此任务需要提交完成凭证'}
                  </span>
                </div>
              )}
            </div>

            {/* 任务凭证 */}
            {selectedTask.proof && (
              <div className={`p-4 rounded ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <h5 className={`font-bold mb-2 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
                }`}>
                  {theme === 'pixel' ? 'PROOF' : '完成凭证'}
                </h5>
                    <p className={`text-sm ${
                  theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
                    }`}>
                  {selectedTask.proof}
                    </p>
        </div>
            )}

            {/* 审核评价 */}
            {selectedTask.reviewComment && (
              <div className={`p-4 rounded ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <h5 className={`font-bold mb-2 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
                }`}>
                  {theme === 'pixel' ? 'REVIEW' : '审核评价'}
                </h5>
                <p className={`text-sm ${
                  theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
                }`}>
                  {selectedTask.reviewComment}
                </p>
                    </div>
                  )}

            {/* 操作按钮 */}
                  <div className="flex space-x-3">
              {/* 编辑任务按钮 - 我发布的任务且处于招募状态 */}
              {isTaskOwner && isRecruiting && view === 'published' && (
                <Button
                  onClick={() => handleEditTask(selectedTask)}
                  variant="secondary"
                  className="flex-1"
                >
                  {theme === 'pixel' ? 'EDIT_TASK' : '编辑任务'}
                </Button>
              )}

              {/* 领取任务按钮 - 可领取的视图 */}
              {view === 'available' && isRecruiting && !selectedTask.assignee && !isTaskOverdue(selectedTask) && (
                    <Button
                      onClick={async () => {
                        try {
                          await handleAcceptTask(selectedTask.id);
                        setSelectedTask(null);
                        } catch (error) {
                          console.error('❌ 领取任务按钮处理失败:', error);
                        }
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      {theme === 'pixel' ? 'ACCEPT_TASK' : '领取任务'}
                    </Button>
              )}

              {/* 开始任务按钮 - 已领取但未开始 */}
              {isAssignee && isAssigned && !isTaskOverdue(selectedTask) && (
                <div className="flex space-x-2 flex-1">
                    <Button
                      onClick={async () => {
                        try {
                          await handleStartTask(selectedTask.id);
                        setSelectedTask(null);
                        } catch (error) {
                          // 错误已经在handleStartTask中记录和显示了
                          console.error('❌ 按钮点击处理失败:', error);
                        }
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      {theme === 'pixel' ? 'START_TASK' : '开始任务'}
                    </Button>
                    <Button
                      onClick={async () => {
                        await handleAbandonTask(selectedTask.id);
                        setSelectedTask(null);
                      }}
                      variant="danger"
                      className="flex-1"
                    >
                      {theme === 'pixel' ? 'ABANDON' : '放弃'}
                    </Button>
                    </div>
                  )}

              {/* 提交任务按钮 - 进行中 */}
              {isAssignee && isInProgress && !isTaskOverdue(selectedTask) && (
                        <Button
                  onClick={() => {
                            handleCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                          variant="primary"
                          className="flex-1"
                        >
                          {theme === 'pixel' ? 'COMPLETE_TASK' : '完成任务'}
                        </Button>
              )}

              {/* 审核任务按钮 - 待审核 */}
              {isTaskOwner && isPendingReview && (
                <div className="flex space-x-2 flex-1">
                  <Button
                    onClick={() => {
                      handleReviewTask(selectedTask.id, true);
                      setSelectedTask(null);
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    {theme === 'pixel' ? 'APPROVE' : '通过'}
                  </Button>
                  <Button
                    onClick={() => {
                      handleReviewTask(selectedTask.id, false);
                        setSelectedTask(null);
                    }}
                    variant="danger"
                    className="flex-1"
                  >
                    {theme === 'pixel' ? 'REJECT' : '拒绝'}
                  </Button>
                </div>
              )}

              {/* 重新发布按钮 - 已放弃 */}
              {isTaskOwner && isAbandoned && (
                <button
                  onClick={async () => {
                    await handleRepublishTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'bg-pixel-success text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-accent'
                      : 'bg-green-500 text-white rounded-lg hover:bg-green-600'
                  }`}
                >
                  {theme === 'pixel' ? 'REPUBLISH' : '重新发布'}
                        </button>
                      )}

              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedTask(null)}
                className={`py-3 px-6 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                    ? 'bg-pixel-panel text-pixel-text font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-card'
                    : 'bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
                }`}
              >
                {theme === 'pixel' ? 'CLOSE' : '关闭'}
              </button>
            </div>
                  </>
                )}
                    </div>
                  </div>
                </div>
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
              isTaskExpiringSoon(task.deadline) ? 'animate-pulse' : ''
            }`}>
              {isTaskExpiringSoon(task.deadline) && (
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
      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : theme === 'fresh'
              ? 'font-display text-fresh-text fresh-gradient-text'
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'TASK_MANAGER.EXE' : '任务看板'}
          </h2>
          
          {/* View Switcher */}
          <div className={`flex overflow-hidden w-full sm:w-auto ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border bg-pixel-card shadow-pixel' 
              : theme === 'fresh'
              ? 'border border-fresh-border bg-fresh-card shadow-fresh rounded-fresh-lg'
              : 'border border-gray-200 rounded-lg'
          }`}>
            {[
              { id: 'published', label: theme === 'pixel' ? 'MY_PUBLISHED' : '我发布的' },
              { id: 'assigned', label: theme === 'pixel' ? 'MY_CLAIMED' : '我领取的' },
              { id: 'available', label: theme === 'pixel' ? 'AVAILABLE' : '可领取的' }
            ].map((viewOption) => (
            <button
                key={viewOption.id}
                onClick={() => setView(viewOption.id as any)}
                className={`flex items-center justify-center flex-1 px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-300 ${
              theme === 'pixel' 
                  ? `font-mono uppercase ${
                        view === viewOption.id
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                      }${viewOption.id !== 'available' ? ' border-r-4 border-pixel-border' : ''}`
                    : theme === 'fresh'
                    ? `${
                        view === viewOption.id
                          ? 'bg-fresh-accent text-white shadow-fresh-sm'
                          : 'text-fresh-text hover:bg-fresh-primary'
                      }${viewOption.id !== 'available' ? ' border-r border-fresh-border' : ''}`
                    : `${
                        view === viewOption.id
                          ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }${viewOption.id !== 'available' ? ' border-r border-gray-200' : ''}`
              }`}
            >
              <span className="font-medium whitespace-nowrap">
                {viewOption.label}
            </span>
            </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="md"
            icon="refresh"
            iconComponent={<ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            disabled={isRefreshing}
          >
            {theme === 'pixel' ? 'REFRESH' : '刷新'}
          </Button>
          <Button
          onClick={() => setShowAddForm(true)}
            variant="primary"
            size="md"
            icon="plus"
            iconComponent={<PlusIcon className="w-4 h-4" />}
          >
            {theme === 'pixel' ? 'NEW_TASK' : '新建任务'}
          </Button>
        </div>
      </div>

      {/* Task Columns */}
      <div className="space-y-8">
        {loading || !tasksLoaded || !userProfile ? (
          <LoadingSpinner
            size="lg"
            title={theme === 'pixel' ? 'LOADING TASKS...' : '正在加载任务列表...'}
            subtitle={theme === 'pixel' ? 'FETCHING DATA...' : '正在从数据库获取任务数据'}
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
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg' 
              : theme === 'fresh'
              ? 'bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh-lg'
              : 'bg-white rounded-xl shadow-xl'
          }`}>
            {/* 表单头部 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                theme === 'fresh' ? 'text-fresh-text' : 'text-gray-800'
              }`}>
                {theme === 'pixel' ? 'CREATE_NEW_TASK' : '新建任务'}
            </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="关闭"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="close" size="sm" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 任务标题 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TITLE *' : '任务标题 *'}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_TITLE...' : '输入任务标题'}
                />
              </div>

              {/* 任务描述 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_DESCRIPTION' : '任务描述'}
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_DESCRIPTION...' : '输入任务描述'}
                />
              </div>

              {/* 任务类型 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TYPE *' : '任务类型 *'}
                </label>
                <select
                  value={newTask.taskType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value as 'daily' | 'habit' | 'special' }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="daily">{theme === 'pixel' ? 'DAILY_TASK' : '日常任务'}</option>
                  <option value="habit">{theme === 'pixel' ? 'HABIT_TASK' : '习惯任务'}</option>
                  <option value="special">{theme === 'pixel' ? 'SPECIAL_TASK' : '特殊任务'}</option>
                </select>
              </div>

              {/* 重复类型 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REPEAT_TYPE *' : '重复类型 *'}
                </label>
                <select
                  value={newTask.repeatType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, repeatType: e.target.value as 'once' | 'repeat' }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="once">{theme === 'pixel' ? 'ONE_TIME' : '一次性任务'}</option>
                  <option value="repeat">{theme === 'pixel' ? 'REPEATING' : '重复任务'}</option>
                </select>
              </div>

              {/* 任务时间字段（动态显示） */}
              {renderTaskTimeFields()}

              {/* 积分奖励 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'POINTS_REWARD *' : '积分奖励 *'}
                </label>
                <input
                  type="number"
                  value={newTask.points}
                  onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="1000"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'pixel' 
                      ? 'border-pixel-border bg-pixel-card text-pixel-text font-mono focus:ring-pixel-accent' 
                      : theme === 'fresh'
                      ? 'border-fresh-border bg-fresh-bg text-fresh-text focus:ring-fresh-primary'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={theme === 'pixel' ? '50' : '输入积分 (1-1000)'}
                />
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 
                  theme === 'fresh' ? 'text-fresh-textMuted' : 'text-gray-500'
                }`}>
                  {newTask.repeatType === 'repeat' 
                    ? '重复性任务：每次完成都可获得此积分奖励' 
                    : '一次性任务：完成后获得此积分奖励'
                  }
                </p>
              </div>

              {/* 需要凭证 */}
              <div className="flex items-center">
                  <input
                    type="checkbox"
                  id="requiresProof"
                    checked={newTask.requiresProof}
                  onChange={(e) => setNewTask(prev => ({ ...prev, requiresProof: e.target.checked }))}
                  className={`mr-3 ${
                    theme === 'pixel' ? 'text-pixel-accent' : theme === 'fresh' ? 'text-fresh-primary' : 'text-blue-500'
                    }`}
                  />
                <label htmlFor="requiresProof" className={`text-sm ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 
                  theme === 'fresh' ? 'text-fresh-text' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REQUIRES_PROOF' : '需要提交凭证'}
                </label>
            </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-4">
                                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewTask({
                      title: '',
                      description: '',
                      deadline: '',
                      time: '',
                      points: 50,
                      requiresProof: false,
                      taskType: 'daily',
                      repeatType: 'once',
                      repeatFrequency: 'daily',
                      startDate: '',
                      endDate: '',
                      repeatTime: '',
                      repeatWeekdays: [],
                      taskStartTime: '',
                      taskEndTime: ''
                    });
                    setUseTimeRange(false);
                    setSelectedDuration('21days');
                    setRepeatHasSpecificTime(false);
                    setShowAddForm(false);
                  }}
                  className="flex-1"
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateTask}
                  className="flex-1"
                >
                  {theme === 'pixel' ? 'CREATE_TASK' : '创建任务'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard; 
