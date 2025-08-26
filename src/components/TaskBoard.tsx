// TaskBoard简化版 - 仅显示数据库数据，暂时禁用编辑功能
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import PointsDisplay from './PointsDisplay';
import { useAuth } from '../hooks/useAuth';
import { taskService, userService } from '../services/database';
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
      assignee: dbTask.assignee_id || undefined,
      creator: dbTask.creator_id,
      createdAt: dbTask.created_at,
      requiresProof: dbTask.requires_proof,
      proof: dbTask.proof_url || undefined,
      taskType: dbTask.task_type as Task['taskType'],
      repeatType: dbTask.repeat_type as Task['repeatType'],
      reviewComment: dbTask.review_comment || undefined,
      submittedAt: dbTask.submitted_at || undefined
    };
  };

  // 加载情侣关系ID
  useEffect(() => {
    const loadCoupleId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const coupleData = await userService.getCoupleRelation(user.id);
        if (coupleData) {
          setCoupleId(coupleData.id);
        }
      } catch (error) {
        console.error('加载情侣关系失败:', error);
      }
      setLoading(false);
    };

    loadCoupleId();
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

    if (!loading && coupleId) {
      loadTasks();
    }
  }, [coupleId, loading]);

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
        <div className="mt-1 text-orange-600">
          ⚠️ 简化版本：仅显示数据，编辑功能暂时禁用
          </div>
        </div>

      {/* Header with View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <h2 className={`text-3xl font-bold ${
                theme === 'pixel'
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'TASK_BOARD.EXE' : '任务板'}
          </h2>
                    </div>

        {/* View Switcher and Add Button */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { id: 'published', label: '已发布' },
              { id: 'assigned', label: '我的任务' },
              { id: 'available', label: '可领取' }
            ].map((viewOption) => (
                    <button
                key={viewOption.id}
                onClick={() => setView(viewOption.id as any)}
                className={`px-4 py-2 rounded transition-all ${
                  view === viewOption.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {viewOption.label}
                    </button>
            ))}
                  </div>

                        <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>新建任务</span>
                </button>
            </div>
                    </div>

      {/* Tasks Display */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : getTasksByView().length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {dataMode === 'database' 
                ? '暂无任务数据，请运行数据迁移脚本添加示例数据' 
                : '暂无任务'
              }
            </div>
          </div>
        ) : (
          getTasksByView().map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>创建者: {task.creator}</span>
                    {task.assignee && <span>执行者: {task.assignee}</span>}
                    <span>截止: {formatDate(task.deadline)}</span>
                    <span className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1" />
                      {task.points}积分
                    </span>
          </div>
        </div>
                
                <div className="ml-4 flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'recruiting' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                    task.status === 'pending_review' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusDisplay(task.status)}
                  </span>
                  
                  {/* 任务操作按钮 */}
                  {task.status === 'recruiting' && task.creator !== currentUserName && (
            <button
                      onClick={() => handleAcceptTask(task.id)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      接受
            </button>
                  )}
                  
                  {task.status === 'assigned' && task.assignee === currentUserName && (
        <button
                      onClick={() => handleStartTask(task.id)}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      开始
        </button>
                  )}
                  
                  {task.status === 'in-progress' && task.assignee === currentUserName && (
              <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      完成
              </button>
                  )}
                  
                  {task.status === 'pending_review' && task.creator === currentUserName && (
                    <div className="flex space-x-1">
                    <button
                        onClick={() => handleReviewTask(task.id, true)}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        通过
                    </button>
                  <button
                        onClick={() => handleReviewTask(task.id, false)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        拒绝
                  </button>
                </div>
                  )}
              </div>
                </div>
              </div>
          ))
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
