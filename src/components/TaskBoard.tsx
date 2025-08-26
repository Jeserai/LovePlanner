// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  const dataMode = user ? 'database' : 'mock';

  // 数据库任务转换为前端Task格式
  const convertDatabaseTaskToTask = (dbTask: DatabaseTask): Task => {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      deadline: dbTask.deadline,
      points: dbTask.points,
      status: dbTask.status as Task['status'],
      assignee: dbTask.assignee_id ? (userMap[dbTask.assignee_id] || dbTask.assignee_id) : undefined,
      creator: userMap[dbTask.creator_id] || dbTask.creator_id,
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

      try {
        const dbTasks = await taskService.getCoupleTasksOld(coupleId);
        const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
        setTasks(convertedTasks);
        console.log(`✅ 从数据库加载了 ${convertedTasks.length} 个任务`);
      } catch (error) {
        console.error('❌ 加载任务失败:', error);
        setTasks([]);
      }
    };

    if (!loading && coupleId && Object.keys(userMap).length > 0) {
      loadTasks();
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
    if (dataMode === 'mock') {
      // Mock模式：不需要重新加载
      return;
    }

    if (!coupleId) {
      setTasks([]);
      return;
    }

    try {
      const dbTasks = await taskService.getCoupleTasksOld(coupleId);
      const convertedTasks = dbTasks.map(convertDatabaseTaskToTask);
      setTasks(convertedTasks);
      console.log(`✅ 重新加载了 ${convertedTasks.length} 个任务`);
    } catch (error) {
      console.error('❌ 重新加载任务失败:', error);
    }
  };

  // 数据库任务操作辅助函数
  const updateTaskInDatabase = async (taskId: string, updates: Partial<Task>) => {
    if (dataMode === 'mock') {
      // Mock模式：直接更新本地状态
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      return;
    }

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

    if (dataMode === 'database' && user && coupleId) {
      try {
        // 数据库模式：保存到数据库
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
      // Mock模式：添加到本地状态
      setTasks(prevTasks => [...prevTasks, task]);
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

  // 渲染任务卡片
  const renderTaskCard = (task: Task) => {
    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className={`p-4 mb-4 cursor-pointer transition-all duration-300 ${
          theme === 'pixel' 
            ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:border-pixel-accent'
            : 'bg-white rounded-xl shadow-soft hover:shadow-lg hover:border-primary-300'
        } ${getStatusColor(task.status)}`}
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
          </div>
        </div>

        <p className={`mb-3 ${
          theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
        }`}>
          {task.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
            
            {task.assignee && (
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
              <div className="flex justify-center items-center space-x-8">
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  <h3 className={`font-bold ${
                    theme === 'pixel' ? 'text-pixel-success' : 'text-green-600'
                  }`}>
                    {theme === 'pixel' ? 'COMPLETED' : '已完成'}
                  </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {completedTasks.length}
                  </span>
                </div>
                <div className={`text-center ${
                  theme === 'pixel' ? 'font-mono uppercase' : ''
                }`}>
                  <h3 className={`font-bold ${
                    theme === 'pixel' ? 'text-pixel-accent' : 'text-red-600'
                  }`}>
                    {theme === 'pixel' ? 'ABANDONED' : '已关闭'}
                  </h3>
                  <span className={`text-sm ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
                  }`}>
                    {abandonedTasks.length}
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
    } else {
      // assigned 和 available 视图的简单列表
      return (
        <div className="space-y-4">
          {taskList.map(task => renderTaskCard(task))}
        </div>
      );
    }
  };

  return (
          <div className="space-y-6">
      {/* 数据源指示器 */}
      <div className={`text-xs p-2 rounded ${
        dataMode === 'database' 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      }`}>
        {dataMode === 'database' 
          ? '🗄️ 数据库模式 - 使用真实Supabase任务数据' 
          : '📝 演示模式 - 使用本地Mock任务数据'
                }
        {loading && ' (加载中...)'}
          </div>

            {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-3xl font-bold ${
              theme === 'pixel' 
            ? 'font-retro text-pixel-text uppercase tracking-wider' 
            : 'font-display text-gray-700'
            }`}>
          {theme === 'pixel' ? 'TASK_BOARD.EXE' : '任务板'}
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
