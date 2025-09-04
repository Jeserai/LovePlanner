import { useState, useEffect, useCallback } from 'react';
import { eventService, type SimplifiedEvent } from '../../services/eventService';
import { userService } from '../../services/userService';
import { globalEventService, GlobalEvents } from '../../services/globalEventService';
import type { Event } from '../../types/event';
import { convertUTCToUserTime, convertUserTimeToUTC } from '../../utils/timezoneService';
import { addDays, addWeeks, addMonths, addYears, format, parseISO, isBefore, isAfter } from 'date-fns';

// 🔧 重复事件展开函数
const expandRecurringEvent = (dbEvent: SimplifiedEvent): SimplifiedEvent[] => {
  if (!dbEvent.is_recurring || !dbEvent.start_datetime || !dbEvent.recurrence_type) {
    return [dbEvent];
  }

  const instances: SimplifiedEvent[] = [];
  const startDate = parseISO(dbEvent.start_datetime);
  const endDate = dbEvent.recurrence_end ? parseISO(dbEvent.recurrence_end) : addMonths(startDate, 6); // 默认展开6个月
  
  // 🔧 获取排除的日期列表
  const excludedDates = new Set(dbEvent.excluded_dates || []);
  
  // 🔧 获取修改的实例数据
  const modifiedInstances = dbEvent.modified_instances || {};
  
  let currentDate = startDate;
  let instanceCount = 0;
  const maxInstances = 100; // 防止无限循环

  while ((isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) && instanceCount < maxInstances) {
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    
    // 🔧 跳过被排除的日期
    if (excludedDates.has(currentDateStr)) {
      console.log('⏭️ 跳过被排除的日期:', currentDateStr);
      // 继续到下一个日期
      switch (dbEvent.recurrence_type) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
        default:
          return instances;
      }
      instanceCount++;
      continue;
    }

    // 计算这个实例的时间
    let instanceStartTime = currentDate.toISOString();
    const originalEnd = dbEvent.end_datetime ? parseISO(dbEvent.end_datetime) : addDays(currentDate, 1);
    const duration = originalEnd.getTime() - startDate.getTime();
    let instanceEndTime = new Date(currentDate.getTime() + duration).toISOString();

    // 🔧 检查是否有修改的实例数据
    let instanceData = { ...dbEvent };
    if (modifiedInstances[currentDateStr]) {
      const modifications = modifiedInstances[currentDateStr];
      console.log('🔧 应用修改的实例数据:', { date: currentDateStr, modifications });
      
      // 应用修改的数据
      instanceData = { ...instanceData, ...modifications };
      
      // 如果修改了时间，重新计算
      if (modifications.start_datetime) {
        instanceStartTime = modifications.start_datetime;
      }
      if (modifications.end_datetime) {
        instanceEndTime = modifications.end_datetime;
      }
    }

    // 创建实例
    const instance = {
      ...instanceData,
      id: instanceCount === 0 ? dbEvent.id : `${dbEvent.id}-${currentDateStr}`,
      start_datetime: instanceStartTime,
      end_datetime: instanceEndTime,
      original_date: format(startDate, 'yyyy-MM-dd')
    };

    instances.push(instance);

    // 计算下一个实例的日期
    switch (dbEvent.recurrence_type) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, 1);
        break;
      default:
        return instances; // 不支持的重复类型
    }

    instanceCount++;
  }

  console.log('🔄 重复事件展开:', {
    原始事件: dbEvent.title,
    重复类型: dbEvent.recurrence_type,
    生成实例数: instances.length,
    排除日期数: excludedDates.size,
    修改实例数: Object.keys(modifiedInstances).length,
    开始日期: format(startDate, 'yyyy-MM-dd'),
    结束日期: format(endDate, 'yyyy-MM-dd')
  });

  return instances;
};

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
      // 🔧 从start_datetime计算本地日期，避免event_date的时区混淆
      date: dbEvent.start_datetime 
        ? convertUTCToUserTime(dbEvent.start_datetime).split(' ')[0] || convertUTCToUserTime(dbEvent.start_datetime).split('T')[0]
        : new Date().toISOString().split('T')[0], // 全天事件使用当前日期
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
    
    // 🔧 从start_datetime计算本地日期
    const localDate = dbEvent.start_datetime 
      ? convertUTCToUserTime(dbEvent.start_datetime).split(' ')[0] || convertUTCToUserTime(dbEvent.start_datetime).split('T')[0]
      : new Date().toISOString().split('T')[0];

    // 🔇 隐藏事件转换调试信息
    
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description || undefined,
      date: localDate,
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
      console.log('🚀 开始初始化事件数据:', { user: user?.id, userEmail: user?.email });
      
      if (!user?.id) {
        console.log('❌ 用户ID不存在，跳过初始化');
        setLoading(false);
        return;
      }

      try {
        // 获取情侣关系
        console.log('🔍 获取情侣关系...');
        const coupleRelation = await userService.getCoupleRelation(user.id);
        console.log('💑 情侣关系结果:', coupleRelation);
        
        if (!coupleRelation) {
          console.log('❌ 未找到情侣关系');
          setLoading(false);
          return;
        }

        setCoupleId(coupleRelation.id);

        // 获取情侣用户信息
        console.log('👥 获取情侣用户信息...');
        const users = await userService.getCoupleUsers(coupleRelation.id);
        console.log('👥 情侣用户结果:', users);
        
        if (users.length >= 2) {
          const coupleUsersData = {
            user1: users[0],
            user2: users[1]
          };
          console.log('📝 准备设置coupleUsers状态:', coupleUsersData);
          setCoupleUsers(coupleUsersData);
          console.log('✅ coupleUsers状态已设置');

          // 🔧 修复：在设置coupleUsers后再转换事件
          const dbEvents = await eventService.getCoupleEvents(coupleRelation.id);
          console.log('🔍 数据库原始事件数据:', dbEvents);
          
          // 🔧 展开重复事件为多个实例
          const expandedEvents: SimplifiedEvent[] = [];
          for (const dbEvent of dbEvents) {
            const instances = expandRecurringEvent(dbEvent);
            expandedEvents.push(...instances);
          }
          
          console.log('📅 初始化事件展开结果:', {
            原始事件数: dbEvents.length,
            展开后事件数: expandedEvents.length,
            重复事件: dbEvents.filter(e => e.is_recurring).map(e => ({ title: e.title, type: e.recurrence_type }))
          });
          
          // 使用本地coupleUsers数据进行转换
          const convertedEvents = expandedEvents.map(dbEvent => {
            const participants: string[] = [];
            if (dbEvent.includes_user1) participants.push(coupleUsersData.user1.id);
            if (dbEvent.includes_user2) participants.push(coupleUsersData.user2.id);
            
            // 🔧 修复：确保日期格式为ISO格式（YYYY-MM-DD）
            let localDate: string;
            if (dbEvent.start_datetime) {
              const convertedTime = convertUTCToUserTime(dbEvent.start_datetime);
              // convertUTCToUserTime返回 "2025/09/06 04:00:00" 格式
              const datePart = convertedTime.split(' ')[0]; // "2025/09/06"
              // 转换为ISO格式
              localDate = datePart.replace(/\//g, '-'); // "2025-09-06"
              console.log('🔧 日期格式转换:', {
                原始UTC: dbEvent.start_datetime,
                转换后: convertedTime,
                提取日期: datePart,
                ISO日期: localDate
              });
            } else {
              localDate = new Date().toISOString().split('T')[0];
            }
            
            const timeDisplay = formatTimeFromDatetime(dbEvent.start_datetime, dbEvent.end_datetime);
            
            console.log('🔧 事件参与者转换:', {
            事件: dbEvent.title,
            includes_user1: dbEvent.includes_user1,
            includes_user2: dbEvent.includes_user2,
            参与者数组: participants,
            user1_id: coupleUsersData.user1.id,
            user2_id: coupleUsersData.user2.id
          });
            
            return {
              id: dbEvent.id,
              title: dbEvent.title,
              description: dbEvent.description || undefined,
              date: localDate,
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
                try {
                  const timePart = converted.split(' ')[1] || converted.split('T')[1];
                  return timePart ? timePart.split('.')[0] : undefined;
                } catch (e) {
                  return undefined;
                }
              })() : undefined,
              rawEndTime: dbEvent.end_datetime ? (() => {
                const converted = convertUTCToUserTime(dbEvent.end_datetime);
                try {
                  const timePart = converted.split(' ')[1] || converted.split('T')[1];
                  return timePart ? timePart.split('.')[0] : undefined;
                } catch (e) {
                  return undefined;
                }
              })() : undefined
            };
          });
          
          console.log('✅ 转换后的事件数据:', convertedEvents);
          console.log('📝 准备设置events状态...');
          setEvents(convertedEvents);
          console.log('✅ events状态已设置');
        }
      } catch (error) {
        console.error('❌ 初始化事件数据失败:', error);
        console.error('❌ 错误详情:', {
          message: error instanceof Error ? error.message : '未知错误',
          stack: error instanceof Error ? error.stack : undefined,
          userId: user?.id
        });
      } finally {
        console.log('🏁 初始化完成，设置loading=false');
        setLoading(false);
      }
    };

    initializeData();
  }, [user?.id]); // 🔧 移除convertSimplifiedEventToEvent依赖，避免循环

  // 加载事件数据
  const loadEvents = useCallback(async () => {
    if (!coupleId || !coupleUsers) {
      setEvents([]);
      return;
    }

    try {
      const dbEvents = await eventService.getCoupleEvents(coupleId);
      
      // 🔧 展开重复事件为多个实例
      const expandedEvents: SimplifiedEvent[] = [];
      for (const dbEvent of dbEvents) {
        const instances = expandRecurringEvent(dbEvent);
        expandedEvents.push(...instances);
      }
      
      console.log('📅 事件展开结果:', {
        原始事件数: dbEvents.length,
        展开后事件数: expandedEvents.length,
        重复事件: dbEvents.filter(e => e.is_recurring).map(e => ({ title: e.title, type: e.recurrence_type }))
      });
      
      // 🔧 使用本地coupleUsers数据进行转换，避免竞态条件
      const convertedEvents = expandedEvents.map(dbEvent => {
        const participants: string[] = [];
        if (dbEvent.includes_user1) participants.push(coupleUsers.user1.id);
        if (dbEvent.includes_user2) participants.push(coupleUsers.user2.id);
        
        // 🔧 修复：确保日期格式为ISO格式（YYYY-MM-DD）
        let localDate: string;
        if (dbEvent.start_datetime) {
          const convertedTime = convertUTCToUserTime(dbEvent.start_datetime);
          const datePart = convertedTime.split(' ')[0]; // "2025/09/06"
          localDate = datePart.replace(/\//g, '-'); // "2025-09-06"
        } else {
          localDate = new Date().toISOString().split('T')[0];
        }
        
        const timeDisplay = formatTimeFromDatetime(dbEvent.start_datetime, dbEvent.end_datetime);
        
        return {
          id: dbEvent.id,
          title: dbEvent.title,
          description: dbEvent.description || undefined,
          date: localDate,
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
            try {
              const timePart = converted.split(' ')[1] || converted.split('T')[1];
              return timePart ? timePart.split('.')[0] : undefined;
            } catch (e) {
              return undefined;
            }
          })() : undefined,
          rawEndTime: dbEvent.end_datetime ? (() => {
            const converted = convertUTCToUserTime(dbEvent.end_datetime);
            try {
              const timePart = converted.split(' ')[1] || converted.split('T')[1];
              return timePart ? timePart.split('.')[0] : undefined;
            } catch (e) {
              return undefined;
            }
          })() : undefined
        };
      });
      
      setEvents(convertedEvents);
      // 🔇 隐藏事件加载调试信息
    } catch (error) {
      console.error('加载事件失败:', error);
      setEvents([]);
    }
  }, [coupleId, coupleUsers, getEventColor, formatTimeFromDatetime]);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (coupleId && coupleUsers) {
        await loadEvents();
      }
    } catch (error) {
      console.error('🔄 Calendar 手动刷新失败:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [coupleId, coupleUsers, loadEvents]);

  // 创建事件更新处理函数 - 直接实现，避免依赖循环
  const handleEventsUpdated = useCallback(async () => {
    if (!coupleId || !coupleUsers) {
      return;
    }

    try {
      const dbEvents = await eventService.getCoupleEvents(coupleId);
      
      // 🔧 展开重复事件为多个实例
      const expandedEvents: SimplifiedEvent[] = [];
      for (const dbEvent of dbEvents) {
        const instances = expandRecurringEvent(dbEvent);
        expandedEvents.push(...instances);
      }
      
      // 直接转换，避免依赖loadEvents
      const convertedEvents = expandedEvents.map(dbEvent => {
        const participants: string[] = [];
        if (dbEvent.includes_user1) participants.push(coupleUsers.user1.id);
        if (dbEvent.includes_user2) participants.push(coupleUsers.user2.id);
        
        // 🔧 修复：确保日期格式为ISO格式（YYYY-MM-DD）
        let localDate: string;
        if (dbEvent.start_datetime) {
          const convertedTime = convertUTCToUserTime(dbEvent.start_datetime);
          const datePart = convertedTime.split(' ')[0]; // "2025/09/06"
          localDate = datePart.replace(/\//g, '-'); // "2025-09-06"
        } else {
          localDate = new Date().toISOString().split('T')[0];
        }
        
        const timeDisplay = formatTimeFromDatetime(dbEvent.start_datetime, dbEvent.end_datetime);
        
        return {
          id: dbEvent.id,
          title: dbEvent.title,
          description: dbEvent.description || undefined,
          date: localDate,
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
            try {
              const timePart = converted.split(' ')[1] || converted.split('T')[1];
              return timePart ? timePart.split('.')[0] : undefined;
            } catch (e) {
              return undefined;
            }
          })() : undefined,
          rawEndTime: dbEvent.end_datetime ? (() => {
            const converted = convertUTCToUserTime(dbEvent.end_datetime);
            try {
              const timePart = converted.split(' ')[1] || converted.split('T')[1];
              return timePart ? timePart.split('.')[0] : undefined;
            } catch (e) {
              return undefined;
            }
          })() : undefined
        };
      });
      
      setEvents(convertedEvents);
    } catch (error) {
      console.error('全局事件更新失败:', error);
    }
  }, [coupleId, coupleUsers, getEventColor, formatTimeFromDatetime]);

  // 监听全局事件更新
  useEffect(() => {
    const unsubscribeEvents = globalEventService.subscribe(GlobalEvents.EVENTS_UPDATED, handleEventsUpdated);

    return () => {
      if (unsubscribeEvents) {
        unsubscribeEvents();
      }
    };
  }, [handleEventsUpdated]);

  console.log('📤 useEventData返回状态:', {
    events数量: events.length,
    loading,
    coupleId: !!coupleId,
    coupleUsers存在: !!coupleUsers,
    isRefreshing
  });

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
