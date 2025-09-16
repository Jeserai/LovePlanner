import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import PixelIcon from '../PixelIcon';
import DetailField from '../ui/DetailField';
import { ThemeButton } from '../ui/Components';
import { useTranslation } from '../../utils/i18n';
import type { Event } from '../../types/event';

interface EventDetailProps {
  event: Event;
  user: any;
  coupleUsers: {user1: any, user2: any} | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  currentView?: 'all' | 'my' | 'partner' | 'shared';
  isDeleting?: boolean;
}

const EventDetail: React.FC<EventDetailProps> = ({
  event,
  user,
  coupleUsers,
  onEdit,
  onDelete,
  onClose,
  currentView,
  isDeleting = false
}) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);

  // 权限检查
  const hasEditPermission = event.createdBy === user?.id;
  // 伴侣视图下完全只读
  const isPartnerViewReadOnly = currentView === 'partner';

  // 🎯 简化时间显示：直接使用已格式化的时间
  const formatDetailedTime = (event: Event) => {
    // 如果是全天事件，直接返回
    if (!event.time || event.time === '全天') {
      return t('all_day');
    }
    
    // 格式化日期
    const dateFormatted = formatDate(event.date);
    
    // 直接使用已经格式化好的时间（与右侧面板一致）
    return `${dateFormatted} ${event.time}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'zh') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // 获取事件描述
  const getEventDescription = (event: Event) => {
    return event.description || '';
  };

  // 获取事件地点
  const getEventLocation = (event: Event) => {
    return event.location || '';
  };

  // 获取是否全天事件
  const getEventAllDay = (event: Event) => {
    return event.isAllDay || false;
  };

  // 获取创建者
  const getEventCreatedBy = (event: Event) => {
    if (!event.createdBy || !coupleUsers) return t('unknown_user');
    
    if (event.createdBy === coupleUsers.user1.id) {
      return coupleUsers.user1.display_name;
    }
    if (event.createdBy === coupleUsers.user2.id) {
      return coupleUsers.user2.display_name;
    }
    return t('unknown_user');
  };

  // 获取创建时间
  const getEventCreatedAt = (event: Event) => {
    if (!event.createdAt) return '--';
    
    try {
      const date = new Date(event.createdAt);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '--';
    }
  };

  // 获取参与者文本
  const getParticipantsText = (participants: string[]) => {
    if (!coupleUsers || !user) return '未知参与者';
    
    const names = participants.map(p => {
      if (p === user.id) return '我';
      if (p === coupleUsers.user1.id) return coupleUsers.user1.display_name;
      if (p === coupleUsers.user2.id) return coupleUsers.user2.display_name;
      return '未知参与者';
    });
    
    return names.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* 事件标题 */}
      <DetailField
        label={theme === 'pixel' ? 'EVENT_TITLE' : theme === 'modern' ? 'Event Title' : '日程标题'}
        value={event.title}
        valueClassName="text-lg font-medium"
      />

      {/* 描述字段 */}
      {getEventDescription(event) && (
        <DetailField
          label={theme === 'pixel' ? 'DESCRIPTION' : theme === 'modern' ? 'Description' : '描述'}
          value={getEventDescription(event)}
        />
      )}

      {/* 时间 */}
      <DetailField
        label={theme === 'pixel' ? 'EVENT_TIME' : theme === 'modern' ? 'Event Time' : '日程时间'}
        value={formatDetailedTime(event)}
      />

      {/* 地点字段 */}
      {getEventLocation(event) && (
        <DetailField
          label={theme === 'pixel' ? 'LOCATION' : theme === 'modern' ? 'Location' : '地点'}
          value={getEventLocation(event)}
        />
      )}

      {/* 全天事件标识 */}
      <DetailField
        label={theme === 'pixel' ? 'ALL_DAY' : theme === 'modern' ? 'All Day' : '全天事件'}
        value={getEventAllDay(event) 
          ? (theme === 'pixel' ? 'YES' : theme === 'modern' ? 'Yes' : '是') 
          : (theme === 'pixel' ? 'NO' : theme === 'modern' ? 'No' : '否')
        }
      />

      {/* 参与者 */}
      <DetailField
        label={theme === 'pixel' ? 'PARTICIPANTS' : theme === 'modern' ? 'Participants' : '参与者'}
        value={getParticipantsText(event.participants)}
      />

      {/* 创建者 */}
      <DetailField
        label={theme === 'pixel' ? 'CREATED_BY' : t('created_by')}
        value={getEventCreatedBy(event)}
      />

      {/* 创建时间 */}
      <DetailField
        label={theme === 'pixel' ? 'CREATED_AT' : t('created_at')}
        value={getEventCreatedAt(event)}
      />

      {/* 重复事件信息 */}
      {event.isRecurring && (
        <DetailField
          label={theme === 'pixel' ? 'RECURRENCE' : theme === 'modern' ? 'Recurrence' : '重复'}
          value={getRecurrenceText(event.recurrenceType)}
        />
      )}

      {/* 只读模式提示 */}
      {(isPartnerViewReadOnly || !hasEditPermission) && (
        <div className={`text-sm p-3 rounded-lg ${
          theme === 'pixel' 
            ? 'bg-pixel-panel border border-pixel-border text-pixel-textMuted font-mono' 
            : theme === 'modern'
            ? 'bg-muted text-muted-foreground border'
            : 'bg-muted text-muted-foreground border'
        }`}>
          {isPartnerViewReadOnly 
            ? (theme === 'pixel' ? 'PARTNER_VIEW_READONLY' : theme === 'modern' ? 'Partner view - Read only' : '伴侣日历视图 - 只读模式')
            : (theme === 'pixel' ? 'NO_EDIT_PERMISSION' : theme === 'modern' ? 'No edit permission' : '无编辑权限')
          }
        </div>
      )}
      
      {/* 🔧 统一的操作按钮区域 */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        {/* 编辑和删除按钮（仅在有权限且非只读模式时显示） */}
        {hasEditPermission && !isPartnerViewReadOnly && (
          <>
            <ThemeButton
              variant="secondary"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              {theme === 'pixel' ? (
                <PixelIcon name="edit" />
              ) : (
                <PencilIcon className="w-4 h-4" />
              )}
              <span>{theme === 'pixel' ? 'EDIT' : t('edit')}</span>
            </ThemeButton>

            <ThemeButton
              variant="danger"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center space-x-2"
            >
              {theme === 'pixel' ? (
                <PixelIcon name="delete" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
              <span>
                {isDeleting 
                  ? (theme === 'pixel' ? 'DELETING...' : t('deleting') || '删除中...')
                  : (theme === 'pixel' ? 'DELETE' : t('delete'))
                }
              </span>
            </ThemeButton>
          </>
        )}
        
        {/* 关闭按钮（始终显示在最右侧） */}
        {onClose && (
          <ThemeButton variant="secondary" onClick={onClose}>
            {theme === 'pixel' ? 'CLOSE' : t('close')}
          </ThemeButton>
        )}
      </div>
    </div>
  );

  // 获取重复频率文本
  function getRecurrenceText(recurrenceType?: string) {
    switch (recurrenceType) {
      case 'daily': return '每日';
      case 'weekly': return '每周';
      case 'biweekly': return '双周';
      case 'monthly': return '每月';
      case 'yearly': return '每年';
      default: return '';
    }
  }
};

export default EventDetail;
