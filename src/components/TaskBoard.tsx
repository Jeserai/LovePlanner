// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import LoadingSpinner from './ui/LoadingSpinner';
import PointsDisplay from './PointsDisplay';
import Button from './ui/Button';
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
  ConfirmDialog
} from './ui/Components';
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

// 编辑任务的状态类型（包含新字段）
interface EditTaskState {
  title?: string;
  description?: string;
  points?: number;
  taskType?: 'daily' | 'habit' | 'special';
  requiresProof?: boolean;
  // 新的重复字段
  repeat?: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  // 一次性任务时间字段
  taskStartTime?: string;
  taskEndTime?: string;
  // 重复任务字段
  repeatStartDate?: string;
  endRepeat?: 'never' | 'on_date';
  endRepeatDate?: string;
  taskTimeStart?: string;
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
    // 一次性任务时间设置
    taskStartTime: '', // 任务开始时间（可选）
    taskEndTime: '',   // 任务结束时间（必填）
    points: 50,
    requiresProof: false,
    taskType: 'daily' as 'daily' | 'habit' | 'special',
    repeat: 'never' as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    // 重复任务设置
    repeatStartDate: '', // 重复任务循环开始日期（必填）
    endRepeat: 'never' as 'never' | 'on_date',
    endRepeatDate: '',   // 结束重复的日期
    taskTimeStart: '',   // 指定任务时间段 - 开始时间（可选）
    taskTimeEnd: ''      // 指定任务时间段 - 结束时间（可选）
  });

  // UI辅助状态已简化
  
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
  const [editTask, setEditTask] = useState<EditTaskState>({});
  
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
                                      handleCloseTaskDetail();
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

    // 验证时间设置
    if (newTask.repeat === 'never') {
      // 一次性任务：任务结束时间必填
      if (!newTask.taskEndTime) {
        alert('请选择任务结束时间');
        return;
      }
      
      // 验证结束时间不能是过去
      const endTime = new Date(newTask.taskEndTime);
      if (endTime <= new Date()) {
        alert('任务结束时间不能是过去时间');
        return;
      }
      
      // 如果有开始时间，验证开始时间要早于结束时间
      if (newTask.taskStartTime) {
        const startTime = new Date(newTask.taskStartTime);
        if (startTime >= endTime) {
          alert('任务开始时间必须早于结束时间');
          return;
        }
      }
    } else {
      // 重复任务：循环开始日期必填
      if (!newTask.repeatStartDate) {
        alert('请选择重复任务的循环开始日期');
        return;
      }
      
      // 验证开始日期不能是过去
      const startDate = new Date(newTask.repeatStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        alert('循环开始日期不能是过去日期');
        return;
      }
      
      // 验证结束重复设置
      if (newTask.endRepeat === 'on_date' && !newTask.endRepeatDate) {
        alert('请选择结束重复的日期');
        return;
      }
      
      if (newTask.endRepeat === 'on_date') {
        const endDate = new Date(newTask.endRepeatDate);
        if (endDate <= startDate) {
          alert('结束重复日期必须晚于开始日期');
          return;
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
          created_at: new Date().toISOString()
        };

        if (newTask.repeat === 'never') {
          // 一次性任务
          dbTaskData.repeat_type = 'once';
          dbTaskData.deadline = new Date(newTask.taskEndTime).toISOString();
          
          // 如果有开始时间，保存到task_start_time字段
          if (newTask.taskStartTime) {
            dbTaskData.task_start_time = new Date(newTask.taskStartTime).toISOString();
          }
          
          // 保存结束时间到task_end_time字段
          dbTaskData.task_end_time = new Date(newTask.taskEndTime).toISOString();
        } else {
          // 重复任务
          dbTaskData.repeat_type = 'repeat';
          dbTaskData.repeat_frequency = newTask.repeat;
          
          // 设置循环开始日期
          dbTaskData.start_date = newTask.repeatStartDate;
          
          // 设置结束日期
          if (newTask.endRepeat === 'on_date') {
            dbTaskData.end_date = newTask.endRepeatDate;
            dbTaskData.deadline = `${newTask.endRepeatDate}T23:59:59.000Z`;
          } else {
            // 默认设置结束日期为3年后（重复任务默认长期运行）
            const startDate = new Date(newTask.repeatStartDate);
            const threeYearsLater = new Date(startDate);
            threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
            const endDateStr = threeYearsLater.toISOString().split('T')[0];
            dbTaskData.end_date = endDateStr;
            dbTaskData.deadline = `${endDateStr}T23:59:59.000Z`;
          }
          
          // 如果指定了任务时间段，保存时间信息
          if (newTask.taskTimeStart && newTask.taskTimeEnd) {
            // 将开始时间保存到repeat_time字段（兼容现有数据库结构）
            dbTaskData.repeat_time = newTask.taskTimeStart;
            // 将结束时间保存到task_end_time字段
            dbTaskData.task_end_time = `1970-01-01T${newTask.taskTimeEnd}:00.000Z`; // 使用固定日期+时间
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
      throw new Error('用户未登录或缺少情侣关系信息');
    }

            // 重置表单
        setNewTask({
          title: '',
          description: '',
          taskStartTime: '',
          taskEndTime: '',
          points: 50,
          requiresProof: false,
          taskType: 'daily',
          repeat: 'never',
          repeatStartDate: '',
          endRepeat: 'never',
          endRepeatDate: '',
          taskTimeStart: '',
          taskTimeEnd: ''
        });
        setShowAddForm(false);
  };

  // 渲染任务时间字段（根据repeat类型动态显示）
  const renderTaskTimeFields = () => {
    if (newTask.repeat === 'never') {
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
              value={newTask.taskStartTime}
              onChange={(e) => setNewTask(prev => ({ ...prev, taskStartTime: e.target.value }))}
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
              value={newTask.taskEndTime}
              onChange={(e) => setNewTask(prev => ({ ...prev, taskEndTime: e.target.value }))}
              min={newTask.taskStartTime || new Date().toISOString().slice(0, 16)}
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
              value={newTask.repeatStartDate}
              onChange={(e) => setNewTask(prev => ({ ...prev, repeatStartDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
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
                value={newTask.endRepeatDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, endRepeatDate: e.target.value }))}
                min={newTask.repeatStartDate || new Date().toISOString().split('T')[0]}
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
      </ThemeCard>
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
                  <XMarkIcon className="h-4 w-4" />
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
                  <XMarkIcon className="h-4 w-4" />
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
                  {theme === 'pixel' ? 'EDIT_TASK' : '编辑任务'}
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
              // 任务详情显示 - 使用统一的字段组件
              <div className="space-y-4">
                <DetailField
                  label={theme === 'pixel' ? 'TASK_TITLE' : theme === 'modern' ? 'Task Title' : '任务标题'}
                  value={selectedTask.title}
                  valueClassName="text-lg font-medium"
                />

                <DetailField
                  label={theme === 'pixel' ? 'DESCRIPTION' : theme === 'modern' ? 'Description' : '任务描述'}
                  value={selectedTask.description || '--'}
                />

                <DetailField
                  label={theme === 'pixel' ? 'CREATOR' : theme === 'modern' ? 'Creator' : '发布者'}
                  value={selectedTask.creator}
                />

                <DetailField
                  label={theme === 'pixel' ? 'STATUS' : theme === 'modern' ? 'Status' : '任务状态'}
                  value={selectedTask.status === 'recruiting' ? '招募中' : 
                         selectedTask.status === 'assigned' ? '已领取' :
                         selectedTask.status === 'in_progress' ? '进行中' :
                         selectedTask.status === 'pending_review' ? '待审核' :
                         selectedTask.status === 'completed' ? '已完成' :
                         selectedTask.status === 'abandoned' ? '已放弃' : selectedTask.status}
                />

                <DetailField
                  label={theme === 'pixel' ? 'POINTS' : theme === 'modern' ? 'Points' : '奖励积分'}
                  value={`${selectedTask.points || 0} ${selectedTask.repeatType === 'repeat' ? '(每次完成)' : ''}`}
                />
                {/* 时间信息 - 根据任务类型动态显示 */}
                {selectedTask.repeatType === 'once' ? (
                  // 一次性任务
                  isTimeRangeMode(selectedTask) ? (
                    <>
                      <DetailField
                        label={theme === 'pixel' ? 'EXECUTION_DATE' : theme === 'modern' ? 'Execution Date' : '执行日期'}
                        value={formatDate(selectedTask.taskStartTime)}
                      />
                      <DetailField
                        label={theme === 'pixel' ? 'TIME_RANGE' : theme === 'modern' ? 'Time Range' : '时间范围'}
                        value={formatTimeRange(selectedTask.taskStartTime, selectedTask.taskEndTime)}
                      />
                    </>
                  ) : (
                    <DetailField
                      label={theme === 'pixel' ? 'DEADLINE' : theme === 'modern' ? 'Deadline' : '截止日期'}
                      value={formatDate(selectedTask.deadline)}
                    />
                  )
                ) : (
                  // 重复性任务
                  <>
                    <DetailField
                      label={theme === 'pixel' ? 'START_DATE' : theme === 'modern' ? 'Start Date' : '开始日期'}
                      value={selectedTask.startDate ? formatDate(selectedTask.startDate) : '--'}
                    />
                    <DetailField
                      label={theme === 'pixel' ? 'END_DATE' : theme === 'modern' ? 'End Date' : '结束日期'}
                      value={selectedTask.endDate ? formatDate(selectedTask.endDate) : '--'}
                    />
                    <DetailField
                      label={theme === 'pixel' ? 'REPEAT_FREQUENCY' : theme === 'modern' ? 'Repeat Frequency' : '重复频率'}
                      value={selectedTask.repeatFrequency || '--'}
                    />
                    {selectedTask.repeatWeekdays && (
                      <DetailField
                        label={theme === 'pixel' ? 'REPEAT_DAYS' : theme === 'modern' ? 'Repeat Days' : '重复日期'}
                        value={selectedTask.repeatWeekdays}
                      />
                    )}
                    {selectedTask.repeatTime && (
                      <DetailField
                        label={theme === 'pixel' ? 'REPEAT_TIME' : theme === 'modern' ? 'Repeat Time' : '重复时间'}
                        value={selectedTask.repeatTime}
                      />
                    )}
                  </>
                )}

                {/* 领取者信息 */}
                {selectedTask.assignee && (
                  <DetailField
                    label={theme === 'pixel' ? 'ASSIGNEE' : theme === 'modern' ? 'Assignee' : '领取者'}
                    value={selectedTask.assignee}
                  />
                )}

                <DetailField
                  label={theme === 'pixel' ? 'TASK_TYPE' : theme === 'modern' ? 'Task Type' : '任务类型'}
                  value={selectedTask.taskType === 'daily' ? '日常任务' : 
                         selectedTask.taskType === 'habit' ? '习惯养成' :
                         selectedTask.taskType === 'special' ? '特殊任务' : selectedTask.taskType}
                />

                {/* 需要凭证 */}
                {selectedTask.requiresProof && (
                  <DetailField
                    label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要凭证'}
                    value={theme === 'pixel' ? 'YES' : theme === 'modern' ? 'Yes' : '是'}
                  />
                )}

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
                          {/* 领取任务按钮 - 招募中 */}
                          {!isTaskOwner && isRecruiting && (
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

                          {/* 开始任务按钮 - 已领取但未开始 */}
                          {isAssignee && isAssigned && !isTaskOverdue(selectedTask) && (
                            <>
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
                              <ThemeButton
                                variant="danger"
                                onClick={async () => {
                                  await handleAbandonTask(selectedTask.id);
                                  handleCloseTaskDetail();
                                }}
                              >
                                {theme === 'pixel' ? 'ABANDON' : theme === 'modern' ? 'Abandon' : '放弃'}
                              </ThemeButton>
                            </>
                          )}

                          {/* 提交任务按钮 - 进行中 */}
                          {isAssignee && isInProgress && !isTaskOverdue(selectedTask) && (
                            <ThemeButton
                              variant="primary"
                  onClick={() => {
                                handleCompleteTask(selectedTask.id);
                    handleCloseTaskDetail();
                  }}
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
                    <ThemeButton
          onClick={() => setShowAddForm(true)}
                              variant="primary"
                  size="md"
          >
            {theme === 'pixel' ? 'NEW_TASK' : theme === 'modern' ? 'New Task' : '新建任务'}
          </ThemeButton>
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
      <ThemeDialog 
        open={showAddForm} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            setNewTask({
              title: '',
              description: '',
              taskStartTime: '',
              taskEndTime: '',
              points: 50,
              requiresProof: false,
              taskType: 'daily',
              repeat: 'never',
              repeatStartDate: '',
              endRepeat: 'never',
              endRepeatDate: '',
              taskTimeStart: '',
              taskTimeEnd: ''
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
              {/* 任务标题 */}
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

              {/* 任务描述 */}
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

              {/* 任务类型 */}
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

              {/* 重复频率 */}
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

              {/* 任务时间字段（动态显示） */}
              {renderTaskTimeFields()}

              {/* 积分奖励 */}
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

              {/* 需要凭证 */}
              <ThemeCheckbox
                label={theme === 'pixel' ? 'REQUIRES_PROOF' : theme === 'modern' ? 'Requires Proof' : '需要提交凭证'}
                    checked={newTask.requiresProof}
                onChange={(e) => setNewTask(prev => ({ ...prev, requiresProof: e.target.checked }))}
                  />

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
                taskStartTime: '',
                taskEndTime: '',
                points: 50,
                requiresProof: false,
                taskType: 'daily',
                repeat: 'never',
                repeatStartDate: '',
                endRepeat: 'never',
                endRepeatDate: '',
                taskTimeStart: '',
                taskTimeEnd: ''
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
    </div>
  );
};

export default TaskBoard; 
