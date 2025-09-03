import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ThemeFormField, 
  ThemeInput, 
  ThemeTextarea, 
  ThemeCheckbox, 
  ThemeButton 
} from '../ui/Components';
import type { EditEventForm } from '../../types/event';

interface EventFormProps {
  mode: 'create' | 'edit';
  formData: EditEventForm;
  selectedDate: string | null;
  coupleUsers: {user1: any, user2: any} | null;
  onFormChange: (data: Partial<EditEventForm>) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  user?: any;
}

const EventForm: React.FC<EventFormProps> = ({
  mode,
  formData,
  selectedDate,
  coupleUsers,
  onFormChange,
  onSubmit,
  onCancel,
  user
}) => {
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      date: selectedDate || new Date().toISOString().split('T')[0]
    };
    
    onSubmit(eventData);
  };

  const getCurrentLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 事件标题 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'EVENT_TITLE' : theme === 'modern' ? 'Event Title' : '事件标题'}
        required
      >
        <ThemeInput
          type="text"
          value={formData.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          placeholder={theme === 'pixel' ? 'ENTER_TITLE' : theme === 'modern' ? 'Enter event title' : '输入事件标题'}
          required
        />
      </ThemeFormField>

      {/* 事件描述 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'DESCRIPTION' : theme === 'modern' ? 'Description' : '描述'}
      >
        <ThemeTextarea
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder={theme === 'pixel' ? 'OPTIONAL_DESCRIPTION' : theme === 'modern' ? 'Optional description' : '可选描述'}
          rows={3}
        />
      </ThemeFormField>

      {/* 全天事件 */}
      <ThemeFormField>
        <ThemeCheckbox
          checked={formData.isAllDay}
          onChange={(e) => onFormChange({ isAllDay: e.target.checked })}
          label={theme === 'pixel' ? 'ALL_DAY_EVENT' : theme === 'modern' ? 'All day event' : '全天事件'}
        />
      </ThemeFormField>

      {/* 时间设置 */}
      {!formData.isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <ThemeFormField
            label={theme === 'pixel' ? 'START_TIME' : theme === 'modern' ? 'Start Time' : '开始时间'}
            required
          >
            <ThemeInput
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => onFormChange({ startDateTime: e.target.value })}
              min={getCurrentLocalDateTimeString()}
              required
            />
          </ThemeFormField>

          <ThemeFormField
            label={theme === 'pixel' ? 'END_TIME' : theme === 'modern' ? 'End Time' : '结束时间'}
            required
          >
            <ThemeInput
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => onFormChange({ endDateTime: e.target.value })}
              min={formData.startDateTime || getCurrentLocalDateTimeString()}
              required
            />
          </ThemeFormField>
        </div>
      )}

      {/* 地点 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'LOCATION' : theme === 'modern' ? 'Location' : '地点'}
      >
        <ThemeInput
          type="text"
          value={formData.location}
          onChange={(e) => onFormChange({ location: e.target.value })}
          placeholder={theme === 'pixel' ? 'OPTIONAL_LOCATION' : theme === 'modern' ? 'Optional location' : '可选地点'}
        />
      </ThemeFormField>

      {/* Joint Activity 设置 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'JOINT_ACTIVITY' : theme === 'modern' ? 'Joint Activity' : '共同活动'}
        description={theme === 'pixel' ? 'IS_THIS_A_SHARED_EVENT' : theme === 'modern' ? 'Is this a shared event with your partner?' : '这是与伴侣的共同活动吗？'}
      >
        <ThemeCheckbox
          checked={formData.includesUser1 && formData.includesUser2}
          onChange={(e) => {
            if (e.target.checked) {
              // 共同活动：两人都参与
              onFormChange({ includesUser1: true, includesUser2: true });
            } else {
              // 个人活动：只有当前用户参与
              if (coupleUsers && user) {
                const isUser1 = user.id === coupleUsers.user1.id;
                onFormChange({ 
                  includesUser1: isUser1, 
                  includesUser2: !isUser1 
                });
              }
            }
          }}
          label={theme === 'pixel' ? 'SHARED_WITH_PARTNER' : theme === 'modern' ? 'Shared with partner' : '与伴侣共享'}
        />
      </ThemeFormField>

      {/* 按钮 */}
      <div className="flex justify-end space-x-2 pt-4">
        <ThemeButton type="button" variant="secondary" onClick={onCancel}>
          {theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消'}
        </ThemeButton>
        <ThemeButton type="submit" variant="primary">
          {mode === 'create' 
            ? (theme === 'pixel' ? 'CREATE_EVENT' : theme === 'modern' ? 'Create Event' : '创建事件')
            : (theme === 'pixel' ? 'UPDATE_EVENT' : theme === 'modern' ? 'Update Event' : '更新事件')
          }
        </ThemeButton>
      </div>
    </form>
  );
};

export default EventForm;
