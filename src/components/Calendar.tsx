import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, UserIcon, ArrowPathIcon, PencilIcon, TrashIcon, XMarkIcon, ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string; // 改为可选
  participants: ('cat' | 'cow')[]; // 改为参与者数组
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
  
  // 获取当前用户类型的辅助函数
  const getCurrentUserType = (): 'cat' | 'cow' | null => {
    if (!currentUser) return null;
    if (currentUser.toLowerCase().includes('cat')) return 'cat';
    if (currentUser.toLowerCase().includes('cow')) return 'cow';
    return null;
  };

  // 根据当前用户设置默认视图
  const getDefaultView = (): 'cat' | 'cow' | 'shared' => {
    const userType = getCurrentUserType();
    if (userType) {
      return userType; // 如果是cat用户，默认显示cat日历；如果是cow用户，默认显示cow日历
    }
    return 'shared'; // 未登录或无法识别用户类型时显示共同日历
  };

  // 添加视图状态 - 使用动态默认值
  const [currentView, setCurrentView] = useState<'cat' | 'cow' | 'shared'>(getDefaultView());
  
  // 监听用户变化，当用户切换时自动更新视图
  useEffect(() => {
    const newDefaultView = getDefaultView();
    setCurrentView(newDefaultView);
    console.log(`📅 用户切换到: ${currentUser}, 默认视图设置为: ${newDefaultView}`);
  }, [currentUser]);
  
  const [events, setEvents] = useState<Event[]>([
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
      color: 'bg-primary-400', // 初始颜色，会被主题覆盖
      isRecurring: false
    },
    {
      id: '4',
      title: '读书时间',
      date: new Date().toISOString().split('T')[0], // 今天
      time: '10:00',
      participants: ['cow'],
      color: 'bg-primary-400',
      isRecurring: false
    },
    {
      id: '5',
      title: '工作会议',
      date: '2024-01-18',
      time: '14:00',
      participants: ['cow'],
      color: 'bg-primary-400',
      isRecurring: false
    },
    
    // 猫猫的独享活动  
    {
      id: '6',
      title: '瑜伽练习',
      date: '2024-01-17',
      time: '08:00',
      participants: ['cat'],
      color: 'bg-blue-400', // 初始颜色，会被主题覆盖
      isRecurring: false
    },
    {
      id: '8',
      title: '画画时间',
      date: new Date().toISOString().split('T')[0], // 今天
      time: '15:30',
      participants: ['cat'],
      color: 'bg-blue-400',
      isRecurring: false
    },
    {
      id: '9',
      title: '朋友聚会',
      date: '2024-01-19',
      time: '19:30',
      participants: ['cat'],
      color: 'bg-blue-400',
      isRecurring: false
    }
  ]);

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
    participants: [] as ('cat' | 'cow')[]
  });

  // 检查用户是否有编辑权限
  const canEditEvent = (event: Event): boolean => {
    const userType = getCurrentUserType();
    if (!userType) return false;
    
    // 如果是共同事件，两人都可以编辑
    if (event.participants.includes('cat') && event.participants.includes('cow')) {
      return true;
    }
    
    // 如果是个人事件，只有参与者本人可以编辑
    return event.participants.includes(userType);
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

  // 获取所有事件（包括重复事件的实例）
  const getAllEvents = (): Event[] => {
    const allEvents: Event[] = [];
    
    events.forEach(event => {
      if (event.isRecurring) {
        allEvents.push(...generateRecurringEvents(event));
      } else {
        allEvents.push(event);
      }
    });

    return allEvents;
  };

  // 根据当前视图筛选事件
  const getFilteredEvents = (allEvents: Event[]): Event[] => {
    switch (currentView) {
      case 'cat':
        // 猫猫日历：显示所有猫猫参与的事件（包括共同参与的）
        return allEvents.filter(event => 
          event.participants.includes('cat')
        );
      case 'cow':
        // 奶牛日历：显示所有奶牛参与的事件（包括共同参与的）
        return allEvents.filter(event => 
          event.participants.includes('cow')
        );
      case 'shared':
        // 共同日历：只显示两人都参与的事件
        return allEvents.filter(event => 
          event.participants.includes('cat') && event.participants.includes('cow')
        );
      default:
        return allEvents;
    }
  };

  // 修改获取某天事件的函数
  const getEventsForDay = (day: number) => {
    const allEvents = getAllEvents();
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

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.participants.length > 0) {
      const event: Event = {
        id: Date.now().toString(),
        ...newEvent,
        color: getEventColor(newEvent.participants),
        originalDate: newEvent.isRecurring ? newEvent.date : undefined,
        time: newEvent.time || undefined
      };
      setEvents([...events, event]);
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
    }
  };

  // 更新事件
  const handleUpdateEvent = () => {
    if (!selectedEvent || !editEvent.title || !editEvent.date || !editEvent.participants?.length) {
      return;
    }

    // 检查权限
    if (!canEditEvent(selectedEvent)) {
      alert('你没有权限编辑这个事件！');
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

    setEvents(events.map(event => 
      event.id === selectedEvent.id ? updatedEvent : event
    ));
    
    setShowDetailModal(false);
    setIsEditing(false);
    setSelectedEvent(null);
  };

  // 删除事件
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // 检查权限
    if (!canEditEvent(selectedEvent)) {
      alert('你没有权限删除这个事件！');
      return;
    }
    
    if (window.confirm('确定要删除这个事件吗？')) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      setShowDetailModal(false);
      setSelectedEvent(null);
    }
  };

  // 根据参与者生成颜色
  const getEventColor = (participants: ('cat' | 'cow')[]): string => {
    if (theme === 'pixel') {
      if (participants.includes('cat') && participants.includes('cow')) {
        return 'bg-pixel-accent'; // 双方参与：像素风红色
      } else if (participants.includes('cat')) {
        return 'bg-pixel-info'; // 只有猫咪：像素风青色
      } else if (participants.includes('cow')) {
        return 'bg-pixel-purple'; // 只有奶牛：像素风紫色
      }
      return 'bg-pixel-textMuted';
    }
    
    if (participants.includes('cat') && participants.includes('cow')) {
      return 'bg-lavender-400'; // 双方参与：浅薰衣草紫
    } else if (participants.includes('cat')) {
      return 'bg-blue-400'; // 只有猫咪：天空梦境蓝
    } else if (participants.includes('cow')) {
      return 'bg-primary-400'; // 只有奶牛：梦幻莲花粉
    }
    return 'bg-sage-500';
  };

  // 获取参与者显示文本
  const getParticipantsText = (participants: ('cat' | 'cow')[]): string => {
    const names = participants.map(p => p === 'cat' ? '🐱 Whimsical Cat' : '🐄 Whimsical Cow');
    return names.join(', ');
  };

  // 切换参与者选择（新建事件）
  const toggleParticipant = (participant: 'cat' | 'cow') => {
    const currentParticipants = newEvent.participants;
    if (currentParticipants.includes(participant)) {
      setNewEvent({
        ...newEvent,
        participants: currentParticipants.filter(p => p !== participant)
      });
    } else {
      setNewEvent({
        ...newEvent,
        participants: [...currentParticipants, participant]
      });
    }
  };

  // 切换参与者选择（编辑事件）
  const toggleEditParticipant = (participant: 'cat' | 'cow') => {
    const currentParticipants = editEvent.participants || [];
    if (currentParticipants.includes(participant)) {
      setEditEvent({
        ...editEvent,
        participants: currentParticipants.filter(p => p !== participant)
      });
    } else {
      setEditEvent({
        ...editEvent,
        participants: [...currentParticipants, participant]
      });
    }
  };

  // Generate calendar days for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
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

  // 获取今日日程
  const getTodayEvents = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const allEvents = getAllEvents();
    const filteredEvents = getFilteredEvents(allEvents);
    const todayEvents = filteredEvents.filter(event => event.date === todayStr);
    
    // 按时间排序
    return todayEvents.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  // 格式化时间显示
  const formatTime = (time?: string) => {
    if (!time) return '全天';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const todayEvents = getTodayEvents();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' 
              ? `${currentYear}_${String(currentMonth + 1).padStart(2, '0')}.CALENDAR` 
              : `${currentYear}年 ${monthNames[currentMonth]}`
            }
          </h2>
          
          {/* 视图切换按钮 */}
          <div className={`flex items-center space-x-2 p-1 ${
            theme === 'pixel' 
              ? 'bg-pixel-card border-4 border-black rounded-pixel shadow-pixel neon-border' 
              : 'bg-white/40 backdrop-blur-md rounded-2xl border border-secondary-200/30'
          }`}>
            <button
              onClick={() => setCurrentView('cat')}
              className={`flex items-center space-x-2 px-4 py-2 transition-all duration-300 ${
                theme === 'pixel' 
                  ? `rounded-pixel font-mono text-sm uppercase font-bold ${
                      currentView === 'cat'
                        ? 'bg-pixel-info text-black shadow-pixel border-2 border-white neon-border'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-info'
                    }`
                  : `rounded-xl ${
                      currentView === 'cat'
                        ? 'bg-blue-400 text-white shadow-dream'
                        : 'text-sage-600 hover:bg-blue-50/60'
                    }`
              }`}
            >
              <span className="text-lg">🐱</span>
              <span className="font-medium">
                {theme === 'pixel' ? 'CAT_LOG' : '猫猫日历'}
              </span>
            </button>
            
            <button
              onClick={() => setCurrentView('cow')}
              className={`flex items-center space-x-2 px-4 py-2 transition-all duration-300 ${
                theme === 'pixel' 
                  ? `rounded-pixel font-mono text-sm uppercase font-bold ${
                      currentView === 'cow'
                        ? 'bg-pixel-purple text-white shadow-pixel border-2 border-white neon-border'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-purple'
                    }`
                  : `rounded-xl ${
                      currentView === 'cow'
                        ? 'bg-primary-400 text-white shadow-dream'
                        : 'text-sage-600 hover:bg-primary-50/60'
                    }`
              }`}
            >
              <span className="text-lg">🐄</span>
              <span className="font-medium">
                {theme === 'pixel' ? 'COW_LOG' : '奶牛日历'}
              </span>
            </button>
            
            <button
              onClick={() => setCurrentView('shared')}
              className={`flex items-center space-x-2 px-4 py-2 transition-all duration-300 ${
                theme === 'pixel' 
                  ? `rounded-pixel font-mono text-sm uppercase font-bold ${
                      currentView === 'shared'
                        ? 'bg-pixel-accent text-white shadow-pixel border-2 border-white neon-border'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `rounded-xl ${
                      currentView === 'shared'
                        ? 'bg-lavender-400 text-white shadow-dream'
                        : 'text-sage-600 hover:bg-lavender-50/60'
                    }`
              }`}
            >
              <span className="text-lg">💕</span>
              <span className="font-medium">
                {theme === 'pixel' ? 'SHARED_LOG' : '共同日历'}
              </span>
            </button>
          </div>
          
          {/* 当前视图提示信息 */}
          {currentUser && (
            <div className={`text-sm ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-600'
            }`}>
              {(() => {
                const userType = getCurrentUserType();
                if (currentView === userType) {
                  return theme === 'pixel' 
                    ? `CURRENT_VIEW: ${userType?.toUpperCase()}_PERSONAL_LOG` 
                    : `当前显示: ${currentUser}的个人日历`;
                } else if (currentView === 'shared') {
                  return theme === 'pixel' 
                    ? 'CURRENT_VIEW: SHARED_EVENTS_LOG' 
                    : '当前显示: 共同活动日历';
                } else {
                  return theme === 'pixel' 
                    ? `CURRENT_VIEW: ${currentView.toUpperCase()}_LOG` 
                    : `当前显示: ${currentView === 'cat' ? '猫猫' : '奶牛'}的日历`;
                }
              })()}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center space-x-2 px-6 py-3 font-bold transition-all duration-300 ${
            theme === 'pixel'
              ? 'pixel-btn-neon text-white rounded-pixel shadow-pixel-neon hover:shadow-pixel-neon-strong hover:translate-y-[-2px] border-4 border-white font-mono uppercase tracking-wider'
              : 'btn-primary'
          }`}
        >
          {theme === 'pixel' ? (
            <PixelIcon name="plus" className="text-current" glow />
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
          <span>{theme === 'pixel' ? 'ADD_EVENT' : '添加日程'}</span>
        </button>
      </div>

      {/* Main Content - Calendar + Today's Events */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid - Left Side */}
        <div className="xl:col-span-3">
          <div className={`p-6 ${theme === 'pixel' ? 'bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg neon-border' : 'card-cutesy'}`}>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className={`text-center font-medium py-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-text font-mono uppercase bg-pixel-card border-2 border-pixel-border rounded-pixel neon-text' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? day.toUpperCase() : day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-28"></div>;
                }

                const dayEvents = getEventsForDay(day);
                const isToday = day === today.getDate() && 
                               currentMonth === today.getMonth() && 
                               currentYear === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`h-28 p-2 transition-all duration-300 flex flex-col ${
                      theme === 'pixel' 
                        ? `border-2 border-pixel-border rounded-pixel hover:shadow-pixel neon-border ${
                            isToday 
                              ? 'bg-pixel-accent border-white shadow-pixel-neon animate-neon-glow' 
                              : 'bg-pixel-card hover:bg-pixel-panel'
                          }`
                        : `border rounded-xl hover:shadow-soft ${
                            isToday 
                              ? 'bg-gradient-to-br from-primary-100/60 to-secondary-100/60 border-primary-300/50' 
                              : 'bg-white/40 border-gray-200/60 hover:bg-white/60'
                          }`
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                      theme === 'pixel' 
                        ? `font-mono ${isToday ? 'text-white font-bold neon-text' : 'text-pixel-text'}`
                        : isToday ? 'text-primary-600' : 'text-gray-600'
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
                                ? `rounded-pixel border border-black font-mono uppercase ${
                                    hasEditPermission 
                                      ? 'hover:opacity-80 hover:shadow-pixel-neon' 
                                      : 'opacity-75 hover:opacity-90'
                                  } ${getEventColor(event.participants)} neon-border`
                                : `rounded-lg text-white ${
                                    hasEditPermission 
                                      ? 'hover:opacity-80' 
                                      : 'opacity-75 hover:opacity-90'
                                  } ${getEventColor(event.participants)}`
                            }`}
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
                                theme === 'pixel' ? 'bg-white rounded-pixel' : 'bg-gray-400 rounded-full'
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
                  ? (currentView === 'cat' ? 'CAT_TODAY' : 
                     currentView === 'cow' ? 'COW_TODAY' : 
                     'SHARED_TODAY')
                  : (currentView === 'cat' ? '🐱 猫猫今日' : 
                     currentView === 'cow' ? '🐄 奶牛今日' : 
                     '💕 共同今日')
                }
              </h3>
            </div>

            <div className={`text-sm mb-4 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono bg-pixel-card border-2 border-pixel-border rounded-pixel p-2 neon-text'
                : 'text-gray-600'
            }`}>
              {theme === 'pixel' 
                ? `${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}.DAY`
                : `${today.getMonth() + 1}月${today.getDate()}日 · ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][today.getDay()]}`
              }
            </div>

            {todayEvents.length === 0 ? (
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
                    ? (currentView === 'cat' ? 'NO_CAT_EVENTS' : 
                       currentView === 'cow' ? 'NO_COW_EVENTS' : 
                       'NO_SHARED_EVENTS')
                    : (currentView === 'cat' ? '猫猫今天没有日程安排' : 
                       currentView === 'cow' ? '奶牛今天没有日程安排' : 
                       '今天没有共同日程')
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
                {todayEvents.map(event => {
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
                            <span key={participant} className="text-lg">
                              {participant === 'cat' ? '🐱' : '🐄'}
                            </span>
                          ))}
                          <span className={`text-sm ml-1 ${
                            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                          }`}>
                            {getParticipantsText(event.participants)}
                          </span>
                        </div>
                        <div className={`w-3 h-3 ${
                          theme === 'pixel' 
                            ? `${getEventColor(event.participants).replace('bg-', 'bg-')} rounded-pixel border border-white`
                            : `${getEventColor(event.participants).replace('bg-', 'bg-')} rounded-full`
                        }`}></div>
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
              ? 'bg-pixel-panel border-4 border-white rounded-pixel shadow-pixel-lg neon-border' 
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
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="编辑"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={handleDeleteEvent}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
                {/* 没有权限时显示只读标识 */}
                {!canEditEvent(selectedEvent) && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                    <span className="text-xs text-gray-500">👁️ 只读</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {!isEditing ? (
              // 详情视图
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题
                  </label>
                  <p className="text-lg font-medium text-gray-900">{selectedEvent.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期
                  </label>
                  <p className="text-gray-900">
                    {formatDate(selectedEvent.originalDate || selectedEvent.date)}
                  </p>
                </div>

                {selectedEvent.time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      时间
                    </label>
                    <p className="text-gray-900">{selectedEvent.time}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    参与者
                  </label>
                  <p className="text-gray-900">{getParticipantsText(selectedEvent.participants)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重复
                  </label>
                  <p className="text-gray-900">
                    {selectedEvent.isRecurring 
                      ? `${getRecurrenceText(selectedEvent.recurrenceType!)}${
                          selectedEvent.recurrenceEnd 
                            ? `，直到 ${formatDate(selectedEvent.recurrenceEnd)}` 
                            : ''
                        }`
                      : '一次性事件'
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
                    {theme === 'pixel' ? 'RECURRENCE *' : '重复 *'}
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setEditEvent({...editEvent, isRecurring: false})}
                      className={`flex-1 py-2 px-4 border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                        theme === 'pixel'
                          ? `rounded-pixel font-mono uppercase ${
                              !editEvent.isRecurring
                                ? 'bg-pixel-info text-black border-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info'
                            }`
                          : `rounded-xl ${
                              !editEvent.isRecurring
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      <span>{theme === 'pixel' ? 'ONE_TIME' : '一次性'}</span>
                    </button>
                    <button
                      onClick={() => setEditEvent({...editEvent, isRecurring: true})}
                      className={`flex-1 py-2 px-4 border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                        theme === 'pixel'
                          ? `rounded-pixel font-mono uppercase ${
                              editEvent.isRecurring
                                ? 'bg-pixel-purple text-white border-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-purple'
                            }`
                          : `rounded-xl ${
                              editEvent.isRecurring
                                ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {theme === 'pixel' ? (
                        <PixelIcon name="refresh" size="sm" />
                      ) : (
                        <ArrowPathIcon className="w-4 h-4" />
                      )}
                      <span>{theme === 'pixel' ? 'REPEAT' : '重复'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. 重复频率 */}
                {editEvent.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      重复频率 *
                    </label>
                    <select
                      value={editEvent.recurrenceType || 'weekly'}
                      onChange={(e) => setEditEvent({...editEvent, recurrenceType: e.target.value as any})}
                      className="input-cutesy w-full"
                    >
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                      <option value="biweekly">每两周</option>
                      <option value="monthly">每月</option>
                      <option value="yearly">每年</option>
                    </select>
                  </div>
                )}

                {/* 4. 日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editEvent.isRecurring ? '起始日期' : '日期'} *
                  </label>
                  <input
                    type="date"
                    value={editEvent.date || ''}
                    onChange={(e) => setEditEvent({...editEvent, date: e.target.value})}
                    className="input-cutesy w-full"
                  />
                </div>

                {/* 5. 结束日期 */}
                {editEvent.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={editEvent.recurrenceEnd || ''}
                      onChange={(e) => setEditEvent({...editEvent, recurrenceEnd: e.target.value})}
                      className="input-cutesy w-full"
                      min={editEvent.date}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      留空则默认重复一年
                    </p>
                  </div>
                )}

                {/* 6. 时间 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间
                  </label>
                  <input
                    type="time"
                    value={editEvent.time || ''}
                    onChange={(e) => setEditEvent({...editEvent, time: e.target.value})}
                    className="input-cutesy w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    可选，不填写时间的话为全天事件
                  </p>
                </div>

                {/* 7. 参与者 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'PARTICIPANTS * (MULTI_SELECT)' : '参与者 * (可多选)'}
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => toggleEditParticipant('cat')}
                      className={`flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all duration-300 ${
                        theme === 'pixel'
                          ? `rounded-pixel font-mono ${
                              editEvent.participants?.includes('cat')
                                ? 'border-white bg-pixel-info text-black shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl ${
                              editEvent.participants?.includes('cat')
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-blue-300'
                            }`
                      }`}
                    >
                      <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                        theme === 'pixel'
                          ? `rounded-pixel ${
                              editEvent.participants?.includes('cat') 
                                ? 'border-black bg-black' 
                                : 'border-pixel-border'
                            }`
                          : `rounded ${
                              editEvent.participants?.includes('cat') 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`
                      }`}>
                        {editEvent.participants?.includes('cat') && (
                          <span className={`text-xs ${
                            theme === 'pixel' ? 'text-white' : 'text-white'
                          }`}>✓</span>
                        )}
                      </div>
                      <span className="text-2xl">🐱</span>
                      <span className={`font-medium ${
                        theme === 'pixel' ? 'font-mono uppercase' : ''
                      }`}>
                        {theme === 'pixel' ? 'WHIMSICAL_CAT' : 'Whimsical Cat'}
                      </span>
                    </div>

                    <div
                      onClick={() => toggleEditParticipant('cow')}
                      className={`flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all duration-300 ${
                        theme === 'pixel'
                          ? `rounded-pixel font-mono ${
                              editEvent.participants?.includes('cow')
                                ? 'border-white bg-pixel-purple text-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-purple hover:bg-pixel-card'
                            }`
                          : `rounded-xl ${
                              editEvent.participants?.includes('cow')
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-primary-300'
                            }`
                      }`}
                    >
                      <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                        theme === 'pixel'
                          ? `rounded-pixel ${
                              editEvent.participants?.includes('cow') 
                                ? 'border-black bg-black' 
                                : 'border-pixel-border'
                            }`
                          : `rounded ${
                              editEvent.participants?.includes('cow') 
                                ? 'border-primary-500 bg-primary-500' 
                                : 'border-gray-300'
                            }`
                      }`}>
                        {editEvent.participants?.includes('cow') && (
                          <span className={`text-xs ${
                            theme === 'pixel' ? 'text-white' : 'text-white'
                          }`}>✓</span>
                        )}
                      </div>
                      <span className="text-2xl">🐄</span>
                      <span className={`font-medium ${
                        theme === 'pixel' ? 'font-mono uppercase' : ''
                      }`}>
                        {theme === 'pixel' ? 'WHIMSICAL_COW' : 'Whimsical Cow'}
                      </span>
                    </div>
                  </div>
                  {(!editEvent.participants || editEvent.participants.length === 0) && (
                    <p className={`text-xs mt-1 ${
                      theme === 'pixel' 
                        ? 'text-pixel-accent font-mono uppercase' 
                        : 'text-red-500'
                    }`}>
                      {theme === 'pixel' ? 'SELECT_AT_LEAST_ONE_PARTICIPANT' : '请至少选择一个参与者'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              {isEditing ? (
                // 编辑模式下的按钮（只有有权限时才能进入编辑模式）
                canEditEvent(selectedEvent) && (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdateEvent}
                      disabled={!editEvent.title || !editEvent.date || !editEvent.participants?.length}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                        editEvent.title && editEvent.date && editEvent.participants?.length
                          ? 'btn-primary'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      保存
                    </button>
                  </>
                )
              ) : (
                // 查看模式下的关闭按钮
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 btn-primary"
                >
                  {canEditEvent(selectedEvent) ? '关闭' : '确定'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel border-4 border-white rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                : 'font-display text-gray-800'
            }`}>
              {theme === 'pixel' ? 'ADD_NEW_EVENT' : '添加新日程'}
            </h3>
            
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
                  {theme === 'pixel' ? 'RECURRENCE *' : '重复 *'}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setNewEvent({...newEvent, isRecurring: false})}
                    className={`flex-1 py-2 px-4 border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono uppercase ${
                            !newEvent.isRecurring
                              ? 'bg-pixel-info text-black border-white shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-info'
                          }`
                        : `rounded-xl ${
                            !newEvent.isRecurring
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`
                    }`}
                  >
                    <span>{theme === 'pixel' ? 'ONE_TIME' : '一次性'}</span>
                  </button>
                  <button
                    onClick={() => setNewEvent({...newEvent, isRecurring: true})}
                    className={`flex-1 py-2 px-4 border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono uppercase ${
                            newEvent.isRecurring
                              ? 'bg-pixel-purple text-white border-white shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-purple'
                          }`
                        : `rounded-xl ${
                            newEvent.isRecurring
                              ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`
                    }`}
                  >
                    {theme === 'pixel' ? (
                      <PixelIcon name="refresh" size="sm" />
                    ) : (
                      <ArrowPathIcon className="w-4 h-4" />
                    )}
                    <span>{theme === 'pixel' ? 'REPEAT' : '重复'}</span>
                  </button>
                </div>
              </div>

              {/* 3. 重复频率（如果选择重复） */}
              {newEvent.isRecurring && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'FREQUENCY *' : '重复频率 *'}
                  </label>
                  <select
                    value={newEvent.recurrenceType}
                    onChange={(e) => setNewEvent({...newEvent, recurrenceType: e.target.value as any})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                  >
                    <option value="daily">{theme === 'pixel' ? 'DAILY' : '每天'}</option>
                    <option value="weekly">{theme === 'pixel' ? 'WEEKLY' : '每周'}</option>
                    <option value="biweekly">{theme === 'pixel' ? 'BI_WEEKLY' : '每两周'}</option>
                    <option value="monthly">{theme === 'pixel' ? 'MONTHLY' : '每月'}</option>
                    <option value="yearly">{theme === 'pixel' ? 'YEARLY' : '每年'}</option>
                  </select>
                </div>
              )}

              {/* 4. 起始日期 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' 
                    ? (newEvent.isRecurring ? 'START_DATE *' : 'DATE *')
                    : (newEvent.isRecurring ? '起始日期' : '日期') + ' *'
                  }
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

              {/* 5. 结束日期（非必填，仅重复事件显示） */}
              {newEvent.isRecurring && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'pixel' 
                      ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                      : 'text-gray-700'
                  }`}>
                    {theme === 'pixel' ? 'END_DATE' : '结束日期'}
                  </label>
                  <input
                    type="date"
                    value={newEvent.recurrenceEnd}
                    onChange={(e) => setNewEvent({...newEvent, recurrenceEnd: e.target.value})}
                    className={`w-full ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                    min={newEvent.date}
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'pixel' 
                      ? 'text-pixel-textMuted font-mono' 
                      : 'text-gray-500'
                  }`}>
                    {theme === 'pixel' ? 'LEAVE_EMPTY_FOR_ONE_YEAR_DEFAULT' : '留空则默认重复一年'}
                  </p>
                </div>
              )}

              {/* 6. 时间（非必填） */}
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
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' ? 'OPTIONAL_LEAVE_EMPTY_FOR_ALL_DAY' : '可选，不填写时间的话为全天事件'}
                </p>
              </div>

              {/* 7. 参与者（可多选） */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'PARTICIPANTS * (MULTI_SELECT)' : '参与者 * (可多选)'}
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => toggleParticipant('cat')}
                    className={`flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all duration-300 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono ${
                            newEvent.participants.includes('cat')
                              ? 'border-white bg-pixel-info text-black shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                          }`
                        : `rounded-xl ${
                            newEvent.participants.includes('cat')
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-blue-300'
                          }`
                    }`}
                  >
                    <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                      theme === 'pixel'
                        ? `rounded-pixel ${
                            newEvent.participants.includes('cat') 
                              ? 'border-black bg-black' 
                              : 'border-pixel-border'
                          }`
                        : `rounded ${
                            newEvent.participants.includes('cat') 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`
                    }`}>
                      {newEvent.participants.includes('cat') && (
                        <span className={`text-xs ${
                          theme === 'pixel' ? 'text-white' : 'text-white'
                        }`}>✓</span>
                      )}
                    </div>
                    <span className="text-2xl">🐱</span>
                    <span className={`font-medium ${
                      theme === 'pixel' ? 'font-mono uppercase' : ''
                    }`}>
                      {theme === 'pixel' ? 'WHIMSICAL_CAT' : 'Whimsical Cat'}
                    </span>
                  </div>

                  <div
                    onClick={() => toggleParticipant('cow')}
                    className={`flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all duration-300 ${
                      theme === 'pixel'
                        ? `rounded-pixel font-mono ${
                            newEvent.participants.includes('cow')
                              ? 'border-white bg-pixel-purple text-white shadow-pixel neon-border'
                              : 'border-pixel-border text-pixel-text hover:border-pixel-purple hover:bg-pixel-card'
                          }`
                        : `rounded-xl ${
                            newEvent.participants.includes('cow')
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-primary-300'
                          }`
                    }`}
                  >
                    <div className={`w-4 h-4 border-2 flex items-center justify-center ${
                      theme === 'pixel'
                        ? `rounded-pixel ${
                            newEvent.participants.includes('cow') 
                              ? 'border-black bg-black' 
                              : 'border-pixel-border'
                          }`
                        : `rounded ${
                            newEvent.participants.includes('cow') 
                              ? 'border-primary-500 bg-primary-500' 
                              : 'border-gray-300'
                          }`
                    }`}>
                      {newEvent.participants.includes('cow') && (
                        <span className={`text-xs ${
                          theme === 'pixel' ? 'text-white' : 'text-white'
                        }`}>✓</span>
                      )}
                    </div>
                    <span className="text-2xl">🐄</span>
                    <span className={`font-medium ${
                      theme === 'pixel' ? 'font-mono uppercase' : ''
                    }`}>
                      {theme === 'pixel' ? 'WHIMSICAL_COW' : 'Whimsical Cow'}
                    </span>
                  </div>
                </div>
                {newEvent.participants.length === 0 && (
                  <p className={`text-xs mt-1 ${
                    theme === 'pixel' 
                      ? 'text-pixel-accent font-mono uppercase' 
                      : 'text-red-500'
                  }`}>
                    {theme === 'pixel' ? 'SELECT_AT_LEAST_ONE_PARTICIPANT' : '请至少选择一个参与者'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className={`flex-1 py-3 px-4 border-2 transition-all duration-300 ${
                  theme === 'pixel'
                    ? 'border-pixel-border text-pixel-text rounded-pixel hover:bg-pixel-card font-mono uppercase'
                    : 'border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50'
                }`}
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.date || newEvent.participants.length === 0}
                className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                    ? `rounded-pixel font-mono uppercase ${
                        newEvent.title && newEvent.date && newEvent.participants.length > 0
                          ? 'pixel-btn-neon text-white border-4 border-white'
                          : 'bg-pixel-card text-pixel-textMuted border-2 border-pixel-border cursor-not-allowed'
                      }`
                    : `rounded-xl ${
                        newEvent.title && newEvent.date && newEvent.participants.length > 0
                          ? 'btn-primary'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`
                }`}
              >
                {theme === 'pixel' ? 'ADD_EVENT' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;