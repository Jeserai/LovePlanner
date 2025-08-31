// 🎯 任务详情卡片组件 - 基于优化后的单表结构
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ThemeCard,
  ThemeDialog, 
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
  ThemeButton 
} from './ui/Components';
import DetailField from './ui/DetailField';
import Icon from './ui/Icon';
import type { Task, TaskDisplayInfo } from '../types/task';

interface TaskDetailCardProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  onComplete?: () => void;
  onAbandon?: () => void;
  currentUserId?: string;
  isLoading?: boolean;
}

// 🎯 计算任务显示信息
const calculateTaskDisplayInfo = (task: Task): TaskDisplayInfo => {
  // 任务类型分类
  const task_category = 
    task.repeat_frequency === 'never' ? 'once' :
    task.repeat_frequency === 'forever' ? 'forever_repeat' : 'limited_repeat';

  // 时间类型
  const time_type = 
    !task.earliest_start_time && !task.task_deadline ? 'unlimited' :
    task.earliest_start_time && task.task_deadline && 
    new Date(task.earliest_start_time).getTime() === new Date(task.task_deadline).getTime() ? 'fixed' : 'flexible';

  // 完成进度
  const completion_percentage = 
    task.repeat_frequency === 'forever' ? null :
    task.repeat_frequency === 'never' ? (task.completed_count >= 1 ? 100 : 0) :
    task.required_count ? (task.completed_count / task.required_count * 100) : 0;

  // 状态检查
  const now = new Date();
  const is_overdue = task.task_deadline ? now > new Date(task.task_deadline) : false;
  const can_complete_today = task.status === 'in_progress' && !is_overdue;
  const is_active = ['assigned', 'in_progress'].includes(task.status);

  // 显示文本
  const time_display = formatTimeDisplay(task);
  const progress_display = formatProgressDisplay(task, completion_percentage);
  const status_display = formatStatusDisplay(task.status);

  return {
    task,
    task_category,
    time_type,
    completion_percentage,
    is_overdue,
    can_complete_today,
    is_active,
    time_display,
    progress_display,
    status_display
  };
};

// 🎯 格式化时间显示
const formatTimeDisplay = (task: Task): string => {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM
  };

  if (task.repeat_frequency === 'never') {
    // 一次性任务
    if (!task.earliest_start_time && !task.task_deadline) {
      return '不限时间';
    }
    if (task.earliest_start_time && task.task_deadline) {
      return `${formatDateTime(task.earliest_start_time)} - ${formatDateTime(task.task_deadline)}`;
    }
    if (task.earliest_start_time) {
      return `${formatDateTime(task.earliest_start_time)} 开始`;
    }
    if (task.task_deadline) {
      return `${formatDateTime(task.task_deadline)} 截止`;
    }
  } else {
    // 重复任务
    let timeStr = '';
    
    if (task.earliest_start_time) {
      timeStr += `${formatDateTime(task.earliest_start_time)} 开始`;
    }
    
    if (task.task_deadline && task.repeat_frequency !== 'forever') {
      timeStr += timeStr ? ` - ${formatDateTime(task.task_deadline)} 结束` : `${formatDateTime(task.task_deadline)} 结束`;
    }
    
    if (task.daily_time_start && task.daily_time_end) {
      const dailyTime = `每日 ${formatTime(task.daily_time_start)} - ${formatTime(task.daily_time_end)}`;
      timeStr += timeStr ? `，${dailyTime}` : dailyTime;
    }
    
    return timeStr || '不限时间';
  }

  return '不限时间';
};

// 🎯 格式化进度显示
const formatProgressDisplay = (task: Task, completion_percentage: number | null): string => {
  if (task.repeat_frequency === 'never') {
    return task.completed_count >= 1 ? '已完成' : '未完成';
  }
  
  if (task.repeat_frequency === 'forever') {
    return `已完成 ${task.completed_count} 次，当前连续 ${task.current_streak} 次`;
  }
  
  if (task.required_count) {
    return `${task.completed_count}/${task.required_count} 次 (${Math.round(completion_percentage || 0)}%)`;
  }
  
  return `已完成 ${task.completed_count} 次`;
};

// 🎯 格式化状态显示
const formatStatusDisplay = (status: string): string => {
  const statusMap = {
    'recruiting': '招募中',
    'assigned': '已分配',
    'in_progress': '进行中',
    'completed': '已完成',
    'abandoned': '已放弃'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

// 🎯 格式化重复频率显示
const formatRepeatFrequency = (frequency: string): string => {
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

// 🎯 格式化星期显示
const formatWeekdays = (weekdays: number[] | null): string => {
  if (!weekdays || weekdays.length === 0) return '每天';
  
  const weekdayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return weekdays.map(day => weekdayNames[day]).join('、');
};

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onAssign,
  onComplete,
  onAbandon,
  currentUserId,
  isLoading = false
}) => {
  const { theme } = useTheme();

  if (!task) return null;

  const displayInfo = calculateTaskDisplayInfo(task);
  const isCreator = currentUserId === task.creator_id;
  const isAssignee = currentUserId === task.assignee_id;

  return (
    <ThemeDialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="clipboard-list" className="w-5 h-5" />
            任务详情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 🎯 基础信息 */}
          <ThemeCard className="p-4">
            <div className="space-y-4">
              <DetailField label="任务标题" value={task.title} />
              
              {task.description && (
                <DetailField label="任务描述" value={task.description} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <DetailField 
                  label="任务类型" 
                  value={
                    task.task_type === 'daily' ? '日常任务' :
                    task.task_type === 'habit' ? '习惯养成' : '特殊任务'
                  } 
                />
                <DetailField label="积分奖励" value={`${task.points} 分`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailField label="任务状态" value={displayInfo.status_display} />
                <DetailField 
                  label="重复类型" 
                  value={formatRepeatFrequency(task.repeat_frequency)} 
                />
              </div>
            </div>
          </ThemeCard>

          {/* 🎯 时间信息 */}
          <ThemeCard className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Icon name="clock" className="w-4 h-4" />
              时间安排
            </h3>
            <div className="space-y-3">
              <DetailField label="时间安排" value={displayInfo.time_display} />
              
              {task.repeat_weekdays && task.repeat_weekdays.length > 0 && (
                <DetailField 
                  label="重复星期" 
                  value={formatWeekdays(task.repeat_weekdays)} 
                />
              )}
            </div>
          </ThemeCard>

          {/* 🎯 进度信息 */}
          <ThemeCard className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Icon name="chart-bar" className="w-4 h-4" />
              完成进度
            </h3>
            <div className="space-y-3">
              <DetailField label="完成情况" value={displayInfo.progress_display} />
              
              {task.current_streak > 0 && (
                <DetailField 
                  label="当前连续" 
                  value={`${task.current_streak} 次`} 
                />
              )}
              
              {task.longest_streak > 0 && (
                <DetailField 
                  label="最长连续" 
                  value={`${task.longest_streak} 次`} 
                />
              )}

              {displayInfo.completion_percentage !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>完成进度</span>
                    <span>{Math.round(displayInfo.completion_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${displayInfo.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </ThemeCard>

          {/* 🎯 其他信息 */}
          <ThemeCard className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Icon name="information-circle" className="w-4 h-4" />
              其他信息
            </h3>
            <div className="space-y-3">
              <DetailField 
                label="需要证明" 
                value={task.requires_proof ? '是' : '否'} 
              />
              
              <DetailField 
                label="创建时间" 
                value={new Date(task.created_at).toLocaleString('zh-CN')} 
              />
              
              {task.submitted_at && (
                <DetailField 
                  label="提交时间" 
                  value={new Date(task.submitted_at).toLocaleString('zh-CN')} 
                />
              )}
              
              {task.completed_at && (
                <DetailField 
                  label="完成时间" 
                  value={new Date(task.completed_at).toLocaleString('zh-CN')} 
                />
              )}

              {task.review_comment && (
                <DetailField label="评价" value={task.review_comment} />
              )}
            </div>
          </ThemeCard>

          {/* 🎯 状态提示 */}
          {displayInfo.is_overdue && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Icon name="exclamation-triangle" className="w-4 h-4" />
                <span className="text-sm font-medium">任务已过期</span>
              </div>
            </div>
          )}

          {displayInfo.can_complete_today && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Icon name="check-circle" className="w-4 h-4" />
                <span className="text-sm font-medium">今天可以完成此任务</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {isCreator && onEdit && (
              <ThemeButton 
                variant="secondary" 
                onClick={onEdit}
                disabled={isLoading}
              >
                <Icon name="pencil" className="w-4 h-4 mr-1" />
                编辑
              </ThemeButton>
            )}
            
            {task.status === 'recruiting' && onAssign && !isCreator && (
              <ThemeButton 
                onClick={onAssign}
                disabled={isLoading}
              >
                <Icon name="hand-raised" className="w-4 h-4 mr-1" />
                接受任务
              </ThemeButton>
            )}
            
            {displayInfo.can_complete_today && isAssignee && onComplete && (
              <ThemeButton 
                onClick={onComplete}
                disabled={isLoading}
              >
                <Icon name="check" className="w-4 h-4 mr-1" />
                完成任务
              </ThemeButton>
            )}
            
            {displayInfo.is_active && isAssignee && onAbandon && (
              <ThemeButton 
                variant="secondary" 
                onClick={onAbandon}
                disabled={isLoading}
              >
                <Icon name="x-mark" className="w-4 h-4 mr-1" />
                放弃任务
              </ThemeButton>
            )}
          </div>
          
          <DialogClose asChild>
            <ThemeButton variant="secondary">
              关闭
            </ThemeButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </ThemeDialog>
  );
};

export default TaskDetailCard;
