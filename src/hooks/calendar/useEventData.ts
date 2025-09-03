import { useState, useEffect, useCallback } from 'react';
import { eventService, type SimplifiedEvent } from '../../services/eventService';
import { userService } from '../../services/userService';
import { globalEventService, GlobalEvents } from '../../services/globalEventService';
import type { Event } from '../../types/event';
import { convertUTCToUserTime } from '../../utils/timezoneService';

// 🎯 事件数据管理Hook
export const useEventData = (user: any) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleUsers, setCoupleUsers] = useState<{user1: any, user2: any} | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔧 数据转换函数 - 从数据库事件转换为前端事件
  const convertSimplifiedEventToEvent = useCallback((dbEvent: SimplifiedEvent & { excluded_dates?: string[]; modified_instances?: Record<string, any> }): Event & { excludedDates?: string[]; modifiedInstances?: Record<string, any>; rawStartTime?: string; rawEndTime?: string } => {
    const participants: string[] = [];
    
    if (!coupleUsers) {
      return {
        id: dbEvent.id,
        title: dbEvent.title,
        description: dbEvent.description || undefined,
        date: dbEvent.event_date,
        time: dbEvent.start_datetime ? formatTimeFromDatetime(dbEvent.start_datetime, dbEvent.end_datetime) : undefined,
        location: dbEvent.location || undefined,
        participants: [],
        color: 'bg-gray-400',
        isRecurring: dbEvent.is_recurring,
        recurrenceType: dbEvent.recurrence_type || undefined,
        recurrenceEnd: dbEvent.recurrence_end || undefined,
        originalDate: dbEvent.original_date || undefined,
        isAllDay: dbEvent.is_all_day || false,
        createdBy: dbEvent.created_by || undefined,
        createdAt: dbEvent.created_at || undefined,
        excludedDates: dbEvent.excluded_dates || undefined,
        modifiedInstances: dbEvent.modified_instances || undefined,
        rawStartTime: dbEvent.start_datetime ? (() => {
          const converted = convertUTCToUserTime(dbEvent.start_datetime);
          if (process.env.NODE_ENV === 'development' && (!converted || converted === 'Invalid Date')) {
            console.warn('🚨 时间转换失败:', {
              eventId: dbEvent.id,
              start_datetime: dbEvent.start_datetime,
              converted: converted
            });
          }
          return converted === 'Invalid Date' ? undefined : converted;
        })() : undefined,
        rawEndTime: dbEvent.end_datetime ? (() => {
          const converted = convertUTCToUserTime(dbEvent.end_datetime);
          return converted === 'Invalid Date' ? undefined : converted;
        })() : undefined
      };
    }
    
    // 使用真实用户ID
    if (dbEvent.includes_user1) participants.push(coupleUsers.user1.id);
    if (dbEvent.includes_user2) participants.push(coupleUsers.user2.id);
    
    // 🔧 时区修复：使用新的datetime字段构建时间显示
    const timeDisplay = formatTimeFromDatetime(dbEvent.start_datetime, dbEvent.end_datetime);
    
    // 🐛 调试：事件转换信息
    if (process.env.NODE_ENV === 'development' && dbEvent.start_datetime) {
      console.log('📅 事件数据转换:', {
        事件标题: dbEvent.title,
        事件日期: dbEvent.event_date,
        UTC开始时间: dbEvent.start_datetime,
        UTC结束时间: dbEvent.end_datetime,
        构建的时间显示: timeDisplay,
        参与者1: dbEvent.includes_user1,
        参与者2: dbEvent.includes_user2,
        参与者数组: participants
      });
    }
    
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description || undefined,
      date: dbEvent.event_date,
      time: timeDisplay,
      location: dbEvent.location || undefined,
      participants: participants,
      color: getEventColor(participants),
      isRecurring: dbEvent.is_recurring,
      recurrenceType: dbEvent.recurrence_type || undefined,
      recurrenceEnd: dbEvent.recurrence_end || undefined,
      originalDate: dbEvent.original_date || undefined,
      isAllDay: dbEvent.is_all_day || false,
      createdBy: dbEvent.created_by || undefined,
      createdAt: dbEvent.created_at || undefined,
      excludedDates: dbEvent.excluded_dates || undefined,
      modifiedInstances: dbEvent.modified_instances || undefined,
              rawStartTime: dbEvent.start_datetime ? (() => {
          const converted = convertUTCToUserTime(dbEvent.start_datetime);
          if (process.env.NODE_ENV === 'development' && (!converted || converted === 'Invalid Date')) {
            console.warn('🚨 开始时间转换失败:', {
              eventId: dbEvent.id,
              start_datetime: dbEvent.start_datetime,
              converted: converted
            });
            return undefined;
          }
          // 只提取时间部分 HH:MM:SS
          try {
            const timePart = converted.split(' ')[1] || converted.split('T')[1];
            return timePart ? timePart.split('.')[0] : undefined;
          } catch (e) {
            console.error('提取时间部分失败:', e);
            return undefined;
          }
        })() : undefined,
        rawEndTime: dbEvent.end_datetime ? (() => {
          const converted = convertUTCToUserTime(dbEvent.end_datetime);
          if (!converted || converted === 'Invalid Date') return undefined;
          // 只提取时间部分 HH:MM:SS
          try {
            const timePart = converted.split(' ')[1] || converted.split('T')[1];
            return timePart ? timePart.split('.')[0] : undefined;
          } catch (e) {
            console.error('提取结束时间部分失败:', e);
            return undefined;
          }
        })() : undefined
    };
  }, [coupleUsers]);

  // 时间格式化函数
  const formatTimeFromDatetime = useCallback((startDatetime?: string | null, endDatetime?: string | null): string => {
    if (!startDatetime) return '全天';
    
    try {
      // 直接使用UTC时间字符串，不需要提取日期
      const startTime = convertUTCToUserTime(startDatetime);
      const endTime = endDatetime ? convertUTCToUserTime(endDatetime) : null;
      
      if (endTime && endTime !== startTime) {
        return `${startTime} - ${endTime}`;
      }
      return startTime;
    } catch (error) {
      console.error('时间格式化失败:', error);
      return '时间格式错误';
    }
  }, []);

  // 获取事件颜色
  const getEventColor = useCallback((participants: string[]): string => {
    if (!coupleUsers || !user) return 'bg-gray-400';
    
    const isMyEvent = participants.includes(user.id);
    const isPartnerEvent = participants.length === 1 && !isMyEvent;
    const isSharedEvent = participants.length === 2;
    
    if (isSharedEvent) return 'bg-purple-400';
    if (isMyEvent) return 'bg-blue-400';
    if (isPartnerEvent) return 'bg-pink-400';
    
    return 'bg-gray-400';
  }, [coupleUsers, user]);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // 获取情侣关系
        const coupleRelation = await userService.getCoupleRelation(user.id);
        if (!coupleRelation) {
          setLoading(false);
          return;
        }

        setCoupleId(coupleRelation.id);

        // 获取情侣用户信息
        const users = await userService.getCoupleUsers(coupleRelation.id);
        if (users.length >= 2) {
          setCoupleUsers({
            user1: users[0],
            user2: users[1]
          });
        }

        // 获取事件数据
        const dbEvents = await eventService.getCoupleEvents(coupleRelation.id);
        const convertedEvents = dbEvents.map(convertSimplifiedEventToEvent);
        setEvents(convertedEvents);
      } catch (error) {
        console.error('初始化事件数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [user?.id, convertSimplifiedEventToEvent]);

  // 加载事件数据
  const loadEvents = useCallback(async () => {
    if (!coupleId || !coupleUsers) {
      setEvents([]);
      return;
    }

    try {
      console.log('🔄 开始加载事件数据...');
      const dbEvents = await eventService.getCoupleEvents(coupleId);
      console.log('📋 从数据库获取的原始事件:', dbEvents);
      
      const convertedEvents = dbEvents.map(convertSimplifiedEventToEvent);
      console.log('✅ 转换后的事件:', convertedEvents);
      
      setEvents(convertedEvents);
      console.log('🎯 事件数据已设置到状态');
    } catch (error) {
      console.error('加载事件失败:', error);
      setEvents([]);
    }
  }, [coupleId, coupleUsers, convertSimplifiedEventToEvent]);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (coupleId && coupleUsers) {
        const dbEvents = await eventService.getCoupleEvents(coupleId);
        const convertedEvents = dbEvents.map(convertSimplifiedEventToEvent);
        setEvents(convertedEvents);
      }
    } catch (error) {
      console.error('🔄 Calendar 手动刷新失败:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [coupleId, coupleUsers, convertSimplifiedEventToEvent]);

  // 创建事件更新处理函数
  const handleEventsUpdated = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  // 监听全局事件更新
  useEffect(() => {
    const unsubscribeEvents = globalEventService.subscribe(GlobalEvents.EVENTS_UPDATED, handleEventsUpdated);

    return () => {
      if (unsubscribeEvents) {
        unsubscribeEvents();
      }
    };
  }, [handleEventsUpdated]);

  return {
    events,
    setEvents,
    loading,
    coupleId,
    coupleUsers,
    isRefreshing,
    handleRefresh,
    loadEvents,
    convertSimplifiedEventToEvent,
    formatTimeFromDatetime,
    getEventColor
  };
};
