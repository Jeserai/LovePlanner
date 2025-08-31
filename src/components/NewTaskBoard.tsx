// 🎯 新的任务面板组件 - 基于优化后的单表结构
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import Icon from './ui/Icon';
import LoadingSpinner from './ui/LoadingSpinner';
import PageHeader from './ui/PageHeader';
import { ThemeCard, ThemeButton } from './ui/Components';
import TaskForm from './TaskForm';
import TaskDetailCard from './TaskDetailCard';
import { newTaskService } from '../services/newTaskService';
import { userService } from '../services/database';
import type { Task, CreateTaskForm, EditTaskForm, TaskFilter } from '../types/task';

type ViewType = 'published' | 'assigned' | 'available';

const NewTaskBoard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userProfile } = useUser();
  
  // 🎯 状态管理
  const [view, setView] = useState<ViewType>('published');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  
  // 🎯 弹窗状态
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // 🎯 操作状态
  const [actionLoading, setActionLoading] = useState(false);

  // 🎯 获取情侣关系
  useEffect(() => {
    const fetchCoupleRelation = async () => {
      if (!user?.id) return;
      
      try {
        const relation = await userService.getCoupleRelation(user.id);
        if (relation) {
          setCoupleId(relation.id);
        }
      } catch (error) {
        console.error('获取情侣关系失败:', error);
      }
    };

    fetchCoupleRelation();
  }, [user?.id]);

  // 🎯 加载任务数据
  const loadTasks = async () => {
    if (!coupleId) return;
    
    setLoading(true);
    try {
      let filter: TaskFilter = {};
      
      switch (view) {
        case 'published':
          filter = { creator_id: user?.id };
          break;
        case 'assigned':
          filter = { assignee_id: user?.id };
          break;
        case 'available':
          filter = { status: ['recruiting'] };
          break;
      }

      const taskList = await newTaskService.getTasks(coupleId, filter);
      setTasks(taskList);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [coupleId, view, user?.id]);

  // 🎯 处理创建任务
  const handleCreateTask = async (formData: CreateTaskForm) => {
    if (!user?.id || !coupleId) return;
    
    setActionLoading(true);
    try {
      await newTaskService.createTask(formData, user.id, coupleId);
      await loadTasks();
      setShowTaskForm(false);
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 处理编辑任务
  const handleEditTask = async (formData: EditTaskForm) => {
    setActionLoading(true);
    try {
      await newTaskService.updateTask(formData);
      await loadTasks();
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('编辑任务失败:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 处理分配任务
  const handleAssignTask = async (taskId: string) => {
    if (!user?.id) return;
    
    setActionLoading(true);
    try {
      await newTaskService.assignTask(taskId, user.id);
      await loadTasks();
      setShowTaskDetail(false);
    } catch (error) {
      console.error('接受任务失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 处理完成任务
  const handleCompleteTask = async (taskId: string) => {
    setActionLoading(true);
    try {
      await newTaskService.completeTask(taskId);
      await loadTasks();
      setShowTaskDetail(false);
    } catch (error) {
      console.error('完成任务失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 处理放弃任务
  const handleAbandonTask = async (taskId: string) => {
    setActionLoading(true);
    try {
      await newTaskService.abandonTask(taskId);
      await loadTasks();
      setShowTaskDetail(false);
    } catch (error) {
      console.error('放弃任务失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 打开编辑任务
  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
    setShowTaskDetail(false);
  };

  // 🎯 打开任务详情
  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  // 🎯 关闭任务表单
  const closeTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // 🎯 关闭任务详情
  const closeTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  // 🎯 格式化任务状态
  const formatTaskStatus = (status: string) => {
    const statusMap = {
      'recruiting': '招募中',
      'assigned': '已分配',
      'in_progress': '进行中',
      'completed': '已完成',
      'abandoned': '已放弃'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 🎯 格式化重复频率
  const formatRepeatFrequency = (frequency: string) => {
    const frequencyMap = {
      'never': '一次性',
      'daily': '每日',
      'weekly': '每周',
      'biweekly': '每两周',
      'monthly': '每月',
      'yearly': '每年',
      'forever': '永远重复'
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  // 🎯 渲染任务卡片
  const renderTaskCard = (task: Task) => {
    const isCreator = user?.id === task.creator_id;
    const isAssignee = user?.id === task.assignee_id;
    
    return (
      <ThemeCard 
        key={task.id} 
        className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => openTaskDetail(task)}
      >
        <div className="space-y-3">
          {/* 任务标题和状态 */}
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg truncate flex-1 mr-2">
              {task.title}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              task.status === 'recruiting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {formatTaskStatus(task.status)}
            </span>
          </div>

          {/* 任务描述 */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* 任务信息 */}
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Icon name="tag" className="w-4 h-4 mr-1" />
                {formatRepeatFrequency(task.repeat_frequency)}
              </span>
              <span className="flex items-center">
                <Icon name="star" className="w-4 h-4 mr-1" />
                {task.points} 分
              </span>
            </div>
            
            {/* 进度信息 */}
            {task.repeat_frequency !== 'never' && (
              <div className="flex items-center space-x-2">
                {task.repeat_frequency === 'forever' ? (
                  <span>{task.completed_count} 次</span>
                ) : (
                  <span>{task.completed_count}/{task.required_count || 0}</span>
                )}
                {task.current_streak > 0 && (
                  <span className="text-orange-500">🔥{task.current_streak}</span>
                )}
              </div>
            )}
          </div>

          {/* 时间信息 */}
          {(task.earliest_start_time || task.task_deadline) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {task.earliest_start_time && (
                <span>开始: {new Date(task.earliest_start_time).toLocaleString('zh-CN')}</span>
              )}
              {task.earliest_start_time && task.task_deadline && <span> | </span>}
              {task.task_deadline && (
                <span>截止: {new Date(task.task_deadline).toLocaleString('zh-CN')}</span>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-2">
            {isCreator && (
              <ThemeButton
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditTask(task);
                }}
              >
                <Icon name="pencil" className="w-3 h-3 mr-1" />
                编辑
              </ThemeButton>
            )}
            
            {task.status === 'recruiting' && !isCreator && (
              <ThemeButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignTask(task.id);
                }}
                disabled={actionLoading}
              >
                <Icon name="hand-raised" className="w-3 h-3 mr-1" />
                接受
              </ThemeButton>
            )}
            
            {task.status === 'in_progress' && isAssignee && (
              <ThemeButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteTask(task.id);
                }}
                disabled={actionLoading}
              >
                <Icon name="check" className="w-3 h-3 mr-1" />
                完成
              </ThemeButton>
            )}
          </div>
        </div>
      </ThemeCard>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <PageHeader
        title="任务管理"
        subtitle="管理和跟踪你们的任务"
        actions={[
          {
            label: '创建任务',
            onClick: () => setShowTaskForm(true),
            icon: 'plus',
            variant: 'primary'
          }
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 视图切换 */}
        <div className="flex space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'published', label: '我发布的', icon: 'document-plus' },
            { key: 'assigned', label: '我领取的', icon: 'clipboard-document-check' },
            { key: 'available', label: '可领取的', icon: 'hand-raised' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as ViewType)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="clipboard-document" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              暂无任务
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {view === 'published' ? '你还没有发布任何任务' :
               view === 'assigned' ? '你还没有领取任何任务' : '暂时没有可领取的任务'}
            </p>
            {view === 'published' && (
              <ThemeButton onClick={() => setShowTaskForm(true)}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                创建第一个任务
              </ThemeButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(renderTaskCard)}
          </div>
        )}
      </div>

      {/* 任务表单弹窗 */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={closeTaskForm}
        onSubmit={editingTask ? handleEditTask : handleCreateTask}
        editTask={editingTask}
        isLoading={actionLoading}
      />

      {/* 任务详情弹窗 */}
      <TaskDetailCard
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={closeTaskDetail}
        onEdit={() => openEditTask(selectedTask!)}
        onAssign={() => handleAssignTask(selectedTask!.id)}
        onComplete={() => handleCompleteTask(selectedTask!.id)}
        onAbandon={() => handleAbandonTask(selectedTask!.id)}
        currentUserId={user?.id}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default NewTaskBoard;
