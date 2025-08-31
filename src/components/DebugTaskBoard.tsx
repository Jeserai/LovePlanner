// 🔍 调试版任务面板 - 用于排查数据问题
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import Icon from './ui/Icon';
import LoadingSpinner from './ui/LoadingSpinner';
import PageHeader from './ui/PageHeader';
import { ThemeCard, ThemeButton } from './ui/Components';
import { newTaskService } from '../services/newTaskService';
import { userService } from '../services/database';
import type { Task, TaskFilter } from '../types/task';

type ViewType = 'published' | 'assigned' | 'available';

const DebugTaskBoard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userProfile } = useUser();
  
  // 🎯 状态管理
  const [view, setView] = useState<ViewType>('published');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // 🔍 调试信息收集
  const addDebugInfo = (key: string, value: any) => {
    setDebugInfo(prev => ({
      ...prev,
      [key]: value,
      timestamp: new Date().toISOString()
    }));
    console.log(`🔍 [Debug] ${key}:`, value);
  };

  // 🎯 获取情侣关系
  useEffect(() => {
    const fetchCoupleRelation = async () => {
      addDebugInfo('user_check', { 
        hasUser: !!user, 
        userId: user?.id, 
        userEmail: user?.email 
      });
      
      if (!user?.id) {
        addDebugInfo('couple_relation_skip', 'No user ID');
        return;
      }
      
      try {
        addDebugInfo('couple_relation_fetching', user.id);
        const relation = await userService.getCoupleRelation(user.id);
        
        addDebugInfo('couple_relation_result', relation);
        
        if (relation) {
          setCoupleId(relation.id);
          addDebugInfo('couple_id_set', relation.id);
        } else {
          addDebugInfo('couple_relation_not_found', 'No couple relation found');
        }
      } catch (error) {
        console.error('获取情侣关系失败:', error);
        addDebugInfo('couple_relation_error', error);
      }
    };

    fetchCoupleRelation();
  }, [user?.id]);

  // 🎯 加载任务数据
  const loadTasks = async () => {
    addDebugInfo('load_tasks_start', { coupleId, view, userId: user?.id });
    
    if (!coupleId) {
      addDebugInfo('load_tasks_skip', 'No couple ID');
      return;
    }
    
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

      addDebugInfo('task_filter', filter);
      
      const taskList = await newTaskService.getTasks(coupleId, filter);
      
      addDebugInfo('tasks_loaded', { 
        count: taskList.length, 
        tasks: taskList.map(t => ({ id: t.id, title: t.title, status: t.status }))
      });
      
      setTasks(taskList);
    } catch (error) {
      console.error('加载任务失败:', error);
      addDebugInfo('load_tasks_error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [coupleId, view, user?.id]);

  // 🎯 渲染调试信息
  const renderDebugInfo = () => (
    <ThemeCard className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <h3 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">
        🔍 调试信息
      </h3>
      <div className="space-y-2 text-sm">
        <div><strong>用户ID:</strong> {user?.id || '未登录'}</div>
        <div><strong>用户邮箱:</strong> {user?.email || '无'}</div>
        <div><strong>情侣ID:</strong> {coupleId || '未找到'}</div>
        <div><strong>当前视图:</strong> {view}</div>
        <div><strong>任务数量:</strong> {tasks.length}</div>
        <div><strong>加载状态:</strong> {loading ? '加载中' : '已完成'}</div>
      </div>
      
      <details className="mt-4">
        <summary className="cursor-pointer text-yellow-700 dark:text-yellow-300">
          详细调试信息
        </summary>
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </ThemeCard>
  );

  // 🎯 渲染任务卡片
  const renderTaskCard = (task: Task) => (
    <ThemeCard key={task.id} className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg">{task.title}</h3>
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {task.status}
          </span>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {task.description}
          </p>
        )}
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div>类型: {task.repeat_frequency}</div>
          <div>积分: {task.points}</div>
          <div>完成: {task.completed_count} 次</div>
        </div>
      </div>
    </ThemeCard>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="调试任务面板"
        subtitle="用于排查数据显示问题"
        actions={[
          {
            label: '刷新数据',
            onClick: () => loadTasks(),
            icon: 'arrow-path',
            variant: 'primary'
          }
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 调试信息 */}
        {renderDebugInfo()}

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
              {!coupleId ? '未找到情侣关系' :
               view === 'published' ? '你还没有发布任何任务' :
               view === 'assigned' ? '你还没有领取任何任务' : '暂时没有可领取的任务'}
            </p>
            
            {/* 快速修复建议 */}
            {!coupleId && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  修复建议
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  请在Supabase中执行 debug_couple_relation.sql 脚本来创建情侣关系
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(renderTaskCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugTaskBoard;
