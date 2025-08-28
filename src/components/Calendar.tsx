import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, UserIcon, ArrowPathIcon, PencilIcon, TrashIcon, XMarkIcon, ClockIcon, CalendarDaysIcon, HeartIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import Button from './ui/Button';
import NavigationButton from './ui/NavigationButton';
import LoadingSpinner from './ui/LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';
import { format, subMonths, addMonths, isSameDay, isSameMonth } from 'date-fns';
import { userService, taskService } from '../services/database';
import { simplifiedEventService, type SimplifiedEvent } from '../services/simplifiedEventService';
import { minimalColorService, type CoupleColors } from '../services/minimalColorService';
import { useAuth } from '../hooks/useAuth';
import { globalEventService, GlobalEvents } from '../services/globalEventService';

// 前端展示用的Event接口
interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  participants: string[]; // 参与者用户ID数组
  color: string;
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  recurrenceEnd?: string; // 结束日期
  originalDate?: string; // 原始日期（用于重复事件）
}





interface CalendarProps {
  currentUser?: string | null;
}

const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth(); // 获取认证用户信息
  

  
  // 添加日历导航状态
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // 添加选中日期状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // 数据库相关状态
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 手动刷新功能
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 强制刷新状态，用于触发重新渲染
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // 用户类型定义
  type UserView = 'my' | 'partner' | 'shared';
  
  // 用户信息状态
  const [coupleUsers, setCoupleUsers] = useState<{user1: any, user2: any} | null>(null);
  const [currentUserIsUser1, setCurrentUserIsUser1] = useState<boolean | null>(null);
  
  // 颜色配置状态
  const [coupleColors, setCoupleColors] = useState<CoupleColors | null>(null);
  
  // 添加视图状态 - 初始化为shared，等用户信息加载完成后更新
  const [currentView, setCurrentView] = useState<UserView>('shared');
  
  // 获取视图显示名称
  const getViewDisplayName = (view: UserView): string => {
    switch (view) {
      case 'my':
        return theme === 'pixel' ? 'MY_CALENDAR' : '我的日历';
      case 'partner':
        return theme === 'pixel' ? 'PARTNER_CALENDAR' : '伴侣日历';
      case 'shared':
        return theme === 'pixel' ? 'SHARED_CALENDAR' : '共同日历';
      default:
        return '';
    }
  };

  // 获取实际的数据库视图（将逻辑视图转换为物理视图）
  const getActualView = (logicalView: UserView): 'user1' | 'user2' | 'shared' => {
    if (logicalView === 'shared') return 'shared';
    if (currentUserIsUser1 === null) return 'user1'; // 默认
    
    if (logicalView === 'my') {
      return currentUserIsUser1 ? 'user1' : 'user2';
    } else { // partner
      return currentUserIsUser1 ? 'user2' : 'user1';
    }
  };
  
  // 监听用户身份确定后，自动设置为"我的日历"视图
  useEffect(() => {
    if (currentUserIsUser1 !== null && user) {
      console.log('📅 设置默认视图为"我的日历":', { 
        currentUserIsUser1, 
        userId: user.id 
      });
      setCurrentView('my'); // 总是默认显示"我的日历"
    }
  }, [currentUserIsUser1, user]);

  // 生成重复性任务的日历事件
  const generateRecurringTaskEvents = (task: any, participants: string[], color: string): Event[] => {
    const events: Event[] = [];
    
    if (!task.start_date || !task.end_date || !task.repeat_frequency) {
      console.log('⚠️ 重复性任务缺少必要信息:', task.title);
      return events;
    }
    
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    const currentDate = new Date(startDate);
    
    // 确保不超过合理的事件数量限制（避免无限循环）
    const maxEvents = 365; // 最多一年的事件
    let eventCount = 0;
    
    // 如果有指定工作日，使用特殊逻辑
    if (task.repeat_weekdays && task.repeat_weekdays.length > 0) {
      // 为每个指定的工作日生成事件
      while (currentDate <= endDate && eventCount < maxEvents) {
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ...
        
        if (task.repeat_weekdays.includes(dayOfWeek)) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          
          const taskEvent: Event = {
            id: `task-${task.id}-${dateStr}`,
            title: `📋 ${task.title}`,
            date: dateStr,
            time: task.repeat_time || undefined,
            participants,
            color,
            isRecurring: true,
            recurrenceType: task.repeat_frequency,
            originalDate: task.start_date
          };
          
          events.push(taskEvent);
          eventCount++;
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // 常规重复频率逻辑
      while (currentDate <= endDate && eventCount < maxEvents) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        
        const taskEvent: Event = {
          id: `task-${task.id}-${dateStr}`,
          title: `📋 ${task.title}`,
          date: dateStr,
          time: task.repeat_time || undefined,
          participants,
          color,
          isRecurring: true,
          recurrenceType: task.repeat_frequency,
          originalDate: task.start_date
        };
        
        events.push(taskEvent);
        eventCount++;
        
        // 根据重复频率移动到下一个日期
        switch (task.repeat_frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            console.warn('⚠️ 未知的重复频率:', task.repeat_frequency);
            currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    console.log(`🔄 为任务 "${task.title}" 生成了 ${events.length} 个重复事件`);
    return events;
  };

  // 同步任务到日历显示
  const syncTasksToCalendar = async () => {
    console.log('🔄 syncTasksToCalendar 被调用, 状态:', { coupleId, user: !!user });
    if (!coupleId || !user) {
      console.log('⚠️ syncTasksToCalendar 条件不满足，跳过同步');
      return;
    }
    
    try {
      console.log('🔄 开始同步任务到日历');
      // 从数据库获取所有任务
      const dbTasks = await taskService.getCoupleTasksOld(coupleId);
      console.log('📊 获取到的数据库任务:', dbTasks);
      
      // 转换任务为日历事件
      const taskEvents: Event[] = [];
      
      dbTasks.forEach(task => {
        console.log('🔍 检查任务:', { 
          id: task.id, 
          title: task.title, 
          status: task.status, 
          assignee_id: task.assignee_id, 
          repeat_type: task.repeat_type,
          repeat_frequency: task.repeat_frequency,
          start_date: task.start_date,
          end_date: task.end_date,
          deadline: task.deadline 
        });
        
        // 只显示已分配或进行中的任务
        if (task.status === 'assigned' || task.status === 'in_progress') {
          const participants = task.assignee_id ? [task.assignee_id] : [];
          const taskColor = task.status === 'assigned' ? 'bg-yellow-400' : 'bg-blue-400';
          
          if (task.repeat_type === 'repeat' && task.start_date && task.end_date) {
            // 重复性任务：根据频率生成多个事件
            console.log('🔄 处理重复性任务:', task.title, {
              repeat_frequency: task.repeat_frequency,
              start_date: task.start_date,
              end_date: task.end_date,
              repeat_time: task.repeat_time,
              repeat_weekdays: task.repeat_weekdays
            });
            const events = generateRecurringTaskEvents(task, participants, taskColor);
            console.log(`🔄 生成的事件数量: ${events.length}，前几个日期:`, events.slice(0, 5).map(e => e.date));
            taskEvents.push(...events);
            
          } else if (task.repeat_type === 'once' && task.deadline) {
            // 一次性任务：只显示deadline
            console.log('📅 处理一次性任务:', task.title);
            const deadlineDate = new Date(task.deadline);
            const dateStr = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`;
            
            const taskEvent = {
              id: `task-${task.id}`,
              title: `📋 ${task.title}`,
              date: dateStr,
              time: task.repeat_time || undefined,
              participants,
              color: taskColor,
      isRecurring: false
            };
            
            console.log('✨ 创建一次性任务事件:', taskEvent);
            taskEvents.push(taskEvent);
            
          } else {
            console.log('⚠️ 任务缺少必要的日期信息，跳过:', { 
              title: task.title, 
              repeat_type: task.repeat_type,
              has_deadline: !!task.deadline,
              has_start_date: !!task.start_date,
              has_end_date: !!task.end_date
            });
          }
        } else {
          console.log('⚠️ 任务状态不符合条件，跳过:', { title: task.title, status: task.status });
        }
      });
      
      // 将任务事件存储到localStorage（用于Calendar的readTaskEvents函数）
      localStorage.setItem('calendarTaskEvents', JSON.stringify(taskEvents));
      
      console.log('✅ 任务同步到日历完成:', taskEvents.length, '个任务事件');
      console.log('💾 存储到localStorage的数据:', taskEvents);
      
      // 强制触发重新渲染，让getAllEvents重新读取localStorage中的任务事件
      setForceRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ 同步任务到日历失败:', error);
    }
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    if (isRefreshing || loading) return;
    
    setIsRefreshing(true);
    try {
      if (coupleId && coupleUsers) {
        const dbEvents = await simplifiedEventService.getCoupleEvents(coupleId);
        const convertedEvents = dbEvents.map(convertSimplifiedEventToEvent);
        setEvents(convertedEvents);
        console.log('🔄 Calendar 手动刷新完成');
      }
    } catch (error) {
      console.error('🔄 Calendar 手动刷新失败:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // 最少显示0.5秒刷新状态
    }
  };
  


  // 真实事件状态（根据数据模式使用不同数据源）
  const [events, setEvents] = useState<Event[]>([]);

  // 根据参与者生成颜色
  const getEventColor = (participants: string[]): string => {
    // 检查是否有用户信息
    if (!coupleUsers || !user) {
      return theme === 'pixel' ? 'bg-pixel-textMuted' : 'bg-sage-500';
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 检查参与者包含哪些用户
    const hasUser1 = eventIncludesUser({ participants } as Event, user1Id);
    const hasUser2 = eventIncludesUser({ participants } as Event, user2Id);
    

    
    // 像素风主题固定颜色分配：
    // - 共同事件: 紫色 (bg-pixel-purple)
    // - 用户1: 蓝色 (bg-pixel-info)
    // - 用户2: 霓虹粉色 (bg-pixel-accent)
    if (theme === 'pixel') {
      if (hasUser1 && hasUser2) {
        return 'bg-pixel-purple'; // 双方参与：像素风紫色
      } else if (hasUser1) {
        return 'bg-pixel-info'; // 用户1：像素风蓝色
      } else if (hasUser2) {
        return 'bg-pixel-accent'; // 用户2：像素风霓虹粉色
      }
      return 'bg-pixel-textMuted';
    }
    
    // 默认主题颜色
    if (hasUser1 && hasUser2) {
      return 'bg-purple-500'; // 双方参与：深紫色
    } else if (hasUser1) {
      return 'bg-blue-400'; // 用户1：蓝色
    } else if (hasUser2) {
      return 'bg-primary-400'; // 用户2：粉色
    }
    return 'bg-sage-500';
  };

  // 简化数据库事件转换为前端Event格式
  const convertSimplifiedEventToEvent = (dbEvent: SimplifiedEvent): Event => {
    const participants: string[] = [];
    
    if (!coupleUsers) {
      return {
        id: dbEvent.id,
        title: dbEvent.title,
        date: dbEvent.event_date,
        time: dbEvent.start_time || undefined,
        participants: [],
        color: 'bg-gray-400',
        isRecurring: dbEvent.is_recurring,
        recurrenceType: dbEvent.recurrence_type || undefined,
        recurrenceEnd: dbEvent.recurrence_end || undefined,
        originalDate: dbEvent.original_date || undefined
      };
    }
    
    // 使用真实用户ID
    if (dbEvent.includes_user1) participants.push(coupleUsers.user1.id);
    if (dbEvent.includes_user2) participants.push(coupleUsers.user2.id);
    
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      date: dbEvent.event_date,
      time: dbEvent.start_time || undefined,
      participants: participants,
      color: getEventColor(participants),
      isRecurring: dbEvent.is_recurring,
      recurrenceType: dbEvent.recurrence_type || undefined,
      recurrenceEnd: dbEvent.recurrence_end || undefined,
      originalDate: dbEvent.original_date || undefined
    };
  };

  // 前端Event转换为简化数据库格式的参数
  const convertEventToCreateParams = (event: Event, coupleId: string, createdBy: string): {
    coupleId: string;
    title: string;
    eventDate: string;
    createdBy: string;
    includesUser1: boolean;
    includesUser2: boolean;
    startTime?: string | null;
    endTime?: string | null;
    description?: string | null;
    isAllDay?: boolean;
    location?: string | null;
    isRecurring?: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
    recurrenceEnd?: string | null;
  } => {
    if (!coupleUsers) {
      throw new Error('用户信息未加载，无法创建事件');
    }
    
    // 根据用户ID判断参与者
    const includesUser1 = event.participants.includes(coupleUsers.user1.id);
    const includesUser2 = event.participants.includes(coupleUsers.user2.id);
    
    return {
      coupleId,
      title: event.title,
      eventDate: event.date,
      createdBy,
      includesUser1,
      includesUser2,
      startTime: event.time || null,
      endTime: null,
      description: null,
      isAllDay: !event.time,
      location: null,
      isRecurring: event.isRecurring,
      recurrenceType: event.recurrenceType || null,
      recurrenceEnd: event.recurrenceEnd || null
    };
  };



  // 加载情侣关系和用户信息
  useEffect(() => {
    const loadCoupleInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 获取情侣关系
        const coupleData = await userService.getCoupleRelation(user.id);
        
        if (coupleData) {
          setCoupleId(coupleData.id);
          
          // 获取情侣中的用户信息
          const users = await userService.getCoupleUsers(coupleData.id);
          
          if (users && users.length >= 1) {
            let user1, user2, isUser1;
            
            if (users.length === 2) {
              // 标准情况：两个用户
              // 需要确定当前登录用户在couples表中是user1还是user2
              const currentUserIsFirstInArray = users[0].id === user.id;
              const currentUserIsSecondInArray = users[1].id === user.id;
              
              if (currentUserIsFirstInArray) {
                // 当前用户是数组中的第一个，需要检查在couples表中的实际位置
                // users数组的顺序是按照couples表的user1_id, user2_id返回的
                isUser1 = true;
                setCurrentUserIsUser1(true);
                user1 = users[0]; // 当前用户
                user2 = users[1]; // 伴侣
                console.log('👤 用户身份确认:', { 
                  currentUserId: user.id, 
                  currentUser: users[0], 
                  isUser1: true,
                  displayName: users[0]?.display_name 
                });
              } else if (currentUserIsSecondInArray) {
                // 当前用户是数组中的第二个，在couples表中是user2
                isUser1 = false;
                setCurrentUserIsUser1(false);
                user1 = users[0]; // 伴侣 (在couples表中是user1)
                user2 = users[1]; // 当前用户 (在couples表中是user2)
                console.log('👤 用户身份确认:', { 
                  currentUserId: user.id, 
                  currentUser: users[1], 
                  isUser1: false,
                  displayName: users[1]?.display_name 
                });
              } else {
                // 异常情况：当前用户不在用户列表中
                return;
              }
            } else {
              // 单用户情况：创建虚拟第二用户
              const realUser = users[0];
              isUser1 = realUser.id === user.id;
              
              setCurrentUserIsUser1(isUser1);
              
              // 创建虚拟伴侣
              const virtualPartner = {
                id: 'virtual-partner-id',
                email: 'partner@virtual.com',
                display_name: '虚拟伴侣',
                birthday: '1990-01-01'
              };
              
              user1 = isUser1 ? realUser : virtualPartner;
              user2 = isUser1 ? virtualPartner : realUser;
            }
            
            setCoupleUsers({
              user1: user1,
              user2: user2
            });
            
            // 加载颜色配置
            const colors = await minimalColorService.getCoupleColors(coupleData.id);
            if (colors) {
              setCoupleColors(colors);
            } else {
              setCoupleColors(minimalColorService.getDefaultColors());
            }
          }
        }
      } catch (error) {
        console.error('加载情侣关系失败:', error);
      }
      
      // 添加最小加载时间，确保用户能看到加载状态
      setTimeout(() => {
        setLoading(false);
      }, 500); // 最少显示0.5秒加载状态
    };

    loadCoupleInfo();
  }, [user]);

  // 加载事件数据
  useEffect(() => {
    const loadEvents = async () => {
      if (!coupleId || !coupleUsers) {
        setEvents([]);
        return;
      }

      try {
        const dbEvents = await simplifiedEventService.getCoupleEvents(coupleId);
        const convertedEvents = dbEvents.map(convertSimplifiedEventToEvent);
        setEvents(convertedEvents);
      } catch (error) {
        console.error('加载事件失败:', error);
        setEvents([]);
      }
    };

    if (!loading) {
      loadEvents();
      // 同时同步任务到日历
      syncTasksToCalendar();
    }
  }, [coupleId, loading, coupleUsers]);

  // 创建稳定的回调函数，避免闭包陷阱
  const handleTasksUpdated = useCallback(() => {
    console.log('📋 Calendar 收到任务更新通知，准备同步任务到日历');
    console.log('📋 当前状态:', { coupleId, user: !!user, loading });
    // 只有在条件满足时才同步
    if (coupleId && user && !loading) {
      console.log('📋 条件满足，开始同步任务到日历');
      syncTasksToCalendar();
    } else {
      console.log('📋 条件不满足，跳过同步');
    }
  }, [coupleId, user, loading]);

  const handleEventsUpdated = useCallback(() => {
    console.log('📅 Calendar 收到事件更新通知（可能来自其他用户）');
    // 如果事件已经加载过，则自动刷新
    if (!loading && coupleId && coupleUsers) {
      handleRefresh();
    }
  }, [loading, coupleId, coupleUsers]);

  const handleUserProfileUpdated = useCallback(() => {
    console.log('👤 Calendar 收到用户资料更新通知');
    // 可能需要重新加载颜色配置
  }, []);

  // 订阅全局事件，响应其他组件的数据更新
  useEffect(() => {
    // 订阅任务更新（任务可能影响日历显示）
    const unsubscribeTasks = globalEventService.subscribe(GlobalEvents.TASKS_UPDATED, handleTasksUpdated);

    // 订阅事件数据更新（包括其他用户的操作）
    const unsubscribeEvents = globalEventService.subscribe(GlobalEvents.EVENTS_UPDATED, handleEventsUpdated);

    // 订阅用户资料更新
    const unsubscribeProfile = globalEventService.subscribe(GlobalEvents.USER_PROFILE_UPDATED, handleUserProfileUpdated);

    return () => {
      unsubscribeTasks();
      unsubscribeEvents();
      unsubscribeProfile();
    };
  }, [handleTasksUpdated, handleEventsUpdated, handleUserProfileUpdated]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<Event>>({});
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    isRecurring: false,
    recurrenceType: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    date: '', // 起始日期
    recurrenceEnd: '', // 结束日期（非必填）
    time: '', // 时间（非必填）
    participants: [] as string[]
  });

  // 确认弹窗状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    onConfirm: () => {}
  });

  // 检查用户是否有编辑权限
  const canEditEvent = (event: Event): boolean => {
    if (!coupleUsers || !user) {
      return false;
    }
    
    // 获取用户ID
    const currentUserId = user.id;
    
    // 如果是共同事件，两人都可以编辑
    if (event.participants.includes(coupleUsers.user1.id) && 
        event.participants.includes(coupleUsers.user2.id)) {
      return true;
    }
    
    // 如果是个人事件，只有参与者本人可以编辑
    return event.participants.includes(currentUserId);
  };

  // 生成重复事件的实例
  const generateRecurringEvents = (event: Event): Event[] => {
    if (!event.isRecurring || !event.recurrenceType || !event.originalDate) {
      return [event];
    }

    const events: Event[] = [];
    const startDate = new Date(event.originalDate);
    const endDate = event.recurrenceEnd ? new Date(event.recurrenceEnd) : new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 默认显示一年内的重复事件

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      events.push({
        ...event,
        id: `${event.id}-${currentDate.toISOString().split('T')[0]}`,
        date: currentDate.toISOString().split('T')[0]
      });

      // 根据重复类型计算下一个日期
      switch (event.recurrenceType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return events;
  };

  // 从任务板(localStorage)读取任务事件
  const readTaskEvents = (): Event[] => {
    try {
      const raw = localStorage.getItem('calendarTaskEvents');
      if (!raw) {
        console.log('📋 没有找到calendarTaskEvents数据');
        return [];
      }
      
      const parsed = JSON.parse(raw) as any[];
      console.log('📋 读取到任务事件原始数据:', parsed);
      
      const taskEvents = parsed.map((e, idx) => ({
        id: typeof e.id === 'string' ? e.id : `task-${idx}`,
        title: String(e.title || 'Task'),
        date: String(e.date),
        time: e.time ? String(e.time) : undefined,
        participants: Array.isArray(e.participants) ? e.participants : [], // 移除错误的过滤逻辑
        color: typeof e.color === 'string' ? e.color : 'bg-lavender-400',
        isRecurring: Boolean(e.isRecurring),
        recurrenceType: e.recurrenceType,
        recurrenceEnd: e.recurrenceEnd,
        originalDate: e.originalDate
      }));
      
      console.log('📋 转换后的任务事件:', taskEvents);
      return taskEvents;
    } catch (error) {
      console.error('❌ 读取任务事件失败:', error);
      return [];
    }
  };

  // 获取所有事件（包括重复事件的实例和任务事件）
  const getAllEvents = useMemo((): Event[] => {
    console.log('📅 getAllEvents 被调用 (useMemo), forceRefresh:', forceRefresh);
    const baseEvents: Event[] = [];
    
    // 添加常规事件
    events.forEach(event => {
      if (event.isRecurring) {
        baseEvents.push(...generateRecurringEvents(event));
      } else {
        baseEvents.push(event);
      }
    });
    console.log('📅 常规事件数量:', baseEvents.length);
    
    // 添加任务事件
    const taskEvents = readTaskEvents();
    console.log('📋 任务事件数量:', taskEvents.length);
    baseEvents.push(...taskEvents);
    
    console.log('📅 总事件数量:', baseEvents.length);
    return baseEvents;
  }, [events, forceRefresh]); // 依赖于events和forceRefresh

  // 检查事件是否包含指定用户的辅助函数
  const eventIncludesUser = (event: Event, userId: string): boolean => {
    if (!coupleUsers || !user) return false;
    
    // 直接检查用户ID是否包含在参与者中
    return event.participants.includes(userId);
  };

  // 根据当前视图筛选事件
  const getFilteredEvents = (allEvents: Event[]): Event[] => {
    console.log('🔍 开始过滤事件, 当前视图:', currentView);
    console.log('📊 所有事件:', allEvents);
    
    // 如果没有加载用户信息，返回所有事件
    if (!coupleUsers || !user) {
      console.log('⚠️ 用户信息未加载，返回所有事件');
      return allEvents;
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    const currentUserId = user.id;
    
    console.log('👤 用户信息:', { 
      currentUserId, 
      user1Id, 
      user2Id, 
      currentUserIsUser1 
    });
    
    // 使用实际的当前用户ID，而不是通过isUser1推导
    const currentUserIdForFiltering = currentUserId;
    const partnerIdForFiltering = currentUserId === user1Id ? user2Id : user1Id;
    
    console.log('🎯 过滤用的ID:', { 
      currentUserIdForFiltering, 
      partnerIdForFiltering 
    });
    
    let filteredEvents: Event[] = [];
    
    switch (currentView) {
      case 'my':
        // 我的日历：显示所有当前登录用户参与的事件（包括共同参与的）
        filteredEvents = allEvents.filter(event => {
          const included = eventIncludesUser(event, currentUserIdForFiltering);
          console.log(`🔍 检查事件 "${event.title}" 是否包含用户 ${currentUserIdForFiltering}:`, included);
          console.log('   事件参与者:', event.participants);
          return included;
        });
        break;
      case 'partner':
        // 伴侣日历：显示所有伴侣参与的事件（包括共同参与的）
        filteredEvents = allEvents.filter(event => eventIncludesUser(event, partnerIdForFiltering));
        break;
      case 'shared':
        // 共同日历：只显示两人都参与的事件
        filteredEvents = allEvents.filter(event => 
          eventIncludesUser(event, currentUserIdForFiltering) && eventIncludesUser(event, partnerIdForFiltering)
        );
        break;
      default:
        filteredEvents = allEvents;
    }
    
    console.log('✅ 过滤后的事件:', filteredEvents);
    
    return filteredEvents;
  };

  // 修改获取某天事件的函数
  const getEventsForDay = (day: number) => {
    const allEvents = getAllEvents; // getAllEvents现在是一个计算好的值，不是函数
    const filteredEvents = getFilteredEvents(allEvents);
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(event => event.date === dayStr);
  };



  // 处理事件点击
  const handleEventClick = (event: Event) => {
    // 对于重复事件的实例，找到原始事件
    const originalEvent = event.id.includes('-') 
      ? events.find(e => e.id === event.id.split('-')[0]) || event
      : event;
    
    setSelectedEvent(originalEvent);
    setEditEvent({
      ...originalEvent,
      date: originalEvent.originalDate || originalEvent.date,
      recurrenceEnd: originalEvent.recurrenceEnd || ''
    });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || newEvent.participants.length === 0) {
      return;
    }

      const event: Event = {
        id: Date.now().toString(),
        ...newEvent,
        color: getEventColor(newEvent.participants),
        originalDate: newEvent.isRecurring ? newEvent.date : undefined,
        time: newEvent.time || undefined
      };

    try {
      if (user && coupleId) {
        // 保存到数据库
        const createParams = convertEventToCreateParams(event, coupleId, user.id);
        const savedEvent = await simplifiedEventService.createEvent(
          createParams.coupleId,
          createParams.title,
          createParams.eventDate,
          createParams.createdBy,
          createParams.includesUser1,
          createParams.includesUser2,
          createParams.startTime,
          createParams.endTime,
          createParams.description,
          createParams.isAllDay,
          createParams.location,
          createParams.isRecurring,
          createParams.recurrenceType,
          createParams.recurrenceEnd
        );
        
        if (savedEvent) {
          // 使用数据库返回的事件数据（包含真实的ID）
          const convertedEvent = convertSimplifiedEventToEvent(savedEvent);
          setEvents([...events, convertedEvent]);
          
          // 发布全局事件，通知其他组件事件数据已更新
          globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
        }
      } else {
        throw new Error('用户未登录或缺少情侣关系信息');
      }

      // 重置表单
      setNewEvent({ 
        title: '',
        isRecurring: false,
        recurrenceType: 'weekly',
        date: '',
        recurrenceEnd: '',
        time: '',
        participants: []
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('添加事件失败:', error);
      alert('添加事件失败，请重试');
    }
  };

  // 更新事件
  const handleUpdateEvent = () => {
    if (!selectedEvent || !editEvent.title || !editEvent.date || !editEvent.participants?.length) {
      return;
    }

    // 检查权限
    if (!canEditEvent(selectedEvent)) {
      setConfirmDialog({
        isOpen: true,
        title: theme === 'pixel' ? 'ACCESS_DENIED' : '权限不足',
        message: theme === 'pixel' ? 'NO_PERMISSION_TO_EDIT_THIS_EVENT' : '你没有权限编辑这个事件！',
        type: 'warning',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const updatedEvent: Event = {
      ...selectedEvent,
      title: editEvent.title,
      date: editEvent.date,
      time: editEvent.time || undefined,
      participants: editEvent.participants,
      isRecurring: editEvent.isRecurring || false,
      recurrenceType: editEvent.recurrenceType,
      recurrenceEnd: editEvent.recurrenceEnd || undefined,
      originalDate: editEvent.isRecurring ? editEvent.date : undefined,
      color: getEventColor(editEvent.participants)
    };

    const updateEvent = async () => {
      try {
        if (user && coupleId && coupleUsers) {
          // 更新数据库
          // 确定参与者
          const includesUser1 = updatedEvent.participants.includes(coupleUsers.user1.id);
          const includesUser2 = updatedEvent.participants.includes(coupleUsers.user2.id);
          
          const success = await simplifiedEventService.updateEvent(selectedEvent.id, {
            title: updatedEvent.title,
            event_date: updatedEvent.date,
            start_time: updatedEvent.time || undefined,
            includes_user1: includesUser1,
            includes_user2: includesUser2,
            is_recurring: updatedEvent.isRecurring,
            recurrence_type: updatedEvent.recurrenceType || undefined,
            recurrence_end: updatedEvent.recurrenceEnd || undefined,
            is_all_day: !updatedEvent.time
          });
          
          if (success) {
    setEvents(events.map(event => 
      event.id === selectedEvent.id ? updatedEvent : event
    ));
          } else {
            throw new Error('更新失败');
          }
        } else {
          throw new Error('用户未登录或缺少必要信息');
        }
    
    setShowDetailModal(false);
    setIsEditing(false);
    setSelectedEvent(null);
      } catch (error) {
        console.error('更新事件失败:', error);
        alert('更新事件失败，请重试');
      }
    };

    updateEvent();
  };

  // 删除事件
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // 检查权限
    if (!canEditEvent(selectedEvent)) {
      setConfirmDialog({
        isOpen: true,
        title: theme === 'pixel' ? 'ACCESS_DENIED' : '权限不足',
        message: theme === 'pixel' ? 'NO_PERMISSION_TO_DELETE_THIS_EVENT' : '你没有权限删除这个事件！',
        type: 'warning',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: theme === 'pixel' ? 'DELETE_EVENT' : '删除事件',
      message: theme === 'pixel' ? 'ARE_YOU_SURE_TO_DELETE_THIS_EVENT' : '确定要删除这个事件吗？',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (user && coupleId) {
            // 从数据库删除
            const success = await simplifiedEventService.deleteEvent(selectedEvent.id);
            
            if (success) {
        setEvents(events.filter(event => event.id !== selectedEvent.id));
            } else {
              throw new Error('删除失败');
            }
          } else {
            throw new Error('用户未登录或缺少情侣关系信息');
          }
          
        setShowDetailModal(false);
        setSelectedEvent(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('删除事件失败:', error);
          alert('删除事件失败，请重试');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 获取当前用户的颜色（基于登录用户身份和数据库配置）
  const getCurrentUserColor = (): { pixel: string; fresh: string; default: string } => {
    if (!coupleUsers || !user || currentUserIsUser1 === null || !coupleColors) {
      return { pixel: 'bg-pixel-textMuted', fresh: '#94a3b8', default: 'bg-gray-400' };
    }
    
    const userColor = minimalColorService.getUserColorByPosition(currentUserIsUser1, coupleColors);
    
    return { 
      pixel: currentUserIsUser1 ? 'bg-pixel-info' : 'bg-pixel-accent', // 保持像素主题的固定样式
      fresh: userColor, 
      default: userColor 
    };
  };

  // 获取伴侣的颜色（基于登录用户身份和数据库配置）
  const getPartnerColor = (): { pixel: string; fresh: string; default: string } => {
    if (!coupleUsers || !user || currentUserIsUser1 === null || !coupleColors) {
      return { pixel: 'bg-pixel-textMuted', fresh: '#94a3b8', default: 'bg-gray-400' };
    }
    
    const partnerColor = minimalColorService.getPartnerColorByPosition(currentUserIsUser1, coupleColors);
    
    return { 
      pixel: currentUserIsUser1 ? 'bg-pixel-accent' : 'bg-pixel-info', // 保持像素主题的固定样式
      fresh: partnerColor, 
      default: partnerColor 
    };
  };

  // 为清新主题获取内联样式背景色
  const getEventBackgroundStyle = (participants: (string | 'cat' | 'cow')[]): React.CSSProperties | undefined => {
    if (theme !== 'fresh') return undefined;
    
    // 检查是否有用户信息和颜色配置
    if (!coupleUsers || !user || !coupleColors) {
      return { backgroundColor: '#64748b' }; // 默认灰色
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 检查参与者包含哪些用户
    const hasUser1 = eventIncludesUser({ participants } as Event, user1Id);
    const hasUser2 = eventIncludesUser({ participants } as Event, user2Id);
    

    
    // 使用简化的颜色配置：
    const eventColor = minimalColorService.getEventColor(
      participants,
      user1Id,
      user2Id,
      coupleColors,
      eventIncludesUser
    );
    
    return { backgroundColor: eventColor };
  };

  // 获取参与者显示文本
  const getParticipantsText = (participants: string[]): string => {
    if (!coupleUsers || !user) {
      return '未知用户';
    }
    
    // 获取用户ID和名称
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    const user1Name = coupleUsers.user1.display_name || '用户1';
    const user2Name = coupleUsers.user2.display_name || '用户2';
    
    // 映射参与者ID到名称
    const names = participants.map(p => {
      if (p === user1Id) return user1Name;
      if (p === user2Id) return user2Name;
      return p; // 未知参与者，直接显示ID
    });
    
    return names.join(', ');
  };

  // 切换参与者选择（新建事件）
  const toggleParticipant = (userId: string) => {
    const currentParticipants = newEvent.participants;
    
    if (currentParticipants.includes(userId)) {
      setNewEvent({
        ...newEvent,
        participants: currentParticipants.filter(p => p !== userId)
      });
    } else {
      setNewEvent({
        ...newEvent,
        participants: [...currentParticipants, userId]
      });
    }
  };

  // 切换参与者选择（编辑事件）
  const toggleEditParticipant = (userId: string) => {
    const currentParticipants = editEvent.participants || [];
    
    if (currentParticipants.includes(userId)) {
      setEditEvent({
        ...editEvent,
        participants: currentParticipants.filter(p => p !== userId)
      });
    } else {
      setEditEvent({
        ...editEvent,
        participants: [...currentParticipants, userId]
      });
    }
  };

  // 使用useMemo优化日历计算，确保渲染稳定性
  const calendarData = useMemo(() => {
  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

    // 计算实际需要的行数，避免完全空白行
    const totalUsedCells = startingDayOfWeek + daysInMonth;
    const rowsNeeded = Math.ceil(totalUsedCells / 7);
    const totalCells = rowsNeeded * 7; // 动态计算总单元格数
    
    // Add empty cells to complete the grid (now dynamic)
    while (days.length < totalCells) {
      days.push(null);
    }
    
    // 计算首行空白比例，用于视觉优化
    const firstRowEmptyCount = startingDayOfWeek;
    const firstRowEmptyRatio = firstRowEmptyCount / 7;
    
    // 当首行空白过多时，调整上边距以改善视觉平衡
    const shouldAdjustSpacing = firstRowEmptyRatio >= 0.7; // 70%以上空白时调整
    const spacingClass = shouldAdjustSpacing ? 'mb-2' : 'mb-3';
    
    return {
      days,
      rowsNeeded,
      totalCells,
      daysInMonth,
      startingDayOfWeek,
      firstRowEmptyCount,
      firstRowEmptyRatio,
      shouldAdjustSpacing,
      spacingClass,
      today
    };
  }, [currentYear, currentMonth]);

  // 解构数据
  const { days, rowsNeeded, spacingClass, today } = calendarData;

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const getRecurrenceText = (type: string) => {
    switch (type) {
      case 'daily': return '每天';
      case 'weekly': return '每周';
      case 'biweekly': return '每两周';
      case 'monthly': return '每月';
      case 'yearly': return '每年';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
    
    // 按时间排序
  const sortEventsByTime = (events: Event[]): Event[] => {
    return [...events].sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time!.localeCompare(b.time!);
    });
  };

  // 获取指定日期（YYYY-MM-DD）的事件
  const getEventsForDate = (dateStr: string) => {
    const allEvents = getAllEvents; // getAllEvents现在是一个计算好的值，不是函数
    const filteredEvents = getFilteredEvents(allEvents);
    const dayEvents = filteredEvents.filter(event => event.date === dateStr);
    return sortEventsByTime(dayEvents);
  };

  // 格式化时间显示
  const formatTime = (time?: string) => {
    if (!time) return '全天';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const buildDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStrForPanel = buildDateStr(new Date());
  const panelDateStr = selectedDate || todayStrForPanel;
  const [pYear, pMonth, pDay] = panelDateStr.split('-').map(n => parseInt(n, 10));
  const panelDate = new Date(pYear, (pMonth || 1) - 1, pDay || 1);
  const isPanelToday = panelDateStr === todayStrForPanel;
  const panelEvents = getEventsForDate(panelDateStr);
  
  // 获取用户图标
  const getUserIcon = (userId: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    if (!coupleUsers || !user) {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } text-gray-400`} />
      );
    }
    
    // 确定是哪个用户
    const isUser1 = userId === coupleUsers.user1.id;
    
    if (theme === 'pixel') {
      return (
        <PixelIcon 
          name="user" 
          className={isUser1 ? 'text-pixel-warning' : 'text-pixel-info'}
          size={size}
        />
      );
    } else {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${isUser1 ? 'text-primary-500' : 'text-blue-500'}`} />
      );
    }
  };

  // 获取心形图标
  const getHeartIcon = (size: 'sm' | 'md' | 'lg' = 'md') => {
    if (theme === 'pixel') {
      return <PixelIcon name="heart" className="text-pixel-accent" size={size} glow />;
    } else {
      return <HeartIcon className={`${
        size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
      } text-primary-500`} />;
    }
  };

  // 添加月份导航处理函数
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    
    // 重置选中日期状态并自动选中今天
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  // 如果正在加载，显示加载状态
  if (loading || currentUserIsUser1 === null) {
    return (
      <div className="space-y-6">
        <LoadingSpinner
          size="lg"
          title={theme === 'pixel' ? 'LOADING CALENDAR...' : '正在加载日历...'}
          subtitle={theme === 'pixel' ? 'FETCHING EVENTS...' : '正在获取您的日程安排'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - 暂时隐藏 */}
      {/* 
      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <pre className="text-sm">
          {JSON.stringify({
            currentMonth,
            currentYear,
            currentMonthName: monthNames[currentMonth],
            today: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>
      */}

      {/* 颜色示例图 */}
      <div className={`p-3 rounded-lg mb-4 ${
        theme === 'pixel' 
          ? 'bg-pixel-card border-2 border-pixel-border' 
          : 'bg-fresh-card border border-fresh-border'
      }`}>
        <div className={`text-sm font-medium mb-2 ${
          theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-fresh-text'
        }`}>
          {theme === 'pixel' ? 'COLOR_GUIDE:' : '颜色指南：'}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${
                theme === 'pixel' ? 'border-2 border-white' : ''
              }`} 
              style={{ 
                backgroundColor: theme === 'fresh' ? '#06b6d4' : theme === 'pixel' ? '#3b82f6' : '#3b82f6' 
              }}
            ></div>
            <span className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-fresh-text'
            }`}>
              {theme === 'pixel' 
                ? 'USER1_EVENTS' 
                : coupleUsers && user 
                  ? `${coupleUsers.user1.display_name || '用户1'} 的日程`
                  : '用户1的日程'
              }
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${
                theme === 'pixel' ? 'border-2 border-white' : ''
              }`} 
              style={{ 
                backgroundColor: theme === 'fresh' ? '#8b5cf6' : theme === 'pixel' ? '#fbbf24' : '#f472b6' 
              }}
            ></div>
            <span className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-fresh-text'
            }`}>
              {theme === 'pixel' 
                ? 'USER2_EVENTS' 
                : coupleUsers && user 
                  ? `${coupleUsers.user2.display_name || '用户2'} 的日程`
                  : '用户2的日程'
              }
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${
                theme === 'pixel' ? 'border-2 border-white' : ''
              }`} 
              style={{ 
                backgroundColor: theme === 'fresh' ? '#10b981' : '#10b981' 
              }}
            ></div>
            <span className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-fresh-text'
            }`}>
              {theme === 'pixel' ? 'SHARED_EVENTS' : '共同日程'}
            </span>
          </div>
        </div>
      </div>

      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : theme === 'fresh'
              ? 'font-display text-fresh-text fresh-gradient-text'
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'CALENDAR.EXE' : theme === 'fresh' ? '日程安排 🌿' : '日程安排'}
          </h2>
          
          {/* View Switcher */}
          <div className={`flex overflow-hidden w-full sm:w-auto ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border bg-pixel-card shadow-pixel' 
              : theme === 'fresh'
              ? 'border border-fresh-border bg-fresh-card shadow-fresh rounded-fresh-lg'
              : 'border border-gray-200 rounded-lg'
          }`}>
            <button
              onClick={() => {
                setCurrentView('my');
              }}
              className={`flex items-center justify-center flex-1 px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel' 
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      currentView === 'my'
                        ? `${getCurrentUserColor().pixel} text-black shadow-pixel-inner`
                        : `text-pixel-text hover:bg-pixel-panel hover:text-${getCurrentUserColor().pixel.replace('bg-', '')}`
                    }`
                  : theme === 'fresh'
                  ? `border-r border-fresh-border ${
                      currentView === 'my'
                        ? 'text-white shadow-fresh-sm'
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'my'
                        ? `${getCurrentUserColor().default} text-white`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
              style={theme === 'fresh' && currentView === 'my' ? { backgroundColor: getCurrentUserColor().fresh } : undefined}
            >
              <UserIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">
                {getViewDisplayName('my')}
              </span>
            </button>
            <button
              onClick={() => {
                setCurrentView('partner');
              }}
              className={`flex items-center justify-center flex-1 px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      currentView === 'partner'
                        ? `${getPartnerColor().pixel} text-black shadow-pixel-inner`
                        : `text-pixel-text hover:bg-pixel-panel hover:text-${getPartnerColor().pixel.replace('bg-', '')}`
                    }`
                  : theme === 'fresh'
                  ? `border-r border-fresh-border ${
                      currentView === 'partner'
                        ? 'text-white shadow-fresh-sm'
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'partner'
                        ? `${getPartnerColor().default} text-white`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
              style={theme === 'fresh' && currentView === 'partner' ? { backgroundColor: getPartnerColor().fresh } : undefined}
            >
              <UserIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">
                {getViewDisplayName('partner')}
              </span>
            </button>
            <button
              onClick={() => {
                setCurrentView('shared');
              }}
              className={`flex items-center justify-center flex-1 px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase ${
                      currentView === 'shared'
                        ? 'bg-pixel-purple text-black shadow-pixel-inner' // 共同日历颜色：紫色
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-purple'
                    }`
                  : theme === 'fresh'
                  ? `${
                      currentView === 'shared'
                        ? 'bg-fresh-accent text-white shadow-fresh-sm' // 共同日历颜色：绿色
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'shared'
                        ? 'bg-purple-500 text-white' // 共同日历颜色：紫色
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
              style={theme === 'fresh' && currentView === 'shared' ? { backgroundColor: '#10b981' } : undefined}
            >
              <span className="mr-1 flex-shrink-0">
                {getHeartIcon('sm')}
              </span>
              <span className="font-medium whitespace-nowrap">
                {theme === 'pixel' ? 'SHARED_CALENDAR' : '共同日历'}
              </span>
            </button>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="lg"
            icon="refresh"
            iconComponent={<ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            disabled={isRefreshing}
          >
            {theme === 'pixel' ? 'REFRESH' : '刷新'}
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            variant="primary"
            size="lg"
            icon="plus"
            iconComponent={<PlusIcon className="w-5 h-5" />}
          >
            {theme === 'pixel' ? 'NEW_EVENT' : '新增日程'}
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className={`${
        theme === 'pixel' 
          ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel p-4'
          : 'bg-white rounded-xl shadow-soft p-4'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <NavigationButton
              direction="left"
              onClick={handlePrevMonth}
              aria-label="上一个月"
            />
            <h2 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' 
                ? `${monthNames[currentMonth].toUpperCase()} ${currentYear}`
                : `${monthNames[currentMonth]} ${currentYear}`
              }
            </h2>
            <NavigationButton
              direction="right"
              onClick={handleNextMonth}
              aria-label="下一个月"
            />
          </div>
          <button
            onClick={() => {
              handleToday();
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              theme === 'pixel'
                ? 'bg-pixel-accent text-pixel-text hover:bg-pixel-accent/80 font-mono uppercase'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {theme === 'pixel' ? 'TODAY' : '今天'}
          </button>
        </div>
      </div>

      {/* Main Content - Calendar + Today's Events */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid - Left Side */}
        <div className="xl:col-span-3">
          <div className={`p-6 ${
            theme === 'pixel' 
              ? 'bg-pixel-panel border-4 border-black shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            {/* Day headers */}
            <div className={`grid grid-cols-7 gap-2 ${spacingClass}`}>
              {dayNames.map(day => (
                <div key={day} className={`text-center font-medium py-2 ${
                  theme === 'pixel'
                    ? 'text-pixel-text font-mono uppercase bg-pixel-card border-2 border-pixel-border rounded-xl neon-text' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? day.toUpperCase() : day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div 
              className="grid grid-cols-7 gap-2"
              style={{ gridTemplateRows: `repeat(${rowsNeeded}, 1fr)` }}
            >
              {days.map((day, index) => {
                if (!day) {
                  // 空单元格也应该有一致的样式，避免视觉对齐问题
                  return (
                    <div 
                      key={`empty-${index}`}
                      className={`h-28 p-2 flex flex-col ${
                        theme === 'pixel'
                          ? 'border-2 rounded-xl border-pixel-border/30 bg-pixel-card/20'
                          : 'border rounded-2xl border-gray-200/30 bg-white/10'
                      }`}
                    >
                      {/* 空内容，但保持结构一致 */}
                    </div>
                  );
                }

                const dayEvents = getEventsForDay(day);
                const isToday = day === today.getDate() && 
                               currentMonth === today.getMonth() && 
                               currentYear === today.getFullYear();
                
                // 生成当前日期的字符串格式
                const currentDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === currentDayStr;
                
                // 处理日期点击
                const handleDayClick = () => {
                  setSelectedDate(isSelected ? null : currentDayStr);
                };
                
                return (
                  <div
                    key={`day-${currentYear}-${currentMonth}-${day}`}
                    onClick={handleDayClick}
                    className={`h-28 p-2 transition-all duration-300 flex flex-col cursor-pointer ${
                      theme === 'pixel'
                        ? `border-2 rounded-xl hover:shadow-pixel neon-border ${
                            isSelected
                              ? 'bg-pixel-accent border-white shadow-pixel-neon animate-neon-glow' // 选中日期使用今天的样式
                              : isToday && !selectedDate
                                ? 'bg-pixel-accent border-white shadow-pixel-neon animate-neon-glow' // 没有选中其他日期时，今天使用完整高亮
                                : isToday
                                  ? 'bg-pixel-panel border-pixel-accent shadow-pixel border-2' // 有其他选中日期时，今天只突出边框，调整为border-2
                                  : 'bg-pixel-card hover:bg-pixel-panel border-pixel-border'
                          }`
                        : `border rounded-2xl hover:shadow-soft ${
                            isSelected
                              ? 'bg-gradient-to-br from-primary-100/60 to-secondary-100/60 border-primary-300/50' // 选中日期使用今天的样式
                              : isToday && !selectedDate
                                ? 'bg-gradient-to-br from-primary-100/60 to-secondary-100/60 border-primary-300/50' // 没有选中其他日期时，今天使用完整高亮
                                : isToday
                                  ? 'bg-white/60 border-primary-400 border-2' // 有其他选中日期时，今天只突出边框
                              : 'bg-white/40 border-gray-200/60 hover:bg-white/60'
                          }`
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                      theme === 'pixel' 
                        ? `font-mono ${
                            isSelected
                              ? 'text-white font-bold neon-text' // 选中日期使用今天的文字样式
                              : isToday && !selectedDate
                                ? 'text-white font-bold neon-text' // 没有选中其他日期时，今天使用完整高亮文字
                                : isToday
                                  ? 'text-pixel-accent font-bold' // 有其他选中日期时，今天使用突出色文字
                                  : 'text-pixel-text'
                          }`
                        : isSelected
                          ? 'text-primary-600 font-bold' // 选中日期使用今天的文字样式
                          : isToday && !selectedDate
                            ? 'text-primary-600 font-bold' // 没有选中其他日期时，今天使用完整高亮文字
                            : isToday
                              ? 'text-primary-500 font-bold' // 有其他选中日期时，今天使用突出色文字
                              : 'text-gray-600'
                    }`}>
                      {theme === 'pixel' ? String(day).padStart(2, '0') : day}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => {
                        const hasEditPermission = canEditEvent(event);
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`text-xs px-1.5 py-0.5 truncate relative cursor-pointer transition-opacity ${
                              theme === 'pixel' 
                                ? `rounded-xl font-mono uppercase ${
                                    hasEditPermission 
                                      ? 'hover:opacity-80 hover:shadow-pixel-neon' 
                                      : 'opacity-75 hover:opacity-90'
                                  } ${getEventColor(event.participants)} neon-border`
                                : theme === 'fresh'
                                ? `rounded-fresh text-white font-medium ${
                                    hasEditPermission 
                                      ? 'hover:opacity-80 hover:shadow-fresh-sm' 
                                      : 'opacity-75 hover:opacity-90'
                                  }`
                                : `rounded-lg text-white ${
                                    hasEditPermission 
                                      ? 'hover:opacity-80' 
                                      : 'opacity-75 hover:opacity-90'
                                  } ${getEventColor(event.participants)}`
                            }`}
                            style={getEventBackgroundStyle(event.participants)}
                            title={`${event.time ? event.time + ' - ' : ''}${event.title}${event.isRecurring ? ` (${getRecurrenceText(event.recurrenceType!)})` : ''}\n参与者: ${getParticipantsText(event.participants)}\n${hasEditPermission ? '点击查看/编辑详情' : '点击查看详情（只读）'}`}
                          >
                            {event.isRecurring && (
                              theme === 'pixel' ? (
                                <PixelIcon name="refresh" className="absolute right-0.5 top-0 opacity-80 text-white" size="sm" />
                              ) : (
                                <ArrowPathIcon className="w-2.5 h-2.5 absolute right-0.5 top-0 opacity-80" />
                              )
                            )}
                            {!hasEditPermission && (
                              <div className={`absolute right-0.5 bottom-0 w-1.5 h-1.5 opacity-60 ${
                                theme === 'pixel' ? 'bg-white rounded-xl' : 'bg-gray-400 rounded-full'
                              }`} title="只读"></div>
                            )}
                            <span className={`block truncate ${event.isRecurring ? 'pr-3' : ''} ${!hasEditPermission ? 'pr-2' : ''} ${
                              theme === 'pixel' ? 'text-white font-bold' : ''
                            }`}>
                              {theme === 'pixel' ? event.title.toUpperCase() : event.title}
                            </span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className={`text-xs px-1 ${
                          theme === 'pixel' 
                            ? 'text-pixel-cyan font-mono neon-text' 
                            : 'text-gray-500'
                        }`}>
                          {theme === 'pixel' ? `+${dayEvents.length - 2}_MORE` : `+${dayEvents.length - 2} 更多`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Events List - Right Side */}
        <div className="xl:col-span-1">
          <div className={`p-6 h-fit sticky top-24 ${theme === 'pixel' ? 'bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg neon-border' : 'card-cutesy'}`}>
            <div className="flex items-center space-x-2 mb-4">
              {theme === 'pixel' ? (
                <PixelIcon name="calendar" className="text-pixel-accent" size="lg" glow />
              ) : (
                <CalendarDaysIcon className="w-6 h-6 text-primary-600" />
              )}
              <h3 className={`text-xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text uppercase tracking-wide neon-text'
                  : 'font-display text-gray-800'
              }`}>
                {getViewDisplayName(currentView)}
              </h3>
            </div>

            <div className={`text-sm mb-4 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono bg-pixel-card border-2 border-pixel-border rounded-pixel p-2 neon-text'
                : 'text-gray-600'
            }`}>
              {theme === 'pixel' 
                ? `${String(panelDate.getMonth() + 1).padStart(2, '0')}_${String(panelDate.getDate()).padStart(2, '0')}.DAY${isPanelToday ? '' : ''}`
                : `${panelDate.getMonth() + 1}月${panelDate.getDate()}日 · ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][panelDate.getDay()]}${isPanelToday ? '（今天）' : ''}`
              }
            </div>

            {panelEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className={`mb-2 ${theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-400'}`}>
                  {theme === 'pixel' ? (
                    <PixelIcon name="calendar" size="xl" className="mx-auto opacity-50 text-pixel-textMuted" />
                  ) : (
                    <CalendarDaysIcon className="w-12 h-12 mx-auto opacity-50" />
                  )}
                </div>
                <p className={`${theme === 'pixel' ? 'text-pixel-textMuted font-mono uppercase' : 'text-gray-500'}`}>
                  {theme === 'pixel' 
                     ? (currentView === 'my' ? 'NO_EVENTS_FOR_YOU' : 
                        currentView === 'partner' ? 'NO_PARTNER_EVENTS' : 
                       'NO_SHARED_EVENTS')
                     : (currentView === 'my' ? '该日没有您的日程安排' : 
                        currentView === 'partner' ? '该日没有伴侣日程安排' : 
                        '该日没有共同日程')
                  }
                </p>
                <p className={`text-sm mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono'
                    : 'text-gray-400'
                }`}>
                  {theme === 'pixel' ? 'PRESS [ADD_EVENT] TO CREATE' : '点击上方按钮添加新日程'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {panelEvents.map(event => {
                  const hasEditPermission = canEditEvent(event);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`group p-4 cursor-pointer transition-all duration-300 relative ${
                        theme === 'pixel' 
                          ? 'border-2 border-pixel-border rounded-pixel bg-pixel-card hover:bg-pixel-panel hover:shadow-pixel neon-border'
                          : 'border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/50'
                      }`}
                    >
                      {/* 权限指示器 */}
                      {!hasEditPermission && (
                        <div className={`absolute top-2 right-2 w-2 h-2 opacity-60 ${
                          theme === 'pixel' ? 'bg-pixel-textMuted rounded-pixel' : 'bg-gray-400 rounded-full'
                        }`} title="只读"></div>
                      )}

                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium transition-colors ${
                          theme === 'pixel' 
                            ? 'text-pixel-text font-mono uppercase group-hover:text-pixel-accent neon-text'
                            : 'text-gray-800 group-hover:text-primary-700'
                        }`}>
                          {event.title}
                        </h4>
                        {event.isRecurring && (
                          theme === 'pixel' ? (
                            <PixelIcon name="refresh" className="flex-shrink-0 ml-2 text-pixel-textMuted" size="sm" />
                          ) : (
                            <ArrowPathIcon className="w-4 h-4 flex-shrink-0 ml-2 text-gray-400" />
                          )
                        )}
                      </div>

                      <div className={`flex items-center space-x-4 text-sm ${
                        theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'
                      }`}>
                        <div className="flex items-center space-x-1">
                          {theme === 'pixel' ? (
                            <PixelIcon name="clock" size="sm" />
                          ) : (
                            <ClockIcon className="w-4 h-4" />
                          )}
                          <span>{formatTime(event.time)}</span>
                        </div>
                        {event.isRecurring && (
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'pixel' 
                              ? 'bg-pixel-success text-black font-mono uppercase border border-black'
                              : 'bg-secondary-100 text-secondary-700'
                          }`}>
                            {getRecurrenceText(event.recurrenceType!)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-1">
                          {event.participants.map(participant => (
                            <div key={participant} className="flex items-center">
                              {getUserIcon(participant, 'sm')}
                            </div>
                          ))}
                          <span className={`text-sm ml-1 ${
                            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                          }`}>
                            {getParticipantsText(event.participants)}
                          </span>
                        </div>
                        <div 
                          className={`w-3 h-3 ${
                          theme === 'pixel' 
                            ? `${getEventColor(event.participants).replace('bg-', 'bg-')} rounded-pixel border border-white`
                              : theme === 'fresh'
                              ? 'rounded-fresh-full border border-white'
                            : `${getEventColor(event.participants).replace('bg-', 'bg-')} rounded-full`
                          }`}
                          style={getEventBackgroundStyle(event.participants)}
                        ></div>
                      </div>

                      <div className={`mt-2 text-xs ${
                        theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-400'
                      }`}>
                        {theme === 'pixel' 
                          ? (hasEditPermission ? 'CLICK_TO_EDIT' : 'READONLY_MODE')
                          : (hasEditPermission ? '点击查看/编辑详情' : '点击查看详情（只读)')
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Today Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  setNewEvent({
                    ...newEvent,
                    date: todayStr
                  });
                  setShowAddForm(true);
                }}
                className={`w-full py-2 px-4 transition-all duration-300 flex items-center justify-center space-x-2 ${
                  theme === 'pixel' 
                    ? 'border-4 border-dashed border-pixel-border text-pixel-cyan rounded-pixel hover:border-pixel-accent hover:text-pixel-accent hover:bg-pixel-panel font-mono uppercase neon-border'
                    : 'border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="plus" size="sm" />
                ) : (
                  <PlusIcon className="w-4 h-4" />
                )}
                <span>{theme === 'pixel' ? 'ADD_TODAY' : '为今天添加日程'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail/Edit Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                  : 'font-display text-gray-800'
              }`}>
                {theme === 'pixel' 
                  ? (isEditing ? 'EDIT_EVENT' : 'EVENT_DETAILS')
                  : (isEditing ? '编辑日程' : '日程详情')
                }
              </h3>
              <div className="flex items-center space-x-2">
                {/* 只有有权限的用户才能看到编辑和删除按钮 */}
                {canEditEvent(selectedEvent) && (
                  <>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`p-2 transition-colors ${
                          theme === 'pixel'
                            ? 'text-pixel-cyan hover:text-pixel-accent rounded-pixel border-2 border-pixel-border hover:border-pixel-accent'
                            : 'text-gray-500 hover:text-blue-600'
                        }`}
                        title={theme === 'pixel' ? 'EDIT' : '编辑'}
                      >
                        {theme === 'pixel' ? (
                          <PixelIcon name="pencil" size="sm" />
                        ) : (
                          <PencilIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleDeleteEvent}
                      className={`p-2 transition-colors ${
                        theme === 'pixel'
                          ? 'text-pixel-textMuted hover:text-pixel-accent rounded-pixel border-2 border-pixel-border hover:border-pixel-accent'
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                      title={theme === 'pixel' ? 'DELETE' : '删除'}
                    >
                      {theme === 'pixel' ? (
                        <PixelIcon name="trash" size="sm" />
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </>
                )}
                {/* 没有权限时显示只读标识 */}
                {!canEditEvent(selectedEvent) && (
                  <div className={`flex items-center space-x-2 px-3 py-1 ${
                    theme === 'pixel'
                      ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel'
                      : 'bg-gray-100 rounded-lg'
                  }`}>
                    <span className={`text-xs ${
                      theme === 'pixel'
                        ? 'text-pixel-textMuted font-mono uppercase'
                        : 'text-gray-500'
                    }`}>
                      {theme === 'pixel' ? (
                        <div className="flex items-center space-x-1">
                          <PixelIcon name="eye" size="sm" />
                          <span>READONLY</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <EyeIcon className="w-3 h-3" />
                          <span>只读</span>
                        </div>
                      )}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className={`p-2 transition-colors ${
                    theme === 'pixel'
                      ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {theme === 'pixel' ? (
                    <PixelIcon name="x" size="sm" />
                  ) : (
                    <XMarkIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {!isEditing ? (
              // 详情视图
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'pixel'
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'EVENT_TITLE' : '标题'}
                  </label>
                  <p className={`text-lg font-medium ${
                    theme === 'pixel'
                      ? 'text-pixel-text font-mono uppercase'
                      : 'text-gray-900'
                  }`}>
                    {selectedEvent.title}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'pixel'
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'DATE' : '日期'}
                  </label>
                  <p className={`${
                    theme === 'pixel'
                      ? 'text-pixel-text font-mono'
                      : 'text-gray-900'
                  }`}>
                    {formatDate(selectedEvent.originalDate || selectedEvent.date)}
                  </p>
                </div>

                {selectedEvent.time && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'pixel'
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'TIME' : '时间'}
                    </label>
                    <p className={`${
                      theme === 'pixel'
                        ? 'text-pixel-text font-mono'
                        : 'text-gray-900'
                    }`}>
                      {selectedEvent.time}
                    </p>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'pixel'
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'PARTICIPANTS' : '参与者'}
                  </label>
                  <p className={`${
                    theme === 'pixel'
                      ? 'text-pixel-text font-mono'
                      : 'text-gray-900'
                  }`}>
                    {getParticipantsText(selectedEvent.participants)}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'pixel'
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'RECURRENCE' : '重复'}
                  </label>
                  <p className={`${
                    theme === 'pixel'
                      ? 'text-pixel-text font-mono'
                      : 'text-gray-900'
                  }`}>
                    {selectedEvent.isRecurring 
                      ? `${getRecurrenceText(selectedEvent.recurrenceType!)}${
                          selectedEvent.recurrenceEnd 
                            ? `，直到 ${formatDate(selectedEvent.recurrenceEnd)}` 
                            : ''
                        }`
                      : (theme === 'pixel' ? 'ONE_TIME_EVENT' : '一次性事件')
                    }
                  </p>
                </div>
              </div>
            ) : (
              // 编辑视图
              <div className="space-y-4">
                {/* 1. 日程标题 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'EVENT_TITLE *' : '日程标题 *'}
                  </label>
                  <input
                    type="text"
                    value={editEvent.title || ''}
                    onChange={(e) => setEditEvent({...editEvent, title: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                    placeholder={theme === 'pixel' ? 'ENTER_EVENT_TITLE...' : '输入日程标题...'}
                  />
                </div>

                {/* 2. 重复设置 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'RECURRING *' : '重复设置 *'}
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editEvent.isRecurring || false}
                        onChange={(e) => setEditEvent({...editEvent, isRecurring: e.target.checked})}
                        className={theme === 'pixel' ? 'pixel-checkbox' : 'checkbox-cutesy'}
                      />
                      <span className={`text-sm ${
                        theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                      }`}>
                        {theme === 'pixel' ? 'ENABLE_REPEAT' : '启用重复'}
                      </span>
                    </label>
                </div>

                {editEvent.isRecurring && (
                    <div className="mt-3 space-y-3">
                    <select
                      value={editEvent.recurrenceType || 'weekly'}
                      onChange={(e) => setEditEvent({...editEvent, recurrenceType: e.target.value as any})}
                      className={`w-full ${
                          theme === 'pixel' ? 'pixel-select-glow' : 'select-cutesy'
                      }`}
                    >
                      <option value="daily">{theme === 'pixel' ? 'DAILY' : '每天'}</option>
                      <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : '每周'}</option>
                        <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : '每两周'}</option>
                      <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : '每月'}</option>
                      <option value="yearly">{theme === 'pixel' ? 'YEARLY' : '每年'}</option>
                    </select>
                  <input
                    type="date"
                        value={editEvent.recurrenceEnd || ''}
                        onChange={(e) => setEditEvent({...editEvent, recurrenceEnd: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                        placeholder={theme === 'pixel' ? 'END_DATE_OPTIONAL' : '结束日期（可选）'}
                  />
                    </div>
                  )}
                </div>

                {/* 3. 日期和时间 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'pixel'
                        ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                        : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'DATE *' : '日期 *'}
                    </label>
                    <input
                      type="date"
                      value={editEvent.date || ''}
                      onChange={(e) => setEditEvent({...editEvent, date: e.target.value})}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                    />
                  </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel'
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'TIME' : '时间'}
                  </label>
                  <input
                    type="time"
                    value={editEvent.time || ''}
                    onChange={(e) => setEditEvent({...editEvent, time: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                  />
                  </div>
                </div>

                {/* 4. 参与者选择 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'PARTICIPANTS *' : '参与者 *'}
                  </label>
                  <div className="flex space-x-4">
                    {coupleUsers && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleEditParticipant(coupleUsers.user1.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            editEvent.participants?.includes(coupleUsers.user1.id)
                              ? theme === 'pixel'
                                ? 'bg-pixel-accent text-black border-2 border-white'
                                : 'bg-primary-500 text-white'
                              : theme === 'pixel'
                                ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getUserIcon(coupleUsers.user1.id, 'sm')}
                          <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                            {theme === 'pixel' ? 'USER_1' : coupleUsers.user1.display_name || '用户1'}
                      </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleEditParticipant(coupleUsers.user2.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            editEvent.participants?.includes(coupleUsers.user2.id)
                              ? theme === 'pixel'
                                ? 'bg-pixel-accent text-black border-2 border-white'
                                : 'bg-blue-500 text-white'
                              : theme === 'pixel'
                                ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getUserIcon(coupleUsers.user2.id, 'sm')}
                          <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                            {theme === 'pixel' ? 'USER_2' : coupleUsers.user2.display_name || '用户2'}
                      </span>
                        </button>
                      </>
                  )}
                </div>
              </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditEvent({});
                    }}
                    className={`px-4 py-2 transition-colors ${
                        theme === 'pixel'
                        ? 'text-pixel-textMuted hover:text-pixel-text border-2 border-pixel-border rounded-pixel hover:border-pixel-textMuted font-mono uppercase'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {theme === 'pixel' ? 'CANCEL' : '取消'}
                    </button>
                    <button
                      onClick={handleUpdateEvent}
                    className={`px-6 py-2 font-bold transition-all duration-300 ${
                        theme === 'pixel'
                        ? 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider'
                      : 'btn-primary'
                  }`}
                >
                    {theme === 'pixel' ? 'UPDATE_EVENT' : '更新日程'}
                </button>
            </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                  : 'font-display text-gray-800'
              }`}>
                {theme === 'pixel' ? 'CREATE_EVENT' : '新增日程'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewEvent({
                    title: '',
                    isRecurring: false,
                    recurrenceType: 'weekly',
                    date: '',
                    recurrenceEnd: '',
                    time: '',
                    participants: []
                  });
                }}
                className={`p-2 transition-colors ${
                  theme === 'pixel'
                    ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="x" size="sm" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 1. 日程标题 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'EVENT_TITLE *' : '日程标题 *'}
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_EVENT_TITLE...' : '输入日程标题...'}
                />
              </div>

              {/* 2. 重复设置 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'RECURRING' : '重复设置'}
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newEvent.isRecurring}
                      onChange={(e) => setNewEvent({...newEvent, isRecurring: e.target.checked})}
                      className={theme === 'pixel' ? 'pixel-checkbox' : 'checkbox-cutesy'}
                    />
                    <span className={`text-sm ${
                      theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-700'
                    }`}>
                      {theme === 'pixel' ? 'ENABLE_REPEAT' : '启用重复'}
                    </span>
                  </label>
              </div>

              {newEvent.isRecurring && (
                  <div className="mt-3 space-y-3">
                  <select
                    value={newEvent.recurrenceType}
                    onChange={(e) => setNewEvent({...newEvent, recurrenceType: e.target.value as any})}
                    className={`w-full ${
                        theme === 'pixel' ? 'pixel-select-glow' : 'select-cutesy'
                    }`}
                  >
                    <option value="daily">{theme === 'pixel' ? 'DAILY' : '每天'}</option>
                    <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : '每周'}</option>
                      <option value="biweekly">{theme === 'pixel' ? 'BIWEEKLY' : '每两周'}</option>
                    <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : '每月'}</option>
                    <option value="yearly">{theme === 'pixel' ? 'YEARLY' : '每年'}</option>
                  </select>
                <input
                  type="date"
                      value={newEvent.recurrenceEnd}
                      onChange={(e) => setNewEvent({...newEvent, recurrenceEnd: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                      placeholder={theme === 'pixel' ? 'END_DATE_OPTIONAL' : '结束日期（可选）'}
                />
                  </div>
                )}
              </div>

              {/* 3. 日期和时间 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'DATE *' : '日期 *'}
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                  />
                </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TIME' : '时间'}
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                />
                </div>
              </div>

              {/* 4. 参与者选择 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'PARTICIPANTS *' : '参与者 *'}
                </label>
                                  <div className="flex space-x-4">
                                        {coupleUsers && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleParticipant(coupleUsers.user1.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            newEvent.participants.includes(coupleUsers.user1.id)
                              ? theme === 'pixel'
                                ? 'bg-pixel-accent text-black border-2 border-white'
                                : 'bg-primary-500 text-white'
                              : theme === 'pixel'
                                ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getUserIcon(coupleUsers.user1.id, 'sm')}
                          <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                            {theme === 'pixel' ? 'USER_1' : coupleUsers.user1.display_name || '用户1'}
                    </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleParticipant(coupleUsers.user2.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            newEvent.participants.includes(coupleUsers.user2.id)
                              ? theme === 'pixel'
                                ? 'bg-pixel-accent text-black border-2 border-white'
                                : 'bg-blue-500 text-white'
                              : theme === 'pixel'
                                ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getUserIcon(coupleUsers.user2.id, 'sm')}
                          <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                            {theme === 'pixel' ? 'USER_2' : coupleUsers.user2.display_name || '用户2'}
                    </span>
                        </button>
                      </>
                )}
              </div>
            </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewEvent({
                    title: '',
                    isRecurring: false,
                    recurrenceType: 'weekly',
                    date: '',
                    recurrenceEnd: '',
                    time: '',
                    participants: []
                  });
                }}
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddEvent}
              >
                {theme === 'pixel' ? 'CREATE_EVENT' : '创建日程'}
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Calendar;