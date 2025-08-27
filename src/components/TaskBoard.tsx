// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import PointsDisplay from './PointsDisplay';
import { useAuth } from '../hooks/useAuth';
import { taskService, userService } from '../services/database';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// 前端Task接口（兼容原有代码）
interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  points: number;
  status: 'recruiting' | 'assigned' | 'in-progress' | 'completed' | 'abandoned' | 'pending_review';
  assignee?: string;
  creator: string;
  createdAt: string;
  requiresProof: boolean;
  proof?: string;
  taskType: 'daily' | 'habit' | 'special';
  repeatType: 'once' | 'repeat';
  reviewComment?: string;
  submittedAt?: string;
}

// 数据库Task类型
type DatabaseTask = Database['public']['Tables']['tasks']['Row'];

interface TaskBoardProps {
  currentUser?: string | null;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [view, setView] = useState<'published' | 'assigned' | 'available'>('published');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [publishedPage, setPublishedPage] = useState<string>('active'); // 添加分页状态
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    points: 50,
    requiresProof: false,
    taskType: 'daily' as const
  });
  
  // 数据库相关状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<{[id: string]: string}>({});


  // 数据库任务转换为前端Task格式
  const convertDatabaseTaskToTask = (dbTask: DatabaseTask): Task => {
    // 调试用户映射
    console.log(`🔄 转换任务 ${dbTask.id}:`);
    console.log(`   创建者ID: ${dbTask.creator_id} => 映射名称: ${userMap[dbTask.creator_id] || '未找到映射'}`);
    if (dbTask.assignee_id) {
      console.log(`   执行者ID: ${dbTask.assignee_id} => 映射名称: ${userMap[dbTask.assignee_id] || '未找到映射'}`);
    }
    
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
      submittedAt: dbTask.submitted_at || undefined
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
          console.log('✅ 用户映射加载完成:', mapping);
          console.log('📊 用户映射详情:');
          for (const [id, name] of Object.entries(mapping)) {
            console.log(`   ${id} => ${name}`);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      }
      setLoading(false);
    };

    loadCoupleData();
  }, [user]);

  // 加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      if (!coupleId) {
        setTasks([]);
        return;
      }

      // 检查用户映射是否已加载
      if (Object.keys(userMap).length === 0) {
        console.log('⚠️ 用户映射尚未加载，等待用户映射加载完成后再加载任务');
        return;
      }

      try {
        console.log('🔍 开始加载任务数据，用户映射状态:', Object.keys(userMap).length > 0 ? '已加载' : '未加载');
        const dbTasks = await taskService.getCoupleTasksOld(coupleId);
        console.log(`📥 从数据库获取了 ${dbTasks.length} 个任务，开始转换...`);
        const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
        setTasks(convertedTasks);
        console.log(`✅ 从数据库加载了 ${convertedTasks.length} 个任务`);
      } catch (error) {
        console.error('❌ 加载任务失败:', error);
        setTasks([]);
      }
    };

    if (!loading && coupleId) {
      if (Object.keys(userMap).length > 0) {
        loadTasks();
      } else {
        console.log('⚠️ 用户映射为空，等待用户映射加载');
      }
    }
  }, [coupleId, loading, userMap]);

  // 获取当前用户名称
  const getCurrentUserName = () => {
    if (!currentUser) return 'Whimsical Cat';
    if (currentUser.toLowerCase().includes('cat')) return 'Whimsical Cat';
    if (currentUser.toLowerCase().includes('cow')) return 'Whimsical Cow';
    return 'Whimsical Cat';
  };

  const currentUserName = getCurrentUserName();

  // 重新加载任务数据的函数
  const reloadTasks = async () => {

    if (!coupleId) {
      setTasks([]);
      return;
    }

    // 确保用户映射已加载
    if (Object.keys(userMap).length === 0) {
      console.log('⚠️ 重新加载任务时发现用户映射为空，尝试重新加载用户映射');
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
          console.log('✅ 用户映射重新加载完成:', mapping);
        }
      } catch (error) {
        console.error('❌ 重新加载用户映射失败:', error);
        return; // 如果用户映射加载失败，不继续加载任务
      }
    }

    try {
      const dbTasks = await taskService.getCoupleTasksOld(coupleId);
      console.log(`📥 重新加载: 从数据库获取了 ${dbTasks.length} 个任务，开始转换...`);
      const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
      setTasks(convertedTasks);
      console.log(`✅ 重新加载了 ${convertedTasks.length} 个任务`);
    } catch (error) {
      console.error('❌ 重新加载任务失败:', error);
    }
  };

  // 数据库任务操作辅助函数
  const updateTaskInDatabase = async (taskId: string, updates: Partial<Task>) => {

    try {
      // 数据库模式：更新数据库然后重新加载
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assignee) dbUpdates.assignee_id = updates.assignee;
      if (updates.proof) dbUpdates.proof_url = updates.proof;
      if (updates.reviewComment) dbUpdates.review_comment = updates.reviewComment;
      if (updates.submittedAt) dbUpdates.submitted_at = updates.submittedAt;

      await taskService.updateTask(taskId, dbUpdates);
      await reloadTasks(); // 重新加载数据
      console.log(`✅ 任务 ${taskId} 更新成功`);
    } catch (error) {
      console.error('❌ 更新任务失败:', error);
      alert('更新任务失败，请重试');
    }
  };

  // 任务操作函数
  const handleAcceptTask = async (taskId: string) => {
    await updateTaskInDatabase(taskId, {
      assignee: currentUserName,
      status: 'assigned'
    });
  };

  const handleStartTask = async (taskId: string) => {
    await updateTaskInDatabase(taskId, {
      status: 'in-progress'
    });
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
      // 不需要凭证的任务直接完成
      await updateTaskInDatabase(taskId, { 
        status: 'completed',
        submittedAt: new Date().toISOString()
      });
    }
  };

    const handleReviewTask = async (taskId: string, approved: boolean, comment?: string) => {
    if (approved) {
      await updateTaskInDatabase(taskId, { 
        status: 'completed',
        reviewComment: comment 
      });
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
      await updateTaskInDatabase(taskId, { 
        status: 'recruiting',
        assignee: undefined
      });
    }
  };

  // 重新发布任务
  const handleRepublishTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'abandoned') return;
    
    await updateTaskInDatabase(taskId, { 
      status: 'recruiting',
      assignee: undefined,
      proof: undefined,
      reviewComment: undefined
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

  // 自动将过期任务移动到abandoned状态
  const moveOverdueTasksToAbandoned = async () => {
    const overdueTasksUpdates = tasks.filter(task => {
      // 检查各种状态的过期任务
      return (
        (task.status === 'in-progress' && isTaskOverdue(task)) ||
        (task.status === 'assigned' && isTaskOverdue(task)) ||
        (task.status === 'recruiting' && isTaskOverdue(task))
      );
    });
    
    // 批量更新过期任务
    for (const task of overdueTasksUpdates) {
      await updateTaskInDatabase(task.id, { status: 'abandoned' });
    }
    
    if (overdueTasksUpdates.length > 0) {
      console.log(`✅ 已将 ${overdueTasksUpdates.length} 个过期任务标记为已放弃`);
    }
  };

  // 在组件加载时检查并移动过期任务
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      moveOverdueTasksToAbandoned();
    }
  }, [loading, tasks]);

  // 创建新任务
  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.deadline) {
      alert('请填写任务标题和截止日期');
      return;
    }

      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
      deadline: newTask.deadline,
        points: newTask.points,
        status: 'recruiting',
      creator: currentUserName,
        createdAt: new Date().toISOString().split('T')[0],
        requiresProof: newTask.requiresProof,
        taskType: newTask.taskType,
      repeatType: 'once'
    };

    if (user && coupleId) {
      try {
        // 保存到数据库
        const dbTaskData = {
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          points: task.points,
          status: task.status,
          couple_id: coupleId,
          creator_id: user.id,
          requires_proof: task.requiresProof,
          task_type: task.taskType,
          repeat_type: task.repeatType,
          created_at: new Date().toISOString()
        };

        await taskService.createTask(dbTaskData);
        await reloadTasks(); // 重新加载数据
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
      points: 50,
        requiresProof: false,
      taskType: 'daily'
      });
      setShowAddForm(false);
  };

  // 按状态筛选任务
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // 按视图筛选任务
  const getTasksByView = () => {
    const currentUserName = getCurrentUserName();
    
    switch (view) {
      case 'published':
        return tasks.filter(task => task.creator === currentUserName);
      case 'assigned':
        return tasks.filter(task => task.assignee === currentUserName);
      case 'available':
        return tasks.filter(task => task.status === 'recruiting' && task.creator !== currentUserName);
      default:
        return tasks;
    }
  };

  // 获取已发布的任务
  const getPublishedTasks = () => {
    const currentUserName = getCurrentUserName();
    return tasks.filter(task => task.creator === currentUserName);
  };

  // 获取已分配的任务
  const getAssignedTasks = () => {
    const currentUserName = getCurrentUserName();
    return tasks.filter(task => task.assignee === currentUserName);
  };

  // 获取可领取的任务
  const getAvailableTasks = () => {
    const currentUserName = getCurrentUserName();
    return tasks.filter(task => task.status === 'recruiting' && task.creator !== currentUserName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'recruiting': '招募中',
      'assigned': '已分配',
      'in-progress': '进行中', 
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

  const getStatusColor = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'recruiting': return 'border-pixel-info bg-pixel-card border-4';
        case 'assigned': return 'border-pixel-warning bg-pixel-card border-4';
        case 'in-progress': return 'border-pixel-info bg-pixel-panel border-4';
        case 'completed': return 'border-pixel-success bg-pixel-card border-4';
        case 'abandoned': return 'border-pixel-accent bg-pixel-card border-4';
        case 'pending_review': return 'border-pixel-warning bg-pixel-card border-4';
        default: return 'border-pixel-border bg-pixel-panel border-4';
      }
    }
    
    switch (status) {
      case 'recruiting': return 'border-blue-300 bg-blue-50';
      case 'assigned': return 'border-yellow-300 bg-yellow-50';
      case 'in-progress': return 'border-blue-300 bg-blue-50';
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
    const isCurrentUserCreator = task.creator === currentUserName;
    const isPublishedView = view === 'published';
    const isAssignedView = view === 'assigned';
    const isAvailableView = view === 'available';
    const isExpiringSoon = isTaskExpiringSoon(task.deadline);
    const isOverdue = isTaskOverdue(task);

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className={`p-4 mb-4 cursor-pointer transition-all duration-300 ${
          theme === 'pixel' 
            ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:border-pixel-accent'
            : 'bg-white rounded-xl shadow-soft hover:shadow-lg hover:border-primary-300'
        } ${getStatusColor(task.status)} ${isExpiringSoon ? 'border-yellow-500' : ''} ${isOverdue ? 'border-red-500 opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className={`font-bold ${
            theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
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
          theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
        }`}>
          {task.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 只在"我的任务"和"可领取"视图中显示创建者 */}
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
            
            {/* 只在"已发布"和"可领取"视图中显示执行者 */}
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

          <div className="flex items-center space-x-3">
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
                {formatDate(task.deadline)}
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
                {task.points}
              </span>
            </div>

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
      </div>
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

    const isTaskOwner = selectedTask.creator === currentUserName;
    const isAssignee = selectedTask.assignee === currentUserName;
    const isRecruiting = selectedTask.status === 'recruiting';
    const isAssigned = selectedTask.status === 'assigned';
    const isInProgress = selectedTask.status === 'in-progress';
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
            <div className={`grid grid-cols-2 gap-4 ${
              theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'
            }`}>
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="clock" size="sm" />
                ) : (
                  <ClockIcon className="w-5 h-5" />
                )}
                <span>截止日期：{formatDate(selectedTask.deadline)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="star" size="sm" className="text-pixel-accent" />
                ) : (
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                )}
                <span>积分奖励：{selectedTask.points}</span>
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
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="refresh" size="sm" />
                ) : (
                  <ArrowPathIcon className="w-5 h-5" />
                )}
                <span>重复：{getRepeatTypeName(selectedTask)}</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="status" size="sm" />
                ) : (
                  <DocumentIcon className="w-5 h-5" />
                )}
                <span>状态：{getStatusDisplay(selectedTask.status)}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  theme === 'pixel'
                    ? `font-mono uppercase ${getStatusColor(selectedTask.status)}`
                    : getStatusColor(selectedTask.status)
                }`}>
                  {getStatusDisplay(selectedTask.status)}
                </span>
              </div>
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
              {/* 领取任务按钮 - 可领取视图 */}
              {view === 'available' && isRecruiting && !selectedTask.assignee && !isTaskOverdue(selectedTask) && (
                <button
                  onClick={() => {
                    handleAcceptTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'bg-pixel-info text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-accent'
                      : 'bg-blue-500 text-white rounded-lg hover:bg-blue-600'
                  }`}
                >
                  {theme === 'pixel' ? 'ACCEPT_TASK' : '领取任务'}
                </button>
              )}

              {/* 开始任务按钮 - 已领取但未开始 */}
              {isAssignee && isAssigned && !isTaskOverdue(selectedTask) && (
                <div className="flex space-x-2 flex-1">
                  <button
                    onClick={() => {
                      handleStartTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-warning text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-accent'
                        : 'bg-yellow-500 text-white rounded-lg hover:bg-yellow-600'
                    }`}
                  >
                    {theme === 'pixel' ? 'START_TASK' : '开始任务'}
                  </button>
                  <button
                    onClick={() => {
                      handleAbandonTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-accent text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-purple'
                        : 'bg-red-500 text-white rounded-lg hover:bg-red-600'
                    }`}
                  >
                    {theme === 'pixel' ? 'ABANDON' : '放弃'}
                  </button>
                </div>
              )}

              {/* 提交任务按钮 - 进行中 */}
              {isAssignee && isInProgress && !isTaskOverdue(selectedTask) && (
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'bg-pixel-success text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-accent'
                      : 'bg-green-500 text-white rounded-lg hover:bg-green-600'
                  }`}
                >
                  {theme === 'pixel' ? 'COMPLETE_TASK' : '完成任务'}
                </button>
              )}

              {/* 审核任务按钮 - 待审核 */}
              {isTaskOwner && isPendingReview && (
                <div className="flex space-x-2 flex-1">
                  <button
                    onClick={() => {
                      handleReviewTask(selectedTask.id, true);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-success text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-accent'
                        : 'bg-green-500 text-white rounded-lg hover:bg-green-600'
                    }`}
                  >
                    {theme === 'pixel' ? 'APPROVE' : '通过'}
                  </button>
                  <button
                    onClick={() => {
                      handleReviewTask(selectedTask.id, false);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-accent text-black font-mono uppercase border-2 border-pixel-border rounded-pixel shadow-pixel hover:bg-pixel-purple'
                        : 'bg-red-500 text-white rounded-lg hover:bg-red-600'
                    }`}
                  >
                    {theme === 'pixel' ? 'REJECT' : '拒绝'}
                  </button>
                </div>
              )}

              {/* 重新发布按钮 - 已放弃 */}
              {isTaskOwner && isAbandoned && (
                <button
                  onClick={() => {
                    handleRepublishTask(selectedTask.id);
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
          </div>
        </div>
      </div>
    );
  };

  // 渲染任务列表（原始的复杂布局）
  const renderTaskList = (taskList: Task[], type: 'published' | 'assigned' | 'available') => {
    if (type === 'published') {
      const recruitingTasks = taskList.filter(task => task.status === 'recruiting');
      const inProgressTasks = taskList.filter(task => task.status === 'in-progress');
      const pendingReviewTasks = taskList.filter(task => task.status === 'pending_review');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

      if (publishedPage === 'active') {
        return (
          <div className="space-y-6">
            {/* 活跃任务页面 */}
            <div className="relative mb-6">
              {/* 左侧箭头 */}
              <button
                onClick={() => setPublishedPage('completed')}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="上一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-left" size="sm" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 右侧箭头 */}
              <button
                onClick={() => setPublishedPage('completed')}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="下一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-right" size="sm" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
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
              <button
                onClick={() => setPublishedPage('active')}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="上一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-left" size="sm" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 右侧箭头 */}
              <button
                onClick={() => setPublishedPage('active')}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="下一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-right" size="sm" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
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
      // "我的任务"视图 - 按状态分类为四列
      const notStartedTasks = taskList.filter(task => task.status === 'assigned');
      const inProgressTasks = taskList.filter(task => task.status === 'in-progress');
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-3xl font-bold ${
          theme === 'pixel' 
            ? 'font-retro text-pixel-text uppercase tracking-wider' 
            : 'font-display text-gray-700'
        }`}>
          {theme === 'pixel' ? 'TASK_MANAGER.EXE' : '任务看板'}
        </h2>
      </div>

      {/* View Switcher and Add Button */}
      <div className="flex items-center justify-between w-full mb-6">
          <div className={`flex ${
          theme === 'pixel' 
              ? 'bg-pixel-panel border-2 border-pixel-border rounded-pixel p-1'
              : 'bg-gray-100 rounded-xl p-1'
          }`}>
            {[
              { id: 'published', label: theme === 'pixel' ? 'PUBLISHED' : '已发布' },
              { id: 'assigned', label: theme === 'pixel' ? 'MY_TASKS' : '我的任务' },
              { id: 'available', label: theme === 'pixel' ? 'AVAILABLE' : '可领取' }
            ].map((viewOption) => (
              <button
                key={viewOption.id}
                onClick={() => setView(viewOption.id as any)}
                className={`px-4 py-2 transition-all ${
              theme === 'pixel' 
                    ? `font-mono text-xs font-bold uppercase tracking-wider ${
                        view === viewOption.id
                          ? 'bg-pixel-accent text-black rounded-pixel border-2 border-pixel-border shadow-pixel'
                          : 'text-pixel-text hover:text-pixel-accent'
                      }`
                    : `font-medium text-sm ${
                        view === viewOption.id
                          ? 'bg-white text-gray-900 rounded-lg shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`
                }`}
              >
                {viewOption.label}
              </button>
            ))}
          </div>
          
        <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center space-x-2 px-4 py-2 transition-all ${
            theme === 'pixel'
                ? 'bg-pixel-success text-black font-mono uppercase font-bold border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:bg-pixel-accent'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700'
          }`}
        >
              {theme === 'pixel' ? (
              <PixelIcon name="plus" size="sm" />
              ) : (
              <PlusIcon className="w-4 h-4" />
              )}
            <span className={theme === 'pixel' ? 'font-mono' : ''}>
              {theme === 'pixel' ? 'NEW_TASK' : '新建任务'}
            </span>
        </button>
      </div>

            {/* Task Columns */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-8">
            <div className={`${theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-500'}`}>
              {theme === 'pixel' ? 'LOADING...' : '加载中...'}
            </div>
          </div>
        ) : (
          <>
            {view === 'published' && (
              <div>
                {renderTaskList(getPublishedTasks(), 'published')}
              </div>
            )}

            {view === 'assigned' && (
              <div>
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'pixel' 
                    ? 'font-retro text-pixel-text uppercase tracking-wider' 
                    : 'font-display text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'ASSIGNED_TASKS' : '我领取的任务'}
                </h3>
                {renderTaskList(getAssignedTasks(), 'assigned')}
              </div>
            )}

            {view === 'available' && (
              <div>
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'pixel' 
                    ? 'font-retro text-pixel-text uppercase tracking-wider' 
                    : 'font-display text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'AVAILABLE_TASKS' : '可领取的任务'}
                </h3>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">新建任务</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务标题 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入任务标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务描述
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入任务描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期 *
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  积分奖励
                </label>
                <input
                  type="number"
                  value={newTask.points}
                  onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                  <input
                    type="checkbox"
                  id="requiresProof"
                    checked={newTask.requiresProof}
                  onChange={(e) => setNewTask(prev => ({ ...prev, requiresProof: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="requiresProof" className="text-sm text-gray-700">
                  需要提交凭证
                </label>
            </div>

              <div className="flex space-x-3 pt-4">
              <button
                  onClick={handleCreateTask}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  创建任务
              </button>
              <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard; 
