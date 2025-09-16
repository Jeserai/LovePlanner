import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ThemeFormField, 
  ThemeInput, 
  ThemeTextarea, 
  ThemeCheckbox, 
  ThemeButton 
} from '../ui/Components';
import { useTranslation } from '../../utils/i18n';
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
  isSubmitting?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({
  mode,
  formData,
  selectedDate,
  coupleUsers,
  onFormChange,
  onSubmit,
  onCancel,
  user,
  isSubmitting = false
}) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      date: selectedDate || new Date().toISOString().split('T')[0]
    };
    
    onSubmit(eventData);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 事件标题 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'EVENT_TITLE' : t('event_title')}
        required
      >
        <ThemeInput
          type="text"
          value={formData.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          placeholder={theme === 'pixel' ? 'ENTER_TITLE' : t('enter_title')}
          required
        />
      </ThemeFormField>

      {/* 事件描述 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'DESCRIPTION' : t('description')}
      >
        <ThemeTextarea
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder={theme === 'pixel' ? 'OPTIONAL_DESCRIPTION' : t('optional_description')}
          rows={3}
        />
      </ThemeFormField>

      {/* 全天事件 */}
      <ThemeFormField>
        <ThemeCheckbox
          checked={formData.isAllDay}
          onChange={(e) => onFormChange({ isAllDay: e.target.checked })}
          label={theme === 'pixel' ? 'ALL_DAY_EVENT' : t('all_day_event')}
        />
      </ThemeFormField>

      {/* 时间设置 */}
      {!formData.isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <ThemeFormField
            label={theme === 'pixel' ? 'START_TIME' : t('start_time')}
            required
          >
            <ThemeInput
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => onFormChange({ startDateTime: e.target.value })}
              required
            />
          </ThemeFormField>

          <ThemeFormField
            label={theme === 'pixel' ? 'END_TIME' : t('end_time')}
            required
          >
            <ThemeInput
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => onFormChange({ endDateTime: e.target.value })}
              min={formData.startDateTime}
              required
            />
          </ThemeFormField>
        </div>
      )}

      {/* 地点 */}
      <ThemeFormField
        label={theme === 'pixel' ? 'LOCATION' : t('location')}
      >
        <ThemeInput
          type="text"
          value={formData.location}
          onChange={(e) => onFormChange({ location: e.target.value })}
          placeholder={theme === 'pixel' ? 'OPTIONAL_LOCATION' : t('optional_location')}
        />
      </ThemeFormField>

      {/* Joint Activity 设置 */}
      <ThemeFormField>
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
          label={theme === 'pixel' ? 'SHARED_WITH_PARTNER' : t('shared_with_partner')}
        />
      </ThemeFormField>

      {/* 重复事件设置 */}
      <ThemeFormField>
        <ThemeCheckbox
          checked={formData.isRecurring}
          onChange={(e) => onFormChange({ isRecurring: e.target.checked })}
          label={theme === 'pixel' ? 'RECURRING_EVENT' : t('recurring_event')}
        />
      </ThemeFormField>

      {/* 重复事件选项 */}
      {formData.isRecurring && (
        <div className="space-y-4">
          <ThemeFormField
            label={theme === 'pixel' ? 'RECURRENCE_TYPE' : t('recurrence_type')}
            required
          >
            <select
              value={formData.recurrenceType || 'daily'}
              onChange={(e) => onFormChange({ recurrenceType: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md ${
                theme === 'pixel' ? 'border-pixel-border bg-pixel-background text-pixel-text' :
                theme === 'modern' ? 'border-border bg-background text-foreground' :
                'border-border bg-background text-foreground'
              }`}
            >
              <option value="daily">{theme === 'pixel' ? 'DAILY' : t('daily')}</option>
              <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : t('weekly')}</option>
              <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : t('monthly')}</option>
              <option value="yearly">{theme === 'pixel' ? 'YEARLY' : t('yearly')}</option>
            </select>
          </ThemeFormField>

          <ThemeFormField
            label={theme === 'pixel' ? 'RECURRENCE_END' : theme === 'modern' ? 'End Date' : '结束日期'}
            description={theme === 'pixel' ? 'WHEN_STOP_REPEATING' : theme === 'modern' ? 'When to stop repeating (optional)' : '何时停止重复（可选）'}
          >
            <ThemeInput
              type="date"
              value={formData.recurrenceEnd}
              onChange={(e) => onFormChange({ recurrenceEnd: e.target.value })}
              min={selectedDate || new Date().toISOString().split('T')[0]}
            />
          </ThemeFormField>
        </div>
      )}

      {/* 按钮 */}
      <div className="flex justify-end space-x-2 pt-4">
        <ThemeButton type="button" variant="secondary" onClick={onCancel}>
          {theme === 'pixel' ? 'CANCEL' : t('cancel')}
        </ThemeButton>
        <ThemeButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            mode === 'create' 
              ? (theme === 'pixel' ? 'CREATING...' : t('creating') || '创建中...')
              : (theme === 'pixel' ? 'UPDATING...' : t('updating') || '更新中...')
          ) : (
            mode === 'create' 
              ? (theme === 'pixel' ? 'CREATE_EVENT' : t('create_event'))
              : (theme === 'pixel' ? 'UPDATE_EVENT' : t('edit_event'))
          )}
        </ThemeButton>
      </div>
    </form>
  );
};

export default EventForm;
