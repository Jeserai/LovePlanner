import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import PixelIcon from '../PixelIcon';
import type { Event } from '../../types/event';

interface DayViewProps {
  selectedDate: string | null;
  events: Event[];
  currentView: 'all' | 'my' | 'partner' | 'shared';
  user: any;
  coupleUsers: {user1: any, user2: any} | null;
  onEventClick: (event: Event) => void;
  getFilteredEvents: (events: Event[]) => Event[];
}

const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  events,
  currentView,
  user,
  coupleUsers,
  onEventClick,
  getFilteredEvents
}) => {
  const { theme } = useTheme();

  // 获取视图显示名称
  const getViewDisplayName = () => {
    switch (currentView) {
      case 'all':
        return theme === 'pixel' ? 'ALL_SCHEDULE' : '全部日程';
      case 'my':
        return theme === 'pixel' ? 'MY_SCHEDULE' : '我的日程';
      case 'partner':
        return theme === 'pixel' ? 'PARTNER_SCHEDULE' : '伴侣日程';
      case 'shared':
        return theme === 'pixel' ? 'SHARED_SCHEDULE' : '共同日程';
      default:
        return '';
    }
  };

  // 格式化日期显示
  const formatDateDisplay = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const displayDate = selectedDate || todayStr;
    
    if (displayDate === todayStr) {
      return theme === 'pixel' ? 'TODAY' : '今天';
    }
    
    const [year, month, day] = displayDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    return `${parseInt(month)}月${parseInt(day)}日 ${weekdays[date.getDay()]}`;
  };

  // 获取当天事件
  const getDayEvents = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const displayDate = selectedDate || todayStr;
    
    return getFilteredEvents(events).filter(event => event.date === displayDate);
  };

  // 获取无事件时的文本
  const getNoEventsText = () => {
    switch (currentView) {
      case 'all':
        return theme === 'pixel' ? 'NO_EVENTS_TODAY' : '今天没有任何日程';
      case 'my':
        return theme === 'pixel' ? 'NO_EVENTS_TODAY' : '今天没有您的日程';
      case 'partner':
        return theme === 'pixel' ? 'NO_PARTNER_EVENTS_TODAY' : '今天没有伴侣的日程';
      case 'shared':
        return theme === 'pixel' ? 'NO_SHARED_EVENTS_TODAY' : '今天没有共同日程';
      default:
        return '';
    }
  };

  // 按时间排序事件
  const sortedEvents = getDayEvents().sort((a, b) => {
    if (a.time === '全天' && b.time !== '全天') return -1;
    if (a.time !== '全天' && b.time === '全天') return 1;
    if (a.time === '全天' && b.time === '全天') return 0;
    
    const timeA = a.time?.split(' - ')[0] || '00:00';
    const timeB = b.time?.split(' - ')[0] || '00:00';
    return timeA.localeCompare(timeB);
  });

  // 获取参与者文本的辅助函数
  const getParticipantsText = (participants: string[]): string => {
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
      {/* 标题和日期 */}
      <div className="border-b pb-3">
        <div className="flex items-center space-x-2 mb-2">
          {theme === 'pixel' ? (
            <PixelIcon name="calendar" />
          ) : (
            <ArrowPathIcon className="h-5 w-5 text-primary" />
          )}
          <h3 className={`font-bold ${
            theme === 'pixel' 
              ? 'text-lg font-mono text-pixel-text uppercase tracking-wide'
              : theme === 'modern'
              ? 'text-lg text-foreground'
              : 'text-lg text-gray-800'
          }`}>
            {getViewDisplayName()}
          </h3>
        </div>

        <div className={`text-xl font-semibold ${
          theme === 'pixel' 
            ? 'text-pixel-accent font-mono'
            : theme === 'modern'
            ? 'text-primary'
            : 'text-blue-600'
        }`}>
          {formatDateDisplay()}
        </div>
      </div>

      {/* 事件列表 */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className={`mb-4 ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono text-3xl'
              : 'text-gray-400 text-4xl'
          }`}>
            📅
          </div>
          <p className={`${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono uppercase' 
              : theme === 'modern'
              ? 'text-muted-foreground'
              : 'text-gray-500'
          }`}>
            {getNoEventsText()}
          </p>
          <p className={`text-sm mt-2 ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono'
              : 'text-gray-400'
          }`}>
            {theme === 'pixel' ? 'ADD_EVENT_TO_GET_STARTED' : '点击"新建事件"开始添加'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 全天事件 */}
          {sortedEvents.filter(event => event.time === '全天').map(event => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`p-4 cursor-pointer transition-all duration-300 border-l-4 ${
                theme === 'pixel' 
                  ? 'bg-pixel-card border-pixel-accent hover:bg-pixel-panel'
                  : theme === 'modern'
                  ? 'bg-card border-primary hover:bg-accent/50'
                  : 'bg-blue-50 border-blue-400 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  theme === 'pixel' 
                    ? 'bg-pixel-accent text-pixel-bg font-mono'
                    : theme === 'modern'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {theme === 'pixel' ? 'ALL_DAY' : '全天'}
                </span>
                {event.isRecurring && (
                  theme === 'pixel' ? (
                    <PixelIcon name="refresh" size="sm" className="text-pixel-textMuted" />
                  ) : (
                    <ArrowPathIcon className="w-4 h-4 text-muted-foreground" />
                  )
                )}
              </div>
              <h4 className={`font-medium mb-1 ${
                theme === 'pixel' 
                  ? 'text-pixel-text font-mono'
                  : theme === 'modern'
                  ? 'text-foreground'
                  : 'text-gray-800'
              }`}>
                {event.title}
              </h4>
              <p className={`text-sm ${
                theme === 'pixel' 
                  ? 'text-pixel-textMuted font-mono'
                  : theme === 'modern'
                  ? 'text-muted-foreground'
                  : 'text-gray-600'
              }`}>
                {getParticipantsText(event.participants)}
              </p>
            </div>
          ))}

          {/* 定时事件 */}
          {sortedEvents.filter(event => event.time !== '全天').map(event => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`p-4 cursor-pointer transition-all duration-300 rounded-lg border ${
                theme === 'pixel' 
                  ? 'bg-pixel-card border-pixel-border hover:bg-pixel-panel hover:border-pixel-accent'
                  : theme === 'modern'
                  ? 'bg-card border-border hover:bg-accent/50 hover:border-primary/30'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`text-sm font-medium ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono'
                    : theme === 'modern'
                    ? 'text-primary'
                    : 'text-blue-600'
                }`}>
                  {/* 使用本地时间显示 */}
                  {event.rawStartTime && event.rawStartTime !== 'Invalid Date' 
                    ? (event.rawEndTime && event.rawEndTime !== 'Invalid Date' 
                        ? `${event.rawStartTime} - ${event.rawEndTime}`
                        : event.rawStartTime)
                    : (event.time || '时间未知')
                  }
                </div>
                {event.isRecurring && (
                  theme === 'pixel' ? (
                    <PixelIcon name="refresh" size="sm" className="text-pixel-textMuted" />
                  ) : (
                    <ArrowPathIcon className="w-4 h-4 text-muted-foreground" />
                  )
                )}
              </div>
              <h4 className={`font-medium mb-1 ${
                theme === 'pixel' 
                  ? 'text-pixel-text font-mono'
                  : theme === 'modern'
                  ? 'text-foreground'
                  : 'text-gray-800'
              }`}>
                {event.title}
              </h4>
              {event.location && (
                <p className={`text-sm mb-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono'
                    : theme === 'modern'
                    ? 'text-muted-foreground'
                    : 'text-gray-600'
                }`}>
                  📍 {event.location}
                </p>
              )}
              <p className={`text-sm ${
                theme === 'pixel' 
                  ? 'text-pixel-textMuted font-mono'
                  : theme === 'modern'
                  ? 'text-muted-foreground'
                  : 'text-gray-600'
              }`}>
                {getParticipantsText(event.participants)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayView;
