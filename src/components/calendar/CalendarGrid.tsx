import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Event } from '../../types/event';

interface CalendarGridProps {
  calendarData: {
    days: (number | null)[];
    rowsNeeded: number;
    spacingClass: string;
    today: Date;
    isWeekView?: boolean;
    weekStartDate?: Date;
  };
  dayNames: string[];
  events: Event[];
  currentView: 'my' | 'partner' | 'shared';
  user: any;
  coupleUsers: {user1: any, user2: any} | null;
  isToday: (day: number) => boolean;
  isSelectedDate: (day: number) => boolean;
  getDateString: (day: number) => string;
  getEventsForDay: (day: number) => Event[];
  onDayClick: (day: number) => void;
  onEventClick: (event: Event) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarData,
  dayNames,
  events,
  currentView,
  user,
  coupleUsers,
  isToday,
  isSelectedDate,
  getDateString,
  getEventsForDay,
  onDayClick,
  onEventClick
}) => {
  const { theme } = useTheme();
  const { days, rowsNeeded, spacingClass } = calendarData;

  // 获取过滤后的事件
  const getFilteredEvents = (allEvents: Event[]): Event[] => {
    if (!user || !coupleUsers) return [];

    const currentUserId = user.id;
    const partnerIdForFiltering = coupleUsers.user1.id === currentUserId 
      ? coupleUsers.user2.id 
      : coupleUsers.user1.id;

    let filteredEvents: Event[] = [];
    
    switch (currentView) {
      case 'my':
        filteredEvents = allEvents.filter(event => {
          return event.participants.includes(currentUserId) && 
                 !event.participants.includes(partnerIdForFiltering);
        });
        break;
      case 'partner':
        filteredEvents = allEvents.filter(event => event.participants.includes(partnerIdForFiltering));
        break;
      case 'shared':
        filteredEvents = allEvents.filter(event =>
          event.participants.includes(currentUserId) && 
          event.participants.includes(partnerIdForFiltering)
        );
        break;
      default:
        filteredEvents = allEvents;
    }

    return filteredEvents;
  };

  const getDayEvents = (day: number, dayIndex?: number) => {
    const allEvents = events;
    const filteredEvents = getFilteredEvents(allEvents);
    
    let dayStr: string;
    if (calendarData.isWeekView && calendarData.weekStartDate && dayIndex !== undefined) {
      // 周视图：根据周开始日期和索引计算实际日期
      const actualDate = new Date(calendarData.weekStartDate);
      actualDate.setDate(calendarData.weekStartDate.getDate() + dayIndex);
      dayStr = actualDate.toISOString().split('T')[0];
    } else {
      // 月视图：使用原有逻辑
      dayStr = getDateString(day);
    }
    
    return filteredEvents.filter(event => event.date === dayStr);
  };

  return (
    <div className={`grid grid-cols-7 gap-1 ${spacingClass}`}>
      {/* 星期标题 */}
      {dayNames.map((day) => (
        <div
          key={day}
          className={`text-center text-sm font-medium py-2 ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono border-b border-pixel-border' 
              : theme === 'modern'
              ? 'text-muted-foreground border-b'
              : 'text-gray-600 border-b border-gray-200'
          }`}
        >
          {day}
        </div>
      ))}

      {/* 日期网格 */}
      {days.map((day, index) => {
        if (day === null) {
          return <div key={index} className="h-24"></div>;
        }

        const dayEvents = getDayEvents(day, index);
        
        // 周视图和月视图的今天判断逻辑
        let isCurrentDay: boolean;
        let isSelected: boolean;
        
        if (calendarData.isWeekView && calendarData.weekStartDate) {
          // 周视图：基于实际日期判断
          const actualDate = new Date(calendarData.weekStartDate);
          actualDate.setDate(calendarData.weekStartDate.getDate() + index);
          const today = new Date();
          isCurrentDay = actualDate.toDateString() === today.toDateString();
          
          // 对于周视图，需要使用实际日期的日来调用isSelectedDate函数
          const actualDay = actualDate.getDate();
          isSelected = isSelectedDate(actualDay);
        } else {
          // 月视图：使用原有逻辑
          isCurrentDay = isToday(day);
          isSelected = isSelectedDate(day);
        }

        return (
          <div
            key={day}
            className={`h-24 border cursor-pointer transition-colors relative ${
              theme === 'pixel'
                ? `border-pixel-border hover:bg-pixel-surface ${
                    isCurrentDay 
                      ? 'bg-pixel-accent text-pixel-bg font-bold' 
                      : isSelected 
                      ? 'bg-pixel-surface' 
                      : 'bg-pixel-bg hover:bg-pixel-surface'
                  }`
                : theme === 'modern'
                ? `border-border hover:bg-muted/50 ${
                    isCurrentDay 
                      ? 'bg-primary text-primary-foreground font-semibold' 
                      : isSelected 
                      ? 'bg-muted' 
                      : 'bg-background hover:bg-muted/50'
                  }`
                : `border-gray-200 hover:bg-gray-50 ${
                    isCurrentDay 
                      ? 'bg-blue-500 text-white font-semibold' 
                      : isSelected 
                      ? 'bg-gray-100' 
                      : 'bg-white hover:bg-gray-50'
                  }`
            }`}
            onClick={() => {
              if (calendarData.isWeekView && calendarData.weekStartDate) {
                // 周视图：计算实际日期并传递
                const actualDate = new Date(calendarData.weekStartDate);
                actualDate.setDate(calendarData.weekStartDate.getDate() + index);
                const actualDay = actualDate.getDate();
                onDayClick(actualDay);
              } else {
                // 月视图：使用原有逻辑
                onDayClick(day);
              }
            }}
          >
            {/* 日期数字 */}
            <div className={`text-sm p-1 ${
              theme === 'pixel' 
                ? 'font-mono' 
                : ''
            }`}>
              {day}
            </div>

            {/* 事件显示 */}
            <div className="px-1 space-y-1 overflow-hidden">
              {dayEvents.slice(0, 2).map(event => {
                const eventIncludesUser = event.participants.includes(user?.id);
                const eventIncludesPartner = coupleUsers && event.participants.includes(
                  coupleUsers.user1.id === user?.id ? coupleUsers.user2.id : coupleUsers.user1.id
                );
                const isJointEvent = eventIncludesUser && eventIncludesPartner;

                return (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded cursor-pointer truncate transition-colors ${
                      theme === 'pixel'
                        ? `border border-pixel-border font-mono ${
                            isJointEvent 
                              ? 'bg-pixel-accent text-pixel-bg' 
                              : eventIncludesUser 
                              ? 'bg-blue-400 text-white' 
                              : 'bg-pink-400 text-white'
                          }`
                        : theme === 'modern'
                        ? `${
                            isJointEvent 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : eventIncludesUser 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-pink-100 text-pink-800 border border-pink-200'
                          }`
                        : `${
                            isJointEvent 
                              ? 'bg-purple-100 text-purple-800' 
                              : eventIncludesUser 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`
                    } hover:opacity-80`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={`${event.time ? event.time + ' - ' : ''}${event.title}${event.isRecurring ? ` (重复)` : ''}\n参与者: ${getParticipantsText(event.participants)}\n点击查看详情`}
                  >
                    {event.title}
                  </div>
                );
              })}
              
              {dayEvents.length > 2 && (
                <div className={`text-xs text-center ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : theme === 'modern'
                    ? 'text-muted-foreground'
                    : 'text-gray-500'
                }`}>
                  +{dayEvents.length - 2} 更多
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // 获取参与者文本的辅助函数
  function getParticipantsText(participants: string[]): string {
    if (!coupleUsers || !user) return '未知参与者';
    
    const names = participants.map(p => {
      if (p === user.id) return '我';
      if (p === coupleUsers.user1.id) return coupleUsers.user1.display_name;
      if (p === coupleUsers.user2.id) return coupleUsers.user2.display_name;
      return '未知参与者';
    });
    
    return names.join(', ');
  }
};

export default CalendarGrid;
