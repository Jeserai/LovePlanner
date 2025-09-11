import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Card } from '../ui/card';
import { ThemeButton } from '../ui/Components';
import { useTranslation } from '../../utils/i18n';
import { taskService } from '../../services/taskService';
import type { Task } from '../../types/task';
import { getCurrentTime } from '../../utils/testTimeManager';
import { globalEventService, GlobalEvents } from '../../services/globalEventService';

interface TaskListProps {
  className?: string;
  onTaskDropped?: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
  useSidebarLayout?: boolean;
}

export interface TaskListRef {
  removeTask: (taskId: string) => void; // 拖拽时调用，但不实际移除
  refreshTasks: () => void;
}

const TaskList = React.forwardRef<TaskListRef, TaskListProps>(({ className = '', onTaskDropped, onTaskClick, useSidebarLayout = false }, ref) => {
  const { theme, language } = useTheme();
  const { userProfile } = useUser();
  const t = useTranslation(language);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduled, setShowScheduled] = useState(false);
  const taskListRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);

  // 获取用户领取的任务
  const fetchMyTasks = useCallback(async () => {
    if (!userProfile?.id || !userProfile?.couple_id) {
      setLoading(false); // 确保loading状态被重置
      return;
    }
    
    try {
      setLoading(true);
      // 获取当前用户领取的任务
      const allTasks = await taskService.getTasks(userProfile.couple_id);
      
      const myTasks = allTasks.filter(task => {
        const isMyTask = task.assignee_id === userProfile.id;
        const validStatus = ['assigned', 'in_progress', 'completed'].includes(task.status);
        return isMyTask && validStatus;
      });
      
      setTasks(myTasks);
      console.log(`📋 任务列表更新: 找到 ${myTasks.length} 个任务`);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // 初始化时获取任务
  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // 监听全局任务更新事件
  useEffect(() => {
    const handleTasksUpdated = () => {
      console.log('📋 TaskList收到任务更新事件，重新获取任务');
      fetchMyTasks();
    };

    // 订阅事件，返回取消订阅函数
    const unsubscribe = globalEventService.subscribe(GlobalEvents.TASKS_UPDATED, handleTasksUpdated);

    return unsubscribe; // 清理时调用取消订阅函数
  }, [fetchMyTasks]);

  // 计算任务的紧急程度和剩余时间
  const getTaskUrgency = useCallback((task: Task) => {
    if (!task.task_deadline) {
      return { 
        urgencyLevel: 'no-deadline' as const, 
        timeRemaining: null, 
        hoursRemaining: Infinity,
        displayText: t('no_deadline') || '无截止时间'
      };
    }

    const now = getCurrentTime();
    const deadline = new Date(task.task_deadline);
    const msRemaining = deadline.getTime() - now.getTime();
    const hoursRemaining = msRemaining / (1000 * 60 * 60);
    const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

    let urgencyLevel: 'overdue' | 'critical' | 'urgent' | 'normal' | 'low' | 'no-deadline';
    let displayText: string;

    if (hoursRemaining < 0) {
      urgencyLevel = 'overdue';
      displayText = `${t('overdue')} ${Math.abs(Math.floor(daysRemaining))}${t('days')}`;
    } else if (hoursRemaining < 2) {
      urgencyLevel = 'critical';
      displayText = `${Math.floor(hoursRemaining * 60)}${t('minutes_left')}`;
    } else if (hoursRemaining < 24) {
      urgencyLevel = 'urgent';
      displayText = `${Math.floor(hoursRemaining)}${t('hours_left')}`;
    } else if (daysRemaining < 3) {
      urgencyLevel = 'normal';
      displayText = `${Math.floor(daysRemaining)}${t('days_left')}`;
    } else {
      urgencyLevel = 'low';
      displayText = `${Math.floor(daysRemaining)}${t('days_left')}`;
    }

    return {
      urgencyLevel,
      timeRemaining: msRemaining,
      hoursRemaining,
      displayText
    };
  }, [t]);

  // 过滤和排序任务
  const sortedTasks = useMemo(() => {
    let filteredTasks = tasks;
    
    // 过滤逻辑：默认只显示未排期的任务，如果开启显示已排期则显示所有任务
    if (!showScheduled) {
      // 只显示进行中和已分配的任务（排除已完成的任务）
      filteredTasks = tasks.filter(task => 
        task.status === 'assigned' || task.status === 'in_progress'
      );
    } else {
      // 显示所有任务（包括已完成，可能已排期的任务）
      filteredTasks = tasks;
    }
    

    // 按紧急程度排序
    return filteredTasks.sort((a, b) => {
      const urgencyA = getTaskUrgency(a);
      const urgencyB = getTaskUrgency(b);
      
      // 紧急程度权重
      const urgencyWeight = {
        'overdue': 0,
        'critical': 1,
        'urgent': 2,
        'normal': 3,
        'low': 4,
        'no-deadline': 5
      };
      
      const weightA = urgencyWeight[urgencyA.urgencyLevel];
      const weightB = urgencyWeight[urgencyB.urgencyLevel];
      
      if (weightA !== weightB) {
        return weightA - weightB; // 权重低的排在前面（更紧急）
      }
      
      // 相同紧急程度按剩余时间排序
      if (urgencyA.hoursRemaining !== urgencyB.hoursRemaining) {
        return urgencyA.hoursRemaining - urgencyB.hoursRemaining;
      }
      
      // 最后按创建时间排序
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, showScheduled, getTaskUrgency]);

  // 处理任务被拖拽后的处理（不移除，保留供重复使用）
  const handleTaskDropped = useCallback((taskId: string) => {
    console.log('📋 TaskList: 任务已拖拽到日历，但保留在列表中供重复使用', taskId);
    // 不移除任务，允许用户为同一任务创建多个日程时段
    // setTasks(prev => prev.filter(task => task.id !== taskId));
    if (onTaskDropped) {
      onTaskDropped(taskId);
    }
  }, [onTaskDropped]);

  // 暴露给父组件的方法
  React.useImperativeHandle(ref, () => ({
    removeTask: handleTaskDropped,
    refreshTasks: fetchMyTasks
  }), [handleTaskDropped, fetchMyTasks]);

  // 获取紧急程度的颜色和图标
  const getUrgencyStyle = useCallback((urgencyLevel: string) => {
    const styles = {
      overdue: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '🚨'
      },
      critical: {
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '⚠️'
      },
      urgent: {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '🔥'
      },
      normal: {
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '⏰'
      },
      low: {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '📅'
      },
      'no-deadline': {
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '📋'
      }
    };
    return styles[urgencyLevel] || styles['no-deadline'];
  }, []);

  // 初始化FullCalendar Draggable
  useEffect(() => {
    if (taskListRef.current) {
      // 清理之前的draggable实例
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }

      // 创建新的FullCalendar Draggable实例
      draggableRef.current = new Draggable(taskListRef.current, {
        itemSelector: '.task-draggable',
        eventData: function(eventEl) {
          const taskId = eventEl.getAttribute('data-task-id');
          const taskTitle = eventEl.getAttribute('data-task-title');
          const taskPoints = eventEl.getAttribute('data-task-points');
          
          console.log('🎯 Task Draggable创建事件数据:', {
            taskId,
            taskTitle,
            taskPoints
          });
          
          return {
            title: `⚡ ${taskTitle}`,
            duration: '01:00', // 默认1小时
            description: `任务: ${taskTitle} (${taskPoints}分)`,
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            textColor: '#ffffff',
            extendedProps: {
              taskId: taskId,
              fromTask: true,
              points: parseInt(taskPoints) || 0,
              type: 'task-event'
            }
          };
        }
      });
    }

    // 清理函数
    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, [sortedTasks]);

  return (
    <Card 
      className={`p-4 ${className} flex flex-col h-full`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${
          theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'
        }`}>
          {theme === 'pixel' ? 'MY_TASKS.EXE' : t('my_tasks') || '我的任务'}
        </h3>
        <div className="flex items-center space-x-2">
          <ThemeButton
            onClick={() => setShowScheduled(!showScheduled)}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            {showScheduled 
              ? (theme === 'pixel' ? 'HIDE_SCHEDULED' : '隐藏已排期') 
              : (theme === 'pixel' ? 'SHOW_SCHEDULED' : '显示已排期')
            }
          </ThemeButton>
          <ThemeButton
            onClick={fetchMyTasks}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {theme === 'pixel' ? 'REFRESH' : (loading ? t('loading') : t('refresh'))}
          </ThemeButton>
        </div>
      </div>
      
      {/* 任务列表 */}
      <div 
        ref={taskListRef} 
        className="space-y-2 overflow-y-auto auto-hide-scrollbar flex-1"
      >
        {loading ? (
          <div className={`text-sm text-center py-8 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-muted-foreground'
          }`}>
            {theme === 'pixel' ? 'LOADING_TASKS...' : t('loading_tasks')}
          </div>
        ) : !userProfile?.couple_id ? (
          <div className={`text-sm text-center py-8 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-muted-foreground'
          }`}>
            <div className="mb-2">💝</div>
            {theme === 'pixel' ? 'NO_COUPLE_RELATIONSHIP' : '尚未建立情侣关系'}
            <br />
            <span className="text-xs">
              {theme === 'pixel' ? 'SETUP_COUPLE_PROFILE' : '请先在设置中完善情侣档案'}
            </span>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className={`text-sm text-center py-8 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-muted-foreground'
          }`}>
            {theme === 'pixel' ? 'NO_TASKS_ASSIGNED' : '暂无领取的任务'}
            <br />
            <span className="text-xs">
              {theme === 'pixel' ? 'VISIT_TASK_BOARD' : '去任务页面领取任务'}
            </span>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const urgency = getTaskUrgency(task);
            const style = getUrgencyStyle(urgency.urgencyLevel);
            
            return (
              <div
                key={task.id}
                className={`
                  task-draggable group flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  ${style.bgColor} ${style.borderColor}
                  hover:shadow-md transition-all duration-200
                `}
                data-task-id={task.id}
                data-task-title={task.title}
                data-task-points={task.points}
                onClick={() => {
                  // 点击任务区域直接打开任务详情弹窗
                  if (onTaskClick) {
                    onTaskClick(task);
                  }
                }}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* 任务信息 */}
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    {/* 左侧：任务名称 */}
                    <div className="flex-1 min-w-0 mr-3">
                      <span className={`
                        font-medium text-sm truncate block
                        ${theme === 'pixel' ? 'font-mono' : ''}
                      `}>
                        {task.title}
                      </span>
                    </div>
                    
                    {/* 右侧：倒计时和截止日期垂直排列 */}
                    <div className="flex flex-col items-end text-right flex-shrink-0">
                      <span className={`text-xs ${style.color} font-medium`}>
                        {urgency.displayText}
                      </span>
                      {task.task_deadline && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {new Date(task.task_deadline).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: task.task_deadline.includes('T') ? '2-digit' : undefined,
                            minute: task.task_deadline.includes('T') ? '2-digit' : undefined
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
});

TaskList.displayName = 'TaskList';

export default TaskList;
