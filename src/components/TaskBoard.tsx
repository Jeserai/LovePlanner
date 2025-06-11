import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import PointsDisplay from './PointsDisplay';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  assignedTo: 'me' | 'partner';
  createdBy: 'me' | 'partner';
  status: 'pending' | 'in-progress' | 'completed';
  category: 'daily' | 'special' | 'romantic';
  deadline?: string; // 截止日期
  createdAt: string; // 创建日期
}

const TaskBoard: React.FC = () => {
  const { theme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '做早餐',
      description: '为对方准备一顿美味的早餐',
      points: 50,
      assignedTo: 'me',
      createdBy: 'partner',
      status: 'pending',
      category: 'daily',
      deadline: '2024-01-20',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: '写情书',
      description: '手写一封浪漫的情书',
      points: 100,
      assignedTo: 'partner',
      createdBy: 'me',
      status: 'in-progress',
      category: 'romantic',
      deadline: '2024-01-25',
      createdAt: '2024-01-14'
    },
    {
      id: '3',
      title: '按摩',
      description: '给对方一个舒缓的按摩',
      points: 80,
      assignedTo: 'me',
      createdBy: 'partner',
      status: 'completed',
      category: 'special',
      createdAt: '2024-01-10'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    points: 50,
    assignedTo: 'partner' as 'me' | 'partner',
    category: 'daily' as 'daily' | 'special' | 'romantic',
    deadline: ''
  });

  const [userPoints, setUserPoints] = useState({ me: 230, partner: 180 });

  const handleAddTask = () => {
    if (newTask.title && newTask.description) {
      const task: Task = {
        id: Date.now().toString(),
        ...newTask,
        createdBy: 'me',
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        deadline: newTask.deadline || undefined
      };
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        points: 50,
        assignedTo: 'partner',
        category: 'daily',
        deadline: ''
      });
      setShowAddForm(false);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId && task.status !== 'completed') {
        // Award points to the person who completed the task
        setUserPoints(prev => ({
          ...prev,
          [task.assignedTo]: prev[task.assignedTo] + task.points
        }));
        return { ...task, status: 'completed' };
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

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'TASK_MANAGER.EXE' : '任务看板'}
          </h2>
          <PointsDisplay points={userPoints.me} />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-semibold text-gray-700 flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>待开始 ({pendingTasks.length})</span>
          </h3>
          <div className="space-y-3">
            {pendingTasks.map(task => {
              const urgency = getTaskUrgency(task.deadline);
              return (
                <div key={task.id} className={`card-cutesy p-4 border-l-4 ${getStatusColor(task.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <div className={`px-2 py-1 rounded-lg text-xs text-white ${getCategoryColor(task.category)}`}>
                      {getCategoryName(task.category)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {/* 截止日期显示 */}
                  {task.deadline && (
                    <div className={`flex items-center space-x-1 mb-2 px-2 py-1 rounded-lg text-xs ${getUrgencyColor(urgency)}`}>
                      <ClockIcon className="w-3 h-3" />
                      <span>
                        截止: {formatDate(task.deadline)}
                        {urgency !== 'normal' && ` (${getUrgencyText(urgency)})`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-600">{task.points} 积分</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        分配给: {task.assignedTo === 'me' ? '我' : 'TA'}
                      </span>
                      {task.assignedTo === 'me' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-green-600 hover:text-green-700 transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-semibold text-gray-700 flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>进行中 ({inProgressTasks.length})</span>
          </h3>
          <div className="space-y-3">
            {inProgressTasks.map(task => {
              const urgency = getTaskUrgency(task.deadline);
              return (
                <div key={task.id} className={`card-cutesy p-4 border-l-4 ${getStatusColor(task.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <div className={`px-2 py-1 rounded-lg text-xs text-white ${getCategoryColor(task.category)}`}>
                      {getCategoryName(task.category)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {/* 截止日期显示 */}
                  {task.deadline && (
                    <div className={`flex items-center space-x-1 mb-2 px-2 py-1 rounded-lg text-xs ${getUrgencyColor(urgency)}`}>
                      <ClockIcon className="w-3 h-3" />
                      <span>
                        截止: {formatDate(task.deadline)}
                        {urgency !== 'normal' && ` (${getUrgencyText(urgency)})`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-600">{task.points} 积分</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        分配给: {task.assignedTo === 'me' ? '我' : 'TA'}
                      </span>
                      {task.assignedTo === 'me' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-green-600 hover:text-green-700 transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-semibold text-gray-700 flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>已完成 ({completedTasks.length})</span>
          </h3>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id} className={`card-cutesy p-4 border-l-4 ${getStatusColor(task.status)} opacity-75`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-800 line-through">{task.title}</h4>
                  <div className={`px-2 py-1 rounded-lg text-xs text-white ${getCategoryColor(task.category)}`}>
                    {getCategoryName(task.category)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                
                {/* 完成任务的截止日期显示 */}
                {task.deadline && (
                  <div className="flex items-center space-x-1 mb-2 px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600">
                    <ClockIcon className="w-3 h-3" />
                    <span>截止日期: {formatDate(task.deadline)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StarSolid className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-green-600">+{task.points} 积分</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    完成者: {task.assignedTo === 'me' ? '我' : 'TA'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                : 'font-display text-gray-800'
            }`}>
              {theme === 'pixel' ? 'ADD_NEW_TASK' : '发布新任务'}
            </h3>
            
            <div className="space-y-4">
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
                  {theme === 'pixel' ? 'TASK_DESCRIPTION *' : '任务描述 *'}
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

              {/* 积分奖励 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'POINTS_REWARD *' : '积分奖励 *'}
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
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? 'RANGE: 10-200 POINTS' : '范围：10-200积分'}
                </p>
              </div>

              {/* 截止日期 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? (
                    <span>DEADLINE</span>
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      截止日期 (可选)
                    </>
                  )}
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
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? 'OPTIONAL_HELPS_PRIORITIZE_URGENT_TASKS' : '设置截止日期可以帮助优先处理紧急任务'}
                </p>
              </div>

              {/* 分配给 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'ASSIGN_TO *' : '分配给 *'}
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setNewTask({...newTask, assignedTo: 'me'})}
                    className={`flex-1 py-2 px-4 border-2 transition-all duration-300 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono uppercase ${
                            newTask.assignedTo === 'me'
                              ? 'bg-pixel-info text-black border-white shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-info'
                          }`
                        : `rounded-xl ${
                            newTask.assignedTo === 'me'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-primary-300'
                          }`
                    }`}
                  >
                    {theme === 'pixel' ? 'ME' : '我'}
                  </button>
                  <button
                    onClick={() => setNewTask({...newTask, assignedTo: 'partner'})}
                    className={`flex-1 py-2 px-4 border-2 transition-all duration-300 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono uppercase ${
                            newTask.assignedTo === 'partner'
                              ? 'bg-pixel-purple text-white border-white shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-purple'
                          }`
                        : `rounded-xl ${
                            newTask.assignedTo === 'partner'
                              ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                              : 'border-gray-200 text-gray-600 hover:border-secondary-300'
                          }`
                    }`}
                  >
                    {theme === 'pixel' ? 'PARTNER' : 'TA'}
                  </button>
                </div>
              </div>

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
                  {['daily', 'special', 'romantic'].map(category => (
                    <button
                      key={category}
                      onClick={() => setNewTask({...newTask, category: category as any})}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.category === category
                                ? `${getCategoryColor(category)} border-white shadow-pixel neon-border`
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                              newTask.category === category
                                ? `border-${getCategoryColor(category).replace('bg-', '')} bg-${getCategoryColor(category).replace('bg-', '')}/10`
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {getCategoryName(category)}
                    </button>
                  ))}
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
                disabled={!newTask.title || !newTask.description}
                className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                    ? `rounded-pixel font-mono uppercase ${
                        newTask.title && newTask.description
                          ? 'pixel-btn-neon text-white border-4 border-white'
                          : 'bg-pixel-card text-pixel-textMuted border-2 border-pixel-border cursor-not-allowed'
                      }`
                    : `rounded-xl ${
                        newTask.title && newTask.description
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