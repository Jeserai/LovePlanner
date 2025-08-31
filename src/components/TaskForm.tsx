// 🎯 新的任务表单组件 - 基于优化后的单表结构
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ThemeDialog, 
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
  ThemeFormField, 
  ThemeInput, 
  ThemeTextarea, 
  ThemeSelect, 
  ThemeCheckbox, 
  ThemeButton 
} from './ui/Components';
import type { CreateTaskForm, EditTaskForm, Task, RepeatFrequency, TaskType } from '../types/task';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateTaskForm | EditTaskForm) => Promise<void>;
  editTask?: Task | null;
  isLoading?: boolean;
}

// 🎯 重复频率选项
const REPEAT_FREQUENCY_OPTIONS = [
  { value: 'never', label: '一次性任务' },
  { value: 'daily', label: '每日重复' },
  { value: 'weekly', label: '每周重复' },
  { value: 'biweekly', label: '每两周重复' },
  { value: 'monthly', label: '每月重复' },
  { value: 'yearly', label: '每年重复' },
  { value: 'forever', label: '永远重复' }
] as const;

// 🎯 任务类型选项
const TASK_TYPE_OPTIONS = [
  { value: 'daily', label: '日常任务' },
  { value: 'habit', label: '习惯养成' },
  { value: 'special', label: '特殊任务' }
] as const;

// 🎯 星期选项
const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
] as const;

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editTask,
  isLoading = false
}) => {
  const { theme } = useTheme();
  
  // 🎯 表单状态
  const [formData, setFormData] = useState<CreateTaskForm>({
    title: '',
    description: '',
    points: 10,
    task_type: 'daily',
    repeat_frequency: 'never',
    requires_proof: false
  });

  // 🎯 UI控制状态
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [showRepeatDetails, setShowRepeatDetails] = useState(false);

  // 🎯 初始化表单数据
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        points: editTask.points,
        task_type: editTask.task_type,
        repeat_frequency: editTask.repeat_frequency,
        earliest_start_time: editTask.earliest_start_time || undefined,
        required_count: editTask.required_count || undefined,
        task_deadline: editTask.task_deadline || undefined,
        repeat_weekdays: editTask.repeat_weekdays || undefined,
        daily_time_start: editTask.daily_time_start || undefined,
        daily_time_end: editTask.daily_time_end || undefined,
        requires_proof: editTask.requires_proof
      });
      setShowTimeFields(!!editTask.earliest_start_time || !!editTask.task_deadline);
      setShowRepeatDetails(editTask.repeat_frequency !== 'never');
    } else {
      // 重置为默认值
      setFormData({
        title: '',
        description: '',
        points: 10,
        task_type: 'daily',
        repeat_frequency: 'never',
        requires_proof: false
      });
      setShowTimeFields(false);
      setShowRepeatDetails(false);
    }
  }, [editTask, isOpen]);

  // 🎯 处理重复频率变化
  const handleRepeatFrequencyChange = (frequency: RepeatFrequency) => {
    setFormData(prev => ({
      ...prev,
      repeat_frequency: frequency,
      // 清除不适用的字段
      required_count: frequency === 'forever' ? undefined : prev.required_count,
      task_deadline: frequency === 'forever' ? undefined : prev.task_deadline
    }));
    setShowRepeatDetails(frequency !== 'never');
  };

  // 🎯 处理星期选择
  const handleWeekdayToggle = (day: number) => {
    const currentWeekdays = formData.repeat_weekdays || [];
    const newWeekdays = currentWeekdays.includes(day)
      ? currentWeekdays.filter(d => d !== day)
      : [...currentWeekdays, day].sort();
    
    setFormData(prev => ({
      ...prev,
      repeat_weekdays: newWeekdays.length > 0 ? newWeekdays : undefined
    }));
  };

  // 🎯 表单验证
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return '请输入任务标题';
    }
    
    if (formData.points < 0) {
      return '积分不能为负数';
    }

    // 一次性任务必须有required_count = 1
    if (formData.repeat_frequency === 'never' && formData.required_count !== 1) {
      setFormData(prev => ({ ...prev, required_count: 1 }));
    }

    // 有限重复任务必须有required_count > 0
    if (['daily', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(formData.repeat_frequency)) {
      if (!formData.required_count || formData.required_count <= 0) {
        return '重复任务必须设置完成次数';
      }
    }

    // 永远重复任务不能有required_count和task_deadline
    if (formData.repeat_frequency === 'forever') {
      if (formData.required_count || formData.task_deadline) {
        setFormData(prev => ({
          ...prev,
          required_count: undefined,
          task_deadline: undefined
        }));
      }
    }

    // 时间窗口验证
    if (formData.daily_time_start && formData.daily_time_end) {
      if (formData.daily_time_start >= formData.daily_time_end) {
        return '开始时间必须早于结束时间';
      }
    }

    return null;
  };

  // 🎯 提交表单
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      if (editTask) {
        await onSubmit({ ...formData, id: editTask.id } as EditTaskForm);
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (error) {
      console.error('提交任务失败:', error);
      alert('提交失败，请重试');
    }
  };

  // 🎯 格式化日期时间输入值
  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <ThemeDialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTask ? '编辑任务' : '创建新任务'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 🎯 基础信息 */}
          <div className="space-y-4">
            <ThemeFormField label="任务标题" required>
              <ThemeInput
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入任务标题"
              />
            </ThemeFormField>

            <ThemeFormField label="任务描述">
              <ThemeTextarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述任务内容和要求"
                rows={3}
              />
            </ThemeFormField>

            <div className="grid grid-cols-2 gap-4">
              <ThemeFormField label="任务类型">
                <ThemeSelect
                  value={formData.task_type}
                  onValueChange={(value: TaskType) => 
                    setFormData(prev => ({ ...prev, task_type: value }))
                  }
                >
                  {TASK_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </ThemeSelect>
              </ThemeFormField>

              <ThemeFormField label="积分奖励">
                <ThemeInput
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    points: parseInt(e.target.value) || 0 
                  }))}
                />
              </ThemeFormField>
            </div>
          </div>

          {/* 🎯 重复设置 */}
          <div className="space-y-4">
            <ThemeFormField label="重复频率">
              <ThemeSelect
                value={formData.repeat_frequency}
                onValueChange={handleRepeatFrequencyChange}
              >
                {REPEAT_FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ThemeSelect>
            </ThemeFormField>

            {/* 🎯 重复任务详细设置 */}
            {showRepeatDetails && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  重复任务设置
                </h4>

                {/* 完成次数设置 */}
                {formData.repeat_frequency !== 'forever' && (
                  <ThemeFormField label="需要完成次数" required>
                    <ThemeInput
                      type="number"
                      min="1"
                      value={formData.required_count || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        required_count: parseInt(e.target.value) || undefined
                      }))}
                      placeholder="例如：21（21天挑战）"
                    />
                  </ThemeFormField>
                )}

                {/* 星期限制 */}
                {['weekly', 'biweekly'].includes(formData.repeat_frequency) && (
                  <ThemeFormField label="限制星期（可选）">
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map(option => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.repeat_weekdays || []).includes(option.value)}
                            onChange={() => handleWeekdayToggle(option.value)}
                            className="rounded"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </ThemeFormField>
                )}
              </div>
            )}
          </div>

          {/* 🎯 时间设置 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ThemeCheckbox
                checked={showTimeFields}
                onCheckedChange={setShowTimeFields}
              />
              <label className="text-sm font-medium">设置时间限制</label>
            </div>

            {showTimeFields && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ThemeFormField label="最早开始时间">
                    <ThemeInput
                      type="datetime-local"
                      value={formatDateTimeLocal(formData.earliest_start_time)}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        earliest_start_time: e.target.value || undefined
                      }))}
                    />
                  </ThemeFormField>

                  {formData.repeat_frequency !== 'forever' && (
                    <ThemeFormField label="任务截止时间">
                      <ThemeInput
                        type="datetime-local"
                        value={formatDateTimeLocal(formData.task_deadline)}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          task_deadline: e.target.value || undefined
                        }))}
                      />
                    </ThemeFormField>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ThemeFormField label="每日开始时间">
                    <ThemeInput
                      type="time"
                      value={formData.daily_time_start || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        daily_time_start: e.target.value || undefined
                      }))}
                    />
                  </ThemeFormField>

                  <ThemeFormField label="每日结束时间">
                    <ThemeInput
                      type="time"
                      value={formData.daily_time_end || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        daily_time_end: e.target.value || undefined
                      }))}
                    />
                  </ThemeFormField>
                </div>
              </div>
            )}
          </div>

          {/* 🎯 其他设置 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ThemeCheckbox
                checked={formData.requires_proof}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, requires_proof: checked }))
                }
              />
              <label className="text-sm font-medium">需要提交证明</label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <ThemeButton variant="secondary">
              取消
            </ThemeButton>
          </DialogClose>
          <ThemeButton 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '提交中...' : (editTask ? '更新任务' : '创建任务')}
          </ThemeButton>
        </DialogFooter>
      </DialogContent>
    </ThemeDialog>
  );
};

export default TaskForm;
