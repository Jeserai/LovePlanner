import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import PointsDisplay from './PointsDisplay';

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  points: number;
  status: 'recruiting' | 'in-progress' | 'completed' | 'abandoned' | 'pending_review';
  assignee?: string;
  creator: string;
  createdAt: string;
  requiresProof: boolean;
  proof?: string;
  taskType: 'daily' | 'special' | 'romantic';
  repeatType: 'once' | 'repeat';
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  duration?: '21days' | '1month' | '6months' | '1year';
  totalPoints?: number;
  reviewComment?: string;
}

const TaskBoard: React.FC = () => {
  const { theme } = useTheme();
  const [view, setView] = useState<'published' | 'assigned' | 'available'>('published');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    // 日常任务
    {
      id: '1',
      title: '整理房间',
      description: '把房间收拾得干干净净，物品摆放整齐',
      deadline: '2024-03-20',
      points: 50,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      taskType: 'daily',
      repeatType: 'once'
    },
    {
      id: '2',
      title: '做一顿晚餐',
      description: '准备一顿美味的晚餐，可以尝试新菜谱',
      deadline: '2024-03-18',
      points: 80,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-14',
      requiresProof: true,
      taskType: 'daily',
      repeatType: 'once'
    },
    {
      id: '3',
      title: '一起看电影',
      description: '选一部我们都喜欢的电影，一起观看并分享感受',
      deadline: '2024-03-16',
      points: 60,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-13',
      requiresProof: true,
      taskType: 'daily',
      repeatType: 'once'
    },
    
    // 特别任务
    {
      id: '4',
      title: '周末野餐',
      description: '准备野餐食物和用品，找个好天气去公园野餐',
      deadline: '2024-03-25',
      points: 100,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-12',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once'
    },
    {
      id: '5',
      title: '一起做手工',
      description: '一起完成一个手工项目，可以是陶艺、绘画或其他创意活动',
      deadline: '2024-03-22',
      points: 90,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-11',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once'
    },
    
    // 浪漫任务
    {
      id: '6',
      title: '写一封情书',
      description: '用最真挚的文字表达爱意，可以配上手绘插画',
      deadline: '2024-03-21',
      points: 120,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-10',
      requiresProof: true,
      taskType: 'romantic',
      repeatType: 'once'
    },
    {
      id: '7',
      title: '准备惊喜约会',
      description: '策划一次特别的约会，可以是烛光晚餐或其他浪漫活动',
      deadline: '2024-03-23',
      points: 150,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-09',
      requiresProof: true,
      taskType: 'romantic',
      repeatType: 'once'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    points: 50,
    taskType: 'daily' as 'daily' | 'special' | 'romantic',
    repeatType: 'once' as 'once' | 'repeat',
    deadline: '',
    requiresProof: false,
    repeatFrequency: 'daily' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    startDate: '',
    endDate: '',
    duration: '21days' as '21days' | '1month' | '6months' | '1year'
  });

  const [userPoints, setUserPoints] = useState({ me: 230, partner: 180 });

  // 计算重复任务的结束日期
  const calculateEndDate = (startDate: string, duration: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    
    switch (duration) {
      case '21days':
        end.setDate(end.getDate() + 21);
        break;
      case '1month':
        end.setMonth(end.getMonth() + 1);
        break;
      case '6months':
        end.setMonth(end.getMonth() + 6);
        break;
      case '1year':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    
    return end.toISOString().split('T')[0];
  };

  // 计算重复任务的次数和总积分
  const calculateTaskCount = (startDate: string, endDate: string, frequency: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    
    switch (frequency) {
      case 'daily':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'weekly':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        break;
      case 'biweekly':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 14));
        break;
      case 'monthly':
        count = (end.getFullYear() - start.getFullYear()) * 12 + 
                (end.getMonth() - start.getMonth());
        break;
      case 'yearly':
        count = end.getFullYear() - start.getFullYear();
        break;
    }
    
    return count;
  };

  const handleAddTask = () => {
    if (newTask.title && (newTask.repeatType === 'once' ? newTask.deadline : newTask.startDate)) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        points: newTask.points,
        status: 'recruiting',
        creator: 'Whimsical Cat',
        createdAt: new Date().toISOString().split('T')[0],
        deadline: newTask.repeatType === 'once' ? newTask.deadline : newTask.endDate || '',
        requiresProof: newTask.requiresProof,
        taskType: newTask.taskType,
        repeatType: newTask.repeatType,
        repeatFrequency: newTask.repeatType === 'repeat' ? newTask.repeatFrequency : undefined,
        startDate: newTask.repeatType === 'repeat' ? newTask.startDate : undefined,
        endDate: newTask.repeatType === 'repeat' ? newTask.endDate : undefined,
        duration: newTask.repeatType === 'repeat' ? newTask.duration : undefined,
        totalPoints: newTask.repeatType === 'repeat' ? 
          newTask.points * calculateTaskCount(
            newTask.startDate,
            newTask.endDate || calculateEndDate(newTask.startDate, newTask.duration),
            newTask.repeatFrequency
          ) : undefined
      };
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        points: 50,
        taskType: 'daily',
        repeatType: 'once',
        deadline: '',
        requiresProof: false,
        repeatFrequency: 'daily',
        startDate: '',
        endDate: '',
        duration: '21days'
      });
      setShowAddForm(false);
    }
  };

  const handleAcceptTask = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId && task.status === 'recruiting') {
        return { ...task, assignee: 'Whimsical Cow', status: 'recruiting' };
      }
      return task;
    }));
  };

  const handleStartTask = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, status: 'in-progress' };
      }
      return task;
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        if (task.requiresProof) {
          // 如果需要凭证，任务进入待审核状态
          return { ...task, status: 'pending_review' };
        } else {
          // 不需要凭证的任务直接完成
          if (task.assignee) {
            setUserPoints(prev => ({
              ...prev,
              [task.assignee === 'Whimsical Cat' ? 'me' : 'partner']: 
                prev[task.assignee === 'Whimsical Cat' ? 'me' : 'partner'] + task.points
            }));
          }
          return { ...task, status: 'completed' };
        }
      }
      return task;
    }));
  };

  const handleReviewTask = (taskId: string, approved: boolean, comment?: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        if (approved) {
          // 审核通过，发放积分
          if (task.assignee) {
            setUserPoints(prev => ({
              ...prev,
              [task.assignee === 'Whimsical Cat' ? 'me' : 'partner']: 
                prev[task.assignee === 'Whimsical Cat' ? 'me' : 'partner'] + task.points
            }));
          }
          return { ...task, status: 'completed', reviewComment: comment };
        } else {
          // 审核不通过，返回进行中状态
          return { ...task, status: 'in-progress', reviewComment: comment };
        }
      }
      return task;
    }));
  };

  const handleUploadProof = (taskId: string, proof: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, proof };
      }
      return task;
    }));
  };

  const handleAbandonTask = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId && task.status === 'recruiting') {
        // 未开始的任务扣除10积分
        setUserPoints(prev => ({
          ...prev,
          partner: prev.partner - 10
        }));
        return { ...task, assignee: undefined, status: 'recruiting' };
      }
      return task;
    }));
  };

  const getCategoryColor = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'bg-pixel-info text-black';
        case 'special': return 'bg-pixel-purple text-white';
        case 'romantic': return 'bg-pixel-accent text-black';
        default: return 'bg-pixel-textMuted text-white';
      }
    }
    
    switch (category) {
      case 'daily': return 'bg-blue-500'; // 可爱浅蓝色
      case 'special': return 'bg-secondary-500'; // 香芋紫
      case 'romantic': return 'bg-primary-500'; // 樱花粉
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'DAILY';
        case 'special': return 'SPECIAL';
        case 'romantic': return 'ROMANCE';
        default: return 'OTHER';
      }
    }
    
    switch (category) {
      case 'daily': return '日常';
      case 'special': return '特别';
      case 'romantic': return '浪漫';
      default: return '其他';
    }
  };

  const getStatusColor = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'pending': return 'border-pixel-warning bg-pixel-card border-4';
        case 'in-progress': return 'border-pixel-info bg-pixel-panel border-4';
        case 'completed': return 'border-pixel-success bg-pixel-card border-4';
        default: return 'border-pixel-border bg-pixel-panel border-4';
      }
    }
    
    switch (status) {
      case 'pending': return 'border-yellow-300 bg-yellow-50';
      case 'in-progress': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusName = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'pending': return 'PENDING';
        case 'in-progress': return 'IN_PROGRESS';
        case 'completed': return 'COMPLETE';
        default: return 'UNKNOWN';
      }
    }
    
    switch (status) {
      case 'pending': return '待开始';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  // 计算任务紧急程度
  const getTaskUrgency = (deadline?: string) => {
    if (!deadline) return 'normal';
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue'; // 已过期
    if (diffDays === 0) return 'today'; // 今天到期
    if (diffDays <= 2) return 'urgent'; // 紧急（2天内）
    if (diffDays <= 7) return 'upcoming'; // 即将到期（一周内）
    return 'normal'; // 正常
  };

  const getUrgencyColor = (urgency: string) => {
    if (theme === 'pixel') {
      switch (urgency) {
        case 'overdue': return 'text-black bg-pixel-accent font-mono';
        case 'today': return 'text-black bg-pixel-warning font-mono';
        case 'urgent': return 'text-black bg-pixel-orange font-mono';
        case 'upcoming': return 'text-black bg-pixel-info font-mono';
        default: return 'text-pixel-textMuted bg-pixel-card font-mono';
      }
    }
    
    switch (urgency) {
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'today': return 'text-orange-600 bg-orange-50';
      case 'urgent': return 'text-amber-600 bg-amber-50';
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyText = (urgency: string) => {
    if (theme === 'pixel') {
      switch (urgency) {
        case 'overdue': return 'OVERDUE!';
        case 'today': return 'TODAY!';
        case 'urgent': return 'URGENT!';
        case 'upcoming': return 'SOON';
        default: return '';
      }
    }
    
    switch (urgency) {
      case 'overdue': return '已过期';
      case 'today': return '今天到期';
      case 'urgent': return '紧急';
      case 'upcoming': return '即将到期';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return '今天';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return '明天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 获取我发布的任务
  const getPublishedTasks = () => {
    return tasks.filter(task => task.creator === 'Whimsical Cat');
  };

  // 获取我领取的任务
  const getAssignedTasks = () => {
    return tasks.filter(task => task.assignee === 'Whimsical Cow');
  };

  // 获取可领取的任务
  const getAvailableTasks = () => {
    return tasks.filter(task => 
      task.creator !== 'Whimsical Cat' && 
      task.status === 'recruiting' &&
      !task.assignee
    );
  };

  // 检查任务是否即将过期（3天内）
  const isTaskExpiringSoon = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // 渲染任务列表
  const renderTaskList = (taskList: Task[], type: 'published' | 'assigned' | 'available') => {
    if (type === 'published') {
      const recruitingTasks = taskList.filter(task => task.status === 'recruiting');
      const pendingReviewTasks = taskList.filter(task => task.status === 'pending_review');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const expiredTasks = taskList.filter(task => task.status === 'abandoned');

      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'RECRUITING' : '正在招募'}
            </h3>
            {recruitingTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'PENDING_REVIEW' : '待审核'}
            </h3>
            {pendingReviewTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'COMPLETED' : '已完成'}
            </h3>
            {completedTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'ABANDONED' : '已放弃'}
            </h3>
            {expiredTasks.map(task => renderTaskCard(task))}
          </div>
        </div>
      );
    } else if (type === 'assigned') {
      const notStartedTasks = taskList.filter(task => task.status === 'recruiting');
      const inProgressTasks = taskList.filter(task => task.status === 'in-progress');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'NOT_STARTED' : '未开始'}
            </h3>
            {notStartedTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'IN_PROGRESS' : '进行中'}
            </h3>
            {inProgressTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'COMPLETED' : '已完成'}
            </h3>
            {completedTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'ABANDONED' : '已放弃'}
            </h3>
            {abandonedTasks.map(task => renderTaskCard(task))}
          </div>
        </div>
      );
    } else {
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

  // 渲染任务卡片
  const renderTaskCard = (task: Task) => {
    const isExpiringSoon = isTaskExpiringSoon(task.deadline);
    
    return (
      <div 
        onClick={() => setSelectedTask(task)}
        className={`p-4 mb-4 cursor-pointer transition-all duration-300 ${
          theme === 'pixel'
            ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:border-pixel-accent'
            : 'bg-white rounded-xl shadow-soft hover:shadow-lg hover:border-primary-300'
        } ${isExpiringSoon ? 'border-yellow-500' : ''}`}
      >
        <h4 className={`font-bold mb-2 ${
          theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
        }`}>
          {task.title}
        </h4>
        <p className={`text-sm mb-3 ${
          theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
        }`}>
          {task.description}
        </p>
        <div className={`flex items-center justify-between text-sm ${
          theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-500'
        }`}>
          <div className="flex items-center space-x-2">
            {theme === 'pixel' ? (
              <PixelIcon name="clock" size="sm" />
            ) : (
              <ClockIcon className="w-4 h-4" />
            )}
            <span>{task.deadline}</span>
          </div>
          <div className="flex items-center space-x-2">
            {theme === 'pixel' ? (
              <PixelIcon name="star" size="sm" className="text-pixel-accent" />
            ) : (
              <StarIcon className="w-4 h-4 text-yellow-500" />
            )}
            <span>{task.points}</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染任务详情弹窗
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    const isTaskOwner = selectedTask.creator === 'Whimsical Cat';
    const isAssignee = selectedTask.assignee === 'Whimsical Cow';
    const isNotStarted = selectedTask.status === 'recruiting';
    const isInProgress = selectedTask.status === 'in-progress';
    const isPendingReview = selectedTask.status === 'pending_review';
    const hasProof = selectedTask.proof !== undefined;
    const canComplete = !selectedTask.requiresProof || hasProof;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
          theme === 'pixel' 
            ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
            : 'card-cutesy'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                : 'font-display text-gray-800'
            }`}>
              {theme === 'pixel' ? 'TASK_DETAILS' : '任务详情'}
            </h3>
            <button
              onClick={() => setSelectedTask(null)}
              className={`p-2 transition-colors ${
                theme === 'pixel'
                  ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="x" size="sm" />
              ) : (
                <XMarkIcon className="w-5 h-5" />
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
            </div>

            {/* 凭证上传区域 */}
            {isAssignee && isInProgress && selectedTask.requiresProof && (
              <div className={`p-4 rounded-lg ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_PROOF' : '任务凭证'}
                </h4>
                {hasProof ? (
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className={theme === 'pixel' ? 'text-pixel-success font-mono' : 'text-green-600'}>
                      {theme === 'pixel' ? 'PROOF_UPLOADED' : '已上传凭证'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 这里应该实现文件上传逻辑
                          handleUploadProof(selectedTask.id, 'proof_url');
                        }
                      }}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                    />
                    <p className={`text-sm ${
                      theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                    }`}>
                      {theme === 'pixel' ? 'UPLOAD_PROOF_TO_COMPLETE_TASK' : '请上传任务完成凭证'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 审核区域 */}
            {isTaskOwner && isPendingReview && (
              <div className={`p-4 rounded-lg ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REVIEW_TASK' : '审核任务'}
                </h4>
                <div className="space-y-4">
                  {selectedTask.proof && (
                    <div className="mb-4">
                      <p className={`text-sm mb-2 ${
                        theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
                      }`}>
                        {theme === 'pixel' ? 'TASK_PROOF' : '任务凭证'}
                      </p>
                      <img 
                        src={selectedTask.proof} 
                        alt="Task proof" 
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  <textarea
                    placeholder={theme === 'pixel' ? 'ENTER_REVIEW_COMMENT...' : '输入审核意见...'}
                    className={`w-full h-24 resize-none ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                    onChange={(e) => setSelectedTask({...selectedTask, reviewComment: e.target.value})}
                    value={selectedTask.reviewComment || ''}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleReviewTask(selectedTask.id, true, selectedTask.reviewComment);
                        setSelectedTask(null);
                      }}
                      className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                        theme === 'pixel'
                          ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                          : 'btn-primary'
                      }`}
                    >
                      {theme === 'pixel' ? 'APPROVE' : '通过'}
                    </button>
                    <button
                      onClick={() => {
                        handleReviewTask(selectedTask.id, false, selectedTask.reviewComment);
                        setSelectedTask(null);
                      }}
                      className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                        theme === 'pixel'
                          ? 'bg-pixel-card text-pixel-text rounded-pixel border-2 border-pixel-border hover:bg-pixel-accent hover:text-black'
                          : 'bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200'
                      }`}
                    >
                      {theme === 'pixel' ? 'REJECT' : '拒绝'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              {view === 'available' && !selectedTask.assignee && (
                <button
                  onClick={() => {
                    handleAcceptTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                      : 'btn-primary'
                  }`}
                >
                  {theme === 'pixel' ? 'ACCEPT_TASK' : '领取任务'}
                </button>
              )}
              {isAssignee && isNotStarted && (
                <>
                  <button
                    onClick={() => {
                      handleStartTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                        : 'btn-primary'
                    }`}
                  >
                    {theme === 'pixel' ? 'START_TASK' : '开始任务'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(
                        theme === 'pixel'
                          ? 'ABANDON_TASK_WARNING: THIS_WILL_COST_10_POINTS!'
                          : '确定要放弃任务吗？这将扣除10积分！'
                      )) {
                        handleAbandonTask(selectedTask.id);
                        setSelectedTask(null);
                      }
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-card text-pixel-text rounded-pixel border-2 border-pixel-border hover:bg-pixel-accent hover:text-black'
                        : 'bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200'
                    }`}
                  >
                    {theme === 'pixel' ? 'ABANDON_TASK (-10 POINTS)' : '放弃任务 (-10积分)'}
                  </button>
                </>
              )}
              {isAssignee && isInProgress && (
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  disabled={!canComplete}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? `rounded-pixel border-2 ${
                          canComplete
                            ? 'pixel-btn-neon text-white border-white'
                            : 'bg-pixel-card text-pixel-textMuted border-pixel-border cursor-not-allowed'
                        }`
                      : `rounded-xl ${
                          canComplete
                            ? 'btn-primary'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`
                  }`}
                >
                  {theme === 'pixel' ? 'COMPLETE_TASK' : '完成任务'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'TASK_MANAGER.EXE' : '任务看板'}
          </h2>
          
          {/* View Switcher */}
          <div className={`flex ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border bg-pixel-card shadow-pixel' 
              : 'border border-gray-200'
          }`}>
            <button
              onClick={() => setView('published')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel' 
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      view === 'published'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'published'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="document" className="inline-block mr-1" size="sm" />
              ) : (
                <DocumentIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'PUBLISHED' : '我发布的'}
              </span>
            </button>
            <button
              onClick={() => setView('assigned')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      view === 'assigned'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'assigned'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="user" className="inline-block mr-1" size="sm" />
              ) : (
                <UserIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'ASSIGNED' : '我领取的'}
              </span>
            </button>
            <button
              onClick={() => setView('available')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
              theme === 'pixel' 
                  ? `font-mono uppercase ${
                      view === 'available'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'available'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="list" className="inline-block mr-1" size="sm" />
              ) : (
                <ListBulletIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'AVAILABLE' : '可领取'}
            </span>
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center space-x-2 px-6 py-3 font-bold transition-all duration-300 ${
            theme === 'pixel'
              ? 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider'
              : 'btn-primary'
          }`}
        >
          {theme === 'pixel' ? (
            <PixelIcon name="plus" className="text-current" glow />
          ) : (
          <PlusIcon className="w-5 h-5" />
          )}
          <span>{theme === 'pixel' ? 'NEW_TASK' : '新建任务'}</span>
        </button>
      </div>

      {/* Task Columns */}
      <div className="space-y-8">
        {view === 'published' && (
          <div>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider' 
                : 'font-display text-gray-700'
            }`}>
              {theme === 'pixel' ? 'PUBLISHED_TASKS' : '我发布的任务'}
          </h3>
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
      </div>

      {/* Task Detail Modal */}
      {selectedTask && renderTaskDetailModal()}

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                  : 'font-display text-gray-800'
              }`}>
                {theme === 'pixel' ? 'ADD_NEW_TASK' : '发布新任务'}
            </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-2 transition-colors ${
                  theme === 'pixel'
                    ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="x" size="sm" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 任务性质 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REPEAT_TYPE *' : '任务性质 *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'once', label: theme === 'pixel' ? 'ONE_TIME' : '一次性' },
                    { value: 'repeat', label: theme === 'pixel' ? 'REPEATABLE' : '重复性' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewTask({...newTask, repeatType: type.value as any})}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.repeatType === type.value
                                ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                        newTask.repeatType === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 任务标题 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TITLE *' : '任务标题 *'}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_TASK_TITLE...' : '输入任务标题...'}
                />
              </div>

              {/* 任务描述 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_DESCRIPTION' : '任务描述'}
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className={`w-full h-20 resize-none ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_TASK_DESCRIPTION...' : '详细描述任务内容...'}
                />
              </div>

              {/* 重复性任务的特殊字段 */}
              {newTask.repeatType === 'repeat' && (
                <>
                  {/* 重复频率 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel' 
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'REPEAT_FREQUENCY *' : '重复频率 *'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'daily', label: theme === 'pixel' ? 'DAILY' : '每天' },
                        { value: 'weekly', label: theme === 'pixel' ? 'WEEKLY' : '每周' },
                        { value: 'biweekly', label: theme === 'pixel' ? 'BIWEEKLY' : '每两周' },
                        { value: 'monthly', label: theme === 'pixel' ? 'MONTHLY' : '每月' },
                        { value: 'yearly', label: theme === 'pixel' ? 'YEARLY' : '每年' }
                      ].map(freq => (
                        <button
                          key={freq.value}
                          onClick={() => setNewTask({...newTask, repeatFrequency: freq.value as any})}
                          className={`py-2 px-3 text-sm transition-all duration-300 ${
                            theme === 'pixel' 
                              ? `rounded-pixel border-2 font-mono uppercase ${
                                  newTask.repeatFrequency === freq.value
                                    ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                                    : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                                }`
                              : `rounded-xl border-2 ${
                            newTask.repeatFrequency === freq.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 开始日期 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel' 
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'START_DATE *' : '开始日期 *'}
                    </label>
                    <input
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        setNewTask({
                          ...newTask,
                          startDate,
                          endDate: newTask.duration ? calculateEndDate(startDate, newTask.duration) : ''
                        });
                      }}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* 持续时间 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel' 
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'DURATION' : '持续时间'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: '21days', label: theme === 'pixel' ? '21_DAYS' : '21天' },
                        { value: '1month', label: theme === 'pixel' ? '1_MONTH' : '1个月' },
                        { value: '6months', label: theme === 'pixel' ? '6_MONTHS' : '6个月' },
                        { value: '1year', label: theme === 'pixel' ? '1_YEAR' : '1年' }
                      ].map(duration => (
                        <button
                          key={duration.value}
                          onClick={() => {
                            const newDuration = duration.value as any;
                            setNewTask({
                              ...newTask,
                              duration: newDuration,
                              endDate: newTask.startDate ? calculateEndDate(newTask.startDate, newDuration) : ''
                            });
                          }}
                          className={`py-2 px-3 text-sm transition-all duration-300 ${
                            theme === 'pixel' 
                              ? `rounded-pixel border-2 font-mono uppercase ${
                                  newTask.duration === duration.value
                                    ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                                    : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                                }`
                              : `rounded-xl border-2 ${
                            newTask.duration === duration.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`
                          }`}
                        >
                          {duration.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 结束日期（自动计算，可选修改） */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel' 
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'END_DATE' : '结束日期'}
                    </label>
                    <input
                      type="date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                      min={newTask.startDate}
                    />
                    <p className={`text-xs mt-1 ${
                      theme === 'pixel' 
                        ? 'text-pixel-textMuted font-mono' 
                        : 'text-gray-500'
                    }`}>
                      {theme === 'pixel' 
                        ? 'OPTIONAL: SYSTEM_CALCULATED_BASED_ON_DURATION' 
                        : '可选：系统根据持续时间自动计算'}
                    </p>
                  </div>

                  {/* 每次任务积分 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel' 
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'POINTS_PER_TASK *' : '每次任务积分 *'}
                    </label>
                    <input
                      type="number"
                      value={newTask.points}
                      onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                      min="10"
                      max="200"
                    />
                    {newTask.startDate && newTask.endDate && (
                      <p className={`text-xs mt-1 ${
                        theme === 'pixel' 
                          ? 'text-pixel-textMuted font-mono' 
                          : 'text-gray-500'
                      }`}>
                        {theme === 'pixel' 
                          ? `TOTAL_POINTS: ${newTask.points * calculateTaskCount(newTask.startDate, newTask.endDate, newTask.repeatFrequency)}` 
                          : `总积分：${newTask.points * calculateTaskCount(newTask.startDate, newTask.endDate, newTask.repeatFrequency)}`}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* 一次性任务的截止日期 */}
              {newTask.repeatType === 'once' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'DEADLINE *' : '截止日期 *'}
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* 任务类型 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TYPE *' : '任务类型 *'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'special', 'romantic'].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewTask({...newTask, taskType: type as any})}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.taskType === type
                                ? `${getCategoryColor(type)} border-white shadow-pixel neon-border`
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                        newTask.taskType === type
                          ? `border-${getCategoryColor(type).replace('bg-', '')} bg-${getCategoryColor(type).replace('bg-', '')}/10`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {getCategoryName(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 是否需要凭证 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REQUIRE_PROOF' : '是否需要凭证'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newTask.requiresProof}
                    onChange={(e) => setNewTask({...newTask, requiresProof: e.target.checked})}
                    className={`w-4 h-4 ${
                      theme === 'pixel' ? 'pixel-checkbox' : 'rounded text-primary-500'
                    }`}
                  />
                  <span className={theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-600'}>
                    {theme === 'pixel' ? 'TASK_REQUIRES_PROOF' : '任务需要上传完成凭证'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className={`flex-1 py-3 px-4 border-2 transition-all duration-300 ${
                  theme === 'pixel'
                    ? 'border-pixel-border text-pixel-text rounded-pixel hover:bg-pixel-card font-mono uppercase'
                    : 'border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50'
                }`}
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.title || (newTask.repeatType === 'once' ? !newTask.deadline : !newTask.startDate)}
                className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                    ? `rounded-pixel font-mono uppercase ${
                        newTask.title && (newTask.repeatType === 'once' ? newTask.deadline : newTask.startDate)
                          ? 'pixel-btn-neon text-white border-4 border-white'
                          : 'bg-pixel-card text-pixel-textMuted border-2 border-pixel-border cursor-not-allowed'
                      }`
                    : `rounded-xl ${
                        newTask.title && (newTask.repeatType === 'once' ? newTask.deadline : newTask.startDate)
                          ? 'btn-primary'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`
                }`}
              >
                {theme === 'pixel' ? 'PUBLISH_TASK' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard; 