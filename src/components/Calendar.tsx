import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, UserIcon, ArrowPathIcon, PencilIcon, TrashIcon, XMarkIcon, ClockIcon, CalendarDaysIcon, HeartIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import ConfirmDialog from './ConfirmDialog';
import { format, subMonths, addMonths, isSameDay, isSameMonth } from 'date-fns';
import { eventService, userService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/supabase';

// 前端展示用的Event接口（兼容原有代码）
interface Event {
  id: string;
  title: string;
  date: string;
  time?: string; // 改为可选
  participants: (string | 'cat' | 'cow')[]; // 改为参与者数组，支持字符串类型的用户ID
  color: string;
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  recurrenceEnd?: string; // 结束日期
  originalDate?: string; // 原始日期（用于重复事件）
}

// 数据库事件类型
type DatabaseEvent = Database['public']['Tables']['events']['Row'];

// 数据模式类型
type DataMode = 'database' | 'mock';

interface CalendarProps {
  currentUser?: string | null;
}

const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth(); // 获取认证用户信息
  
  // 数据模式状态 - 强制使用数据库，只有在未登录时才使用mock数据
  const [dataMode, setDataMode] = useState<DataMode>(user ? 'database' : 'mock');
  
  // 添加日历导航状态
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // 添加选中日期状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // 数据库相关状态
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 用户类型定义
  type UserView = 'user1' | 'user2' | 'shared';
  
  // 用户信息状态
  const [coupleUsers, setCoupleUsers] = useState<{user1: any, user2: any} | null>(null);
  const [currentUserIsUser1, setCurrentUserIsUser1] = useState<boolean | null>(null);
  
  // 获取当前用户视图类型的辅助函数
  const getDefaultView = (): UserView => {
    if (!user) return 'shared'; // 未登录时显示共同日历
    return 'user1'; // 默认显示当前用户的日历
  };

  // 添加视图状态 - 使用动态默认值
  const [currentView, setCurrentView] = useState<UserView>(getDefaultView());
  
  // 监听用户变化，当用户切换时自动更新视图
  useEffect(() => {
    const newDefaultView = getDefaultView();
    setCurrentView(newDefaultView);
  }, [currentUser]);
  
  // Mock数据（保留供将来使用）
  const mockEvents: Event[] = [
    // 共同活动
    {
      id: '1',
      title: '约会晚餐',
      date: '2024-01-15',
      time: '19:00',
      participants: ['cat', 'cow'],
      color: 'bg-lavender-400', // 初始颜色，会被主题覆盖
      isRecurring: false
    },
    {
      id: '7',
      title: '一起看电影',
      date: new Date().toISOString().split('T')[0], // 今天
      time: '20:00',
      participants: ['cat', 'cow'],
      color: 'bg-lavender-400',
      isRecurring: false
    },
    
    // 奶牛的独享活动
    {
      id: '2',
      title: '健身训练',
      date: '2024-01-16',
      time: '20:00',
      participants: ['cow'],
      color: 'bg-blue-400', // 初始颜色，会被主题覆盖
      isRecurring: false
    },
    {
      id: '4',
      title: '读书时间',
      date: new Date().toISOString().split('T')[0], // 今天
      time: '10:00',
      participants: ['cow'],
      color: 'bg-blue-400',
      isRecurring: false
    },
    {
      id: '5',
      title: '工作会议',
      date: '2024-01-18',
      time: '14:00',
      participants: ['cow'],
      color: 'bg-blue-400',
      isRecurring: false
    },
    
    // 猫猫的独享活动  
    {
      id: '6',
      title: '瑜伽练习',
      date: '2024-01-17',
      time: '08:00',
      participants: ['cat'],
      color: 'bg-primary-400', // 初始颜色，会被主题覆盖
      isRecurring: false
    },
    {
      id: '8',
      title: '画画时间',
      date: new Date().toISOString().split('T')[0], // 今天
      time: '15:30',
      participants: ['cat'],
      color: 'bg-primary-400',
      isRecurring: false
    },
    {
      id: '9',
      title: '朋友聚会',
      date: '2024-01-19',
      time: '19:30',
      participants: ['cat'],
      color: 'bg-primary-400',
      isRecurring: false
    }
  ];

  // 真实事件状态（根据数据模式使用不同数据源）
  const [events, setEvents] = useState<Event[]>([]);

  // 数据库事件转换为前端Event格式
  const convertDatabaseEventToEvent = (dbEvent: DatabaseEvent): Event => {
    // 保留所有参与者ID，不再过滤只保留'cat'和'cow'
    const participants = dbEvent.participants as (string | 'cat' | 'cow')[];
    
    // 添加调试信息
    console.log(`🔄 转换数据库事件: "${dbEvent.title}" - 参与者:`, participants);
    
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      date: dbEvent.event_date,
      time: dbEvent.start_time || undefined,
      participants: participants,
      color: dbEvent.color,
      isRecurring: dbEvent.is_recurring,
      recurrenceType: dbEvent.recurrence_type || undefined,
      recurrenceEnd: dbEvent.recurrence_end || undefined,
      originalDate: dbEvent.original_date || undefined
    };
  };

  // 前端Event转换为数据库格式
  const convertEventToDatabaseEvent = (event: Event, coupleId: string, createdBy: string): Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'> => {
    return {
      title: event.title,
      description: null,
      event_date: event.date,
      start_time: event.time || null,
      end_time: null,
      participants: event.participants,
      couple_id: coupleId,
      color: event.color,
      is_all_day: !event.time,
      is_recurring: event.isRecurring,
      recurrence_type: event.recurrenceType || null,
      recurrence_end: event.recurrenceEnd || null,
      original_date: event.originalDate || null,
      parent_event_id: null,
      created_by: createdBy
    };
  };

  // 初始化数据模式
  useEffect(() => {
    setDataMode(user ? 'database' : 'mock');
  }, [user]);

  // 加载情侣关系和用户信息
  useEffect(() => {
    const loadCoupleInfo = async () => {
      console.log('🔄 开始加载情侣关系和用户信息...');
      console.log('当前用户状态:', user ? `已登录 (${user.email})` : '未登录');
      console.log('数据模式:', dataMode);
      
      if (!user) {
        console.log('⚠️ 未登录，无法加载用户信息');
        setLoading(false);
        return;
      }
      
      if (dataMode !== 'database') {
        console.log('⚠️ 非数据库模式，使用演示数据');
        
        // 在演示模式下，设置模拟的情侣用户信息
        setCoupleId('mock-couple-id');
        setCurrentUserIsUser1(true);
        setCoupleUsers({
          user1: {
            id: 'cat-user-id',
            display_name: 'Whimsical Cat',
            email: user.email
          },
          user2: {
            id: 'cow-user-id',
            display_name: 'Whimsical Cow',
            email: 'cow@example.com'
          }
        });
        console.log('✅ 已设置演示模式的情侣用户信息');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 正在查询情侣关系...');
        // 获取情侣关系
        const coupleData = await userService.getCoupleRelation(user.id);
        console.log('情侣关系查询结果:', coupleData);
        
        if (coupleData) {
          setCoupleId(coupleData.id);
          
          console.log('🔍 正在获取情侣用户信息...');
          // 获取情侣中的用户信息
          const users = await userService.getCoupleUsers(coupleData.id);
          console.log('情侣用户查询结果:', users);
          
          if (users && users.length === 2) {
            // 确定哪个用户是当前登录用户
            const isUser1 = users[0].id === user.id;
            setCurrentUserIsUser1(isUser1);
            
            // 设置用户信息
            setCoupleUsers({
              user1: isUser1 ? users[0] : users[1],
              user2: isUser1 ? users[1] : users[0]
            });
            
            console.log('✅ 已加载情侣用户信息:', {
              currentUser: isUser1 ? users[0].display_name : users[1].display_name,
              partner: isUser1 ? users[1].display_name : users[0].display_name,
              user1Id: isUser1 ? users[0].id : users[1].id,
              user2Id: isUser1 ? users[1].id : users[0].id
            });
          } else {
            console.error('⚠️ 情侣用户信息不完整:', users);
          }
        } else {
          console.error('⚠️ 未找到情侣关系');
        }
      } catch (error) {
        console.error('❌ 加载情侣关系失败:', error);
      }
      setLoading(false);
    };

    loadCoupleInfo();
  }, [user, dataMode]);

  // 加载事件数据
  useEffect(() => {
    const loadEvents = async () => {
      if (dataMode === 'mock') {
        // 使用mock数据
        setEvents(mockEvents);
        return;
      }

      if (!coupleId) {
        setEvents([]);
        return;
      }

      try {
        const dbEvents = await eventService.getCoupleEvents(coupleId);
        const convertedEvents = dbEvents.map(convertDatabaseEventToEvent);
        setEvents(convertedEvents);
        console.log(`✅ 从数据库加载了 ${convertedEvents.length} 个事件`);
      } catch (error) {
        console.error('❌ 加载事件失败:', error);
        
        // 检查是否是数据库结构问题
        if (error instanceof Error && error.message.includes('couple_id does not exist')) {
          console.warn('⚠️ 数据库表结构不完整，请运行数据库初始化脚本');
          alert('数据库表结构需要更新，请联系管理员运行数据库初始化脚本。现在将使用演示数据。');
        } else if (error instanceof Error && error.message.includes('does not exist')) {
          console.warn('⚠️ events表不存在，请运行数据库初始化脚本');
          alert('数据库表未创建，请联系管理员运行数据库初始化脚本。现在将使用演示数据。');
        }
        
        // 如果数据库加载失败，显示错误但不回退到mock数据
        console.log('❌ 数据库连接失败，请检查数据库配置');
        alert('无法连接到数据库，请确保数据库配置正确且表结构完整。');
        setEvents([]); // 显示空数据而不是mock数据
      }
    };

    if (!loading) {
      loadEvents();
    }
  }, [coupleId, dataMode, loading]);

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
    participants: [] as (string | 'cat' | 'cow')[]
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
    // 如果没有加载用户信息或处于演示模式，使用旧的逻辑
    if (!coupleUsers || !user || dataMode === 'mock') {
      // 演示模式下，所有事件都可以编辑
      return true;
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
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      return parsed.map((e, idx) => ({
        id: typeof e.id === 'string' ? e.id : `task-${idx}`,
        title: String(e.title || 'Task'),
        date: String(e.date),
        time: e.time ? String(e.time) : undefined,
        participants: Array.isArray(e.participants) ? e.participants.filter((p: any) => p === 'cat' || p === 'cow') : [],
        color: typeof e.color === 'string' ? e.color : 'bg-lavender-400',
        isRecurring: Boolean(e.isRecurring),
        recurrenceType: e.recurrenceType,
        recurrenceEnd: e.recurrenceEnd,
        originalDate: e.originalDate
      }));
    } catch {
      return [];
    }
  };

  // 获取所有事件（包括重复事件的实例）
  const getAllEvents = (): Event[] => {
    const baseEvents: Event[] = [];
    
    events.forEach(event => {
      if (event.isRecurring) {
        baseEvents.push(...generateRecurringEvents(event));
      } else {
        baseEvents.push(event);
      }
    });

    // 数据库模式：只使用数据库事件，不再从localStorage读取任务事件
    if (dataMode === 'database') {
      return baseEvents;
    }

    // 演示模式：保持原有逻辑，合并任务事件
    const taskEvents = readTaskEvents();
    const expandedTaskEvents: Event[] = [];
    taskEvents.forEach(event => {
      if (event.isRecurring) {
        expandedTaskEvents.push(...generateRecurringEvents(event));
      } else {
        expandedTaskEvents.push(event);
      }
    });

    return [...baseEvents, ...expandedTaskEvents];
  };

  // 检查事件是否包含指定用户的辅助函数
  const eventIncludesUser = (event: Event, userId: string): boolean => {
    if (!coupleUsers || !user) return false;
    
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 直接检查用户ID是否包含在参与者中
    if (event.participants.includes(userId)) {
      return true;
    }
    
    // 对于演示模式，特殊处理cat/cow
    if (dataMode === 'mock' || userId === 'cat-user-id' || userId === 'cow-user-id') {
      // 如果是cat-user-id，检查是否包含'cat'
      if (userId === 'cat-user-id' || userId === user1Id) {
        if (event.participants.includes('cat')) {
          return true;
        }
      }
      
      // 如果是cow-user-id，检查是否包含'cow'
      if (userId === 'cow-user-id' || userId === user2Id) {
        if (event.participants.includes('cow')) {
          return true;
        }
      }
    }
    
    // 记录详细的调试信息
    if (event.participants.length > 0) {
      console.log(`🔍 检查事件 "${event.title}" 是否包含用户 ${userId}:`, 
        `参与者=${JSON.stringify(event.participants)}`,
        `结果=false`
      );
    }
    
    return false;
  };

  // 根据当前视图筛选事件
  const getFilteredEvents = (allEvents: Event[]): Event[] => {
    // 如果没有加载用户信息，返回所有事件
    if (!coupleUsers || !user) {
      console.log('⚠️ 未加载用户信息，返回所有事件', allEvents.length);
      return allEvents;
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    const currentUserId = user.id;
    
    // 日志用户信息
    console.log('🔍 当前用户信息:', {
      currentUserId,
      isUser1: currentUserIsUser1,
      user1: { id: user1Id, name: coupleUsers.user1.display_name },
      user2: { id: user2Id, name: coupleUsers.user2.display_name },
      currentView
    });
    
    // 调试每个事件的参与者
    console.log('🧩 事件参与者详情:');
    allEvents.forEach((event, index) => {
      if (index < 5) { // 只打印前5个事件，避免日志过多
        console.log(`事件 ${index+1}: "${event.title}" - 参与者:`, event.participants, 
          `包含用户1: ${eventIncludesUser(event, user1Id)}`,
          `包含用户2: ${eventIncludesUser(event, user2Id)}`
        );
      }
    });
    
    let filteredEvents: Event[] = [];
    
    switch (currentView) {
      case 'user1':
        // 我的日历：显示所有我参与的事件（包括共同参与的）
        filteredEvents = allEvents.filter(event => eventIncludesUser(event, user1Id));
        console.log(`📅 我的日历: 筛选出 ${filteredEvents.length}/${allEvents.length} 个事件`);
        break;
      case 'user2':
        // 伴侣日历：显示所有伴侣参与的事件（包括共同参与的）
        filteredEvents = allEvents.filter(event => eventIncludesUser(event, user2Id));
        console.log(`📅 伴侣日历: 筛选出 ${filteredEvents.length}/${allEvents.length} 个事件`);
        break;
      case 'shared':
        // 共同日历：只显示两人都参与的事件
        filteredEvents = allEvents.filter(event => 
          eventIncludesUser(event, user1Id) && eventIncludesUser(event, user2Id)
        );
        console.log(`📅 共同日历: 筛选出 ${filteredEvents.length}/${allEvents.length} 个事件`);
        break;
      default:
        filteredEvents = allEvents;
        console.log(`📅 默认视图: 显示所有 ${allEvents.length} 个事件`);
    }
    
    return filteredEvents;
  };

  // 修改获取某天事件的函数
  const getEventsForDay = (day: number) => {
    const allEvents = getAllEvents();
    const filteredEvents = getFilteredEvents(allEvents);
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(event => event.date === dayStr);
  };

  // 监听任务事件更新，触发日历刷新（仅在演示模式下）
  useEffect(() => {
    if (dataMode === 'mock') {
      const handler = () => {
        setEvents(prev => [...prev]);
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('calendarTaskEventsUpdated', handler);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('calendarTaskEventsUpdated', handler);
        }
      };
    }
  }, [dataMode]);

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
      if (dataMode === 'database' && user && coupleId) {
        // 数据库模式：保存到数据库
        const dbEventData = convertEventToDatabaseEvent(event, coupleId, user.id);
        const savedEvent = await eventService.createEvent(dbEventData);
        
        if (savedEvent) {
          // 使用数据库返回的事件数据（包含真实的ID）
          const convertedEvent = convertDatabaseEventToEvent(savedEvent);
          setEvents([...events, convertedEvent]);
        }
      } else {
        // Mock模式：保存到本地状态
        setEvents([...events, event]);
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
        if (dataMode === 'database' && user && coupleId) {
          // 数据库模式：更新数据库
          const success = await eventService.updateEvent(selectedEvent.id, {
            title: updatedEvent.title,
            event_date: updatedEvent.date,
            start_time: updatedEvent.time || null,
            participants: updatedEvent.participants,
            is_recurring: updatedEvent.isRecurring,
            recurrence_type: updatedEvent.recurrenceType || null,
            recurrence_end: updatedEvent.recurrenceEnd || null,
            color: updatedEvent.color
          });
          
          if (success) {
            setEvents(events.map(event => 
              event.id === selectedEvent.id ? updatedEvent : event
            ));
          } else {
            throw new Error('更新失败');
          }
        } else {
          // Mock模式：更新本地状态
          setEvents(events.map(event => 
            event.id === selectedEvent.id ? updatedEvent : event
          ));
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
          if (dataMode === 'database' && user && coupleId) {
            // 数据库模式：从数据库删除
            const success = await eventService.deleteEvent(selectedEvent.id);
            
            if (success) {
              setEvents(events.filter(event => event.id !== selectedEvent.id));
            } else {
              throw new Error('删除失败');
            }
          } else {
            // Mock模式：从本地状态删除
            setEvents(events.filter(event => event.id !== selectedEvent.id));
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

  // 根据参与者生成颜色
  const getEventColor = (participants: (string | 'cat' | 'cow')[]): string => {
    // 检查是否有用户信息
    if (!coupleUsers || !user) {
      console.log('⚠️ 获取事件颜色：未加载用户信息，使用默认颜色');
      return theme === 'pixel' ? 'bg-pixel-textMuted' : 'bg-sage-500';
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 检查参与者包含哪些用户
    const hasUser1 = eventIncludesUser({ participants } as Event, user1Id);
    const hasUser2 = eventIncludesUser({ participants } as Event, user2Id);
    
    // 记录颜色选择的调试信息
    console.log(`🎨 事件颜色选择:`, {
      参与者: participants,
      包含用户1: hasUser1,
      包含用户2: hasUser2,
      主题: theme
    });
    
    if (theme === 'pixel') {
      if (hasUser1 && hasUser2) {
        return 'bg-pixel-purple'; // 双方参与：像素风紫色
      } else if (hasUser1) {
        return 'bg-pixel-accent'; // 用户1：像素风霓虹粉色
      } else if (hasUser2) {
        return 'bg-pixel-info'; // 用户2：像素风蓝色
      }
      return 'bg-pixel-textMuted';
    }
    
    // 默认主题颜色
    if (hasUser1 && hasUser2) {
      return 'bg-purple-500'; // 双方参与：深紫色
    } else if (hasUser1) {
      return 'bg-primary-400'; // 用户1：粉色
    } else if (hasUser2) {
      return 'bg-blue-400'; // 用户2：蓝色
    }
    return 'bg-sage-500';
  };

  // 为清新主题获取内联样式背景色
  const getEventBackgroundStyle = (participants: (string | 'cat' | 'cow')[]): React.CSSProperties | undefined => {
    if (theme !== 'fresh') return undefined;
    
    // 检查是否有用户信息
    if (!coupleUsers || !user) {
      return { backgroundColor: '#64748b' }; // 默认灰色
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 检查参与者包含哪些用户
    const hasUser1 = eventIncludesUser({ participants } as Event, user1Id);
    const hasUser2 = eventIncludesUser({ participants } as Event, user2Id);
    
    // 记录颜色选择的调试信息（仅在调试模式下）
    if (participants.length > 0 && participants.length < 3) {
      console.log(`🎨 清新主题事件颜色:`, {
        参与者: participants,
        包含用户1: hasUser1,
        包含用户2: hasUser2
      });
    }
    
    if (hasUser1 && hasUser2) {
      return { backgroundColor: '#10b981' }; // 清新绿色 - 共同事件
    } else if (hasUser1) {
      return { backgroundColor: '#06b6d4' }; // 用户1专属青色
    } else if (hasUser2) {
      return { backgroundColor: '#8b5cf6' }; // 用户2专属紫色
    }
    return { backgroundColor: '#64748b' }; // 默认灰色
  };

  // 获取参与者显示文本
  const getParticipantsText = (participants: (string | 'cat' | 'cow')[]): string => {
    // 如果没有加载用户信息或处于演示模式，使用旧的逻辑
    if (!coupleUsers || !user || dataMode === 'mock') {
      const names = participants.map(p => {
        if (typeof p === 'string') {
          if (p === 'cat') return 'Whimsical Cat';
          if (p === 'cow') return 'Whimsical Cow';
          return p; // 未知参与者，直接显示ID
        }
        return p === 'cat' ? 'Whimsical Cat' : 'Whimsical Cow';
      });
      return names.join(', ');
    }
    
    // 获取用户ID和名称
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    const user1Name = coupleUsers.user1.display_name || '用户1';
    const user2Name = coupleUsers.user2.display_name || '用户2';
    
    // 映射参与者ID到名称
    const names = participants.map(p => {
      if (typeof p === 'string') {
        if (p === user1Id) return user1Name;
        if (p === user2Id) return user2Name;
        if (p === 'cat') return currentUserIsUser1 ? user1Name : user2Name; // 兼容mock数据
        if (p === 'cow') return currentUserIsUser1 ? user2Name : user1Name; // 兼容mock数据
        return p; // 未知参与者，直接显示ID
      }
      // 兼容mock数据
      return p === 'cat' 
        ? (currentUserIsUser1 ? user1Name : user2Name)
        : (currentUserIsUser1 ? user2Name : user1Name);
    });
    
    return names.join(', ');
  };

  // 获取用户ID（兼容mock数据和真实数据）
  const getUserIdForParticipant = (participant: 'cat' | 'cow'): string => {
    if (!coupleUsers || !user || dataMode === 'mock') {
      return participant; // 在演示模式下，直接返回'cat'或'cow'
    }
    
    // 在数据库模式下，返回真实用户ID
    if (currentUserIsUser1) {
      // 当前用户是user1
      return participant === 'cat' ? coupleUsers.user1.id : coupleUsers.user2.id;
    } else {
      // 当前用户是user2
      return participant === 'cat' ? coupleUsers.user2.id : coupleUsers.user1.id;
    }
  };

  // 切换参与者选择（新建事件）
  const toggleParticipant = (participant: 'cat' | 'cow') => {
    const userId = getUserIdForParticipant(participant);
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
  const toggleEditParticipant = (participant: 'cat' | 'cow') => {
    const userId = getUserIdForParticipant(participant);
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
    const allEvents = getAllEvents();
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
  const getUserIcon = (userType: string | 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    // 如果没有加载用户信息或处于演示模式，使用旧的逻辑
    if (!coupleUsers || !user || dataMode === 'mock') {
      // 处理字符串类型的用户ID
      const isCat = userType === 'cat' || 
                   (typeof userType === 'string' && userType.toLowerCase().includes('cat'));
      
      if (theme === 'pixel') {
        return (
          <PixelIcon 
            name="user" 
            className={isCat ? 'text-pixel-warning' : 'text-pixel-info'}
            size={size}
          />
        );
      } else {
        return (
          <UserIcon className={`${
            size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
          } ${isCat ? 'text-primary-500' : 'text-blue-500'}`} />
        );
      }
    }
    
    // 获取用户ID
    const user1Id = coupleUsers.user1.id;
    const user2Id = coupleUsers.user2.id;
    
    // 确定是哪个用户
    let isUser1 = false;
    
    if (typeof userType === 'string') {
      if (userType === user1Id) {
        isUser1 = true;
      } else if (userType === user2Id) {
        isUser1 = false;
      } else if (userType === 'cat') {
        isUser1 = currentUserIsUser1 === true;
      } else if (userType === 'cow') {
        isUser1 = currentUserIsUser1 === false;
      }
    } else {
      isUser1 = userType === 'cat' ? currentUserIsUser1 === true : currentUserIsUser1 === false;
    }
    
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

  return (
    <div className="space-y-6">
      {/* 数据模式指示器 */}
      <div className={`text-xs p-2 rounded ${
        dataMode === 'database' 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      }`}>
        {dataMode === 'database' 
          ? '🗄️ 数据库模式 - 使用真实Supabase数据' 
          : '📝 演示模式 - 使用本地Mock数据'
        }
        {loading && ' (加载中...)'}
        <div className="mt-1 text-xs opacity-75">
          用户状态: {user ? `已登录(${user.email})` : '未登录'} | 
          Couple ID: {coupleId || '未设置'} | 
          数据库事件: {events.length} | 
          显示事件: {getAllEvents().length}
          {dataMode === 'database' && (
            <span className="text-green-600 font-medium"> (已禁用localStorage任务事件)</span>
          )}
        </div>
        
        {/* 调试面板 */}
        {coupleUsers && user && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-800">🔍 日历视图调试信息</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="font-medium">当前视图:</span> {
                  currentView === 'user1' ? '我的日历' :
                  currentView === 'user2' ? '伴侣日历' : '共同日历'
                }
              </div>
              <div>
                <span className="font-medium">当前用户:</span> {
                  currentUserIsUser1 ? coupleUsers.user1.display_name : coupleUsers.user2.display_name
                }
              </div>
              <div>
                <span className="font-medium">用户1:</span> {coupleUsers.user1.display_name} ({coupleUsers.user1.id.substring(0, 8)}...)
              </div>
              <div>
                <span className="font-medium">用户2:</span> {coupleUsers.user2.display_name} ({coupleUsers.user2.id.substring(0, 8)}...)
              </div>
              <div className="col-span-2">
                <span className="font-medium">事件过滤:</span> 
                我的日历 ({getAllEvents().filter(e => 
                  coupleUsers && eventIncludesUser(e, coupleUsers.user1.id)
                ).length} 个) | 
                伴侣日历 ({getAllEvents().filter(e => 
                  coupleUsers && eventIncludesUser(e, coupleUsers.user2.id)
                ).length} 个) | 
                共同日历 ({getAllEvents().filter(e => 
                  coupleUsers && eventIncludesUser(e, coupleUsers.user1.id) && eventIncludesUser(e, coupleUsers.user2.id)
                ).length} 个)
              </div>
            </div>
          </div>
        )}
      </div>
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
                backgroundColor: theme === 'fresh' ? '#06b6d4' : '#fbbf24' 
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
                backgroundColor: theme === 'fresh' ? '#8b5cf6' : '#3b82f6' 
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : theme === 'fresh'
              ? 'font-display text-fresh-text fresh-gradient-text'
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'CALENDAR.EXE' : theme === 'fresh' ? '日程安排 🌿' : '日程安排'}
          </h2>
          
          {/* View Switcher */}
          <div className={`flex ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border bg-pixel-card shadow-pixel' 
              : theme === 'fresh'
              ? 'border border-fresh-border bg-fresh-card shadow-fresh rounded-fresh-lg'
              : 'border border-gray-200'
          }`}>
            <button
              onClick={() => {
                setCurrentView('user1');
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel' 
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      currentView === 'user1'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : theme === 'fresh'
                  ? `border-r border-fresh-border ${
                      currentView === 'user1'
                        ? 'text-white shadow-fresh-sm'
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'user1'
                        ? 'bg-primary-400 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
              style={theme === 'fresh' && currentView === 'user1' ? { backgroundColor: '#06b6d4' } : undefined}
            >
              <UserIcon className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {theme === 'pixel' ? 'MY_CALENDAR' : '我的日历'}
              </span>
            </button>
            <button
              onClick={() => {
                setCurrentView('user2');
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      currentView === 'user2'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : theme === 'fresh'
                  ? `border-r border-fresh-border ${
                      currentView === 'user2'
                        ? 'text-white shadow-fresh-sm'
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'user2'
                        ? 'bg-blue-400 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
              style={theme === 'fresh' && currentView === 'user2' ? { backgroundColor: '#8b5cf6' } : undefined}
            >
              <UserIcon className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {theme === 'pixel' ? 'PARTNER_CALENDAR' : '伴侣日历'}
              </span>
            </button>
            <button
              onClick={() => {
                setCurrentView('shared');
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase ${
                      currentView === 'shared'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : theme === 'fresh'
                  ? `${
                      currentView === 'shared'
                        ? 'bg-fresh-accent text-white shadow-fresh-sm'
                        : 'text-fresh-text hover:bg-fresh-primary'
                    }`
                  : `${
                      currentView === 'shared'
                        ? 'bg-lavender-400 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {getHeartIcon('sm')}
              <span className="font-medium">
                {theme === 'pixel' ? 'SHARED_CALENDAR' : '共同日历'}
              </span>
            </button>
          </div>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(true);
          }}
          className={`flex items-center space-x-2 px-6 py-3 font-bold transition-all duration-300 ${
            theme === 'pixel'
              ? 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider'
            : 'btn-primary'
          }`}
        >
          {theme === 'pixel' ? (
            <PixelIcon name="plus" className="text-current" glow />
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
          <span>{theme === 'pixel' ? 'NEW_EVENT' : '新增日程'}</span>
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className={`${
        theme === 'pixel' 
          ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel p-4'
          : 'bg-white rounded-xl shadow-soft p-4'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                handlePrevMonth();
              }}
              className={`p-2 rounded-full transition-colors ${
                theme === 'pixel'
                  ? 'hover:text-pixel-accent text-pixel-textMuted'
                  : 'hover:text-primary-500 text-gray-400'
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="arrow-left" size="sm" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
            <h2 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' 
                ? `${monthNames[currentMonth].toUpperCase()} ${currentYear}`
                : `${monthNames[currentMonth]} ${currentYear}`
              }
            </h2>
            <button
              onClick={() => {
                handleNextMonth();
              }}
              className={`p-2 rounded-full transition-colors ${
                theme === 'pixel'
                  ? 'hover:text-pixel-accent text-pixel-textMuted'
                  : 'hover:text-primary-500 text-gray-400'
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="arrow-right" size="sm" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
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
                {theme === 'pixel' 
                  ? (currentView === 'user1' ? 'MY_CALENDAR' : 
                     currentView === 'user2' ? 'PARTNER_CALENDAR' : 
                     'SHARED_CALENDAR')
                  : (currentView === 'user1' ? '我的日程' : 
                     currentView === 'user2' ? '伴侣日程' : 
                     '共同日程')
                }
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
                     ? (currentView === 'user1' ? 'NO_USER_EVENTS' : 
                        currentView === 'user2' ? 'NO_PARTNER_EVENTS' : 
                        'NO_SHARED_EVENTS')
                     : (currentView === 'user1' ? '该日没有个人日程安排' : 
                        currentView === 'user2' ? '该日没有伴侣日程安排' : 
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
                    <button
                      type="button"
                      onClick={() => toggleEditParticipant('cat')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        editEvent.participants?.includes(getUserIdForParticipant('cat'))
                          ? theme === 'pixel'
                            ? 'bg-pixel-accent text-black border-2 border-white'
                            : 'bg-primary-500 text-white'
                          : theme === 'pixel'
                            ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getUserIcon('cat', 'sm')}
                      <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                        {theme === 'pixel' ? 'USER_1' : coupleUsers && user ? coupleUsers.user1.display_name || '用户1' : 'Whimsical Cat'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEditParticipant('cow')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        editEvent.participants?.includes(getUserIdForParticipant('cow'))
                          ? theme === 'pixel'
                            ? 'bg-pixel-accent text-black border-2 border-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'pixel'
                            ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getUserIcon('cow', 'sm')}
                      <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                        {theme === 'pixel' ? 'USER_2' : coupleUsers && user ? coupleUsers.user2.display_name || '用户2' : 'Whimsical Cow'}
                      </span>
                    </button>
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
                    <button
                      type="button"
                      onClick={() => toggleParticipant('cat')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        newEvent.participants.includes(getUserIdForParticipant('cat'))
                          ? theme === 'pixel'
                            ? 'bg-pixel-accent text-black border-2 border-white'
                            : 'bg-primary-500 text-white'
                          : theme === 'pixel'
                            ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getUserIcon('cat', 'sm')}
                      <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                        {theme === 'pixel' ? 'USER_1' : coupleUsers && user ? coupleUsers.user1.display_name || '用户1' : 'Whimsical Cat'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleParticipant('cow')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        newEvent.participants.includes(getUserIdForParticipant('cow'))
                          ? theme === 'pixel'
                            ? 'bg-pixel-accent text-black border-2 border-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'pixel'
                            ? 'bg-pixel-card text-pixel-text border-2 border-pixel-border hover:border-pixel-accent'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getUserIcon('cow', 'sm')}
                      <span className={theme === 'pixel' ? 'font-mono uppercase' : ''}>
                        {theme === 'pixel' ? 'USER_2' : coupleUsers && user ? coupleUsers.user2.display_name || '用户2' : 'Whimsical Cow'}
                      </span>
                    </button>
                  </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-4">
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
                  className={`px-4 py-2 transition-colors ${
                    theme === 'pixel'
                      ? 'text-pixel-textMuted hover:text-pixel-text border-2 border-pixel-border rounded-pixel hover:border-pixel-textMuted font-mono uppercase'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {theme === 'pixel' ? 'CANCEL' : '取消'}
                </button>
                <button
                  onClick={handleAddEvent}
                  className={`px-6 py-2 font-bold transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider'
                      : 'btn-primary'
                  }`}
                >
                  {theme === 'pixel' ? 'CREATE_EVENT' : '创建日程'}
                </button>
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