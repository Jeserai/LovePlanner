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

        {/* View Switcher */}
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
                
                <div className="ml-4">
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
