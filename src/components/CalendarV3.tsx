'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { useEventData } from '../hooks/calendar/useEventData'
import { useEventForm } from '../hooks/calendar/useEventForm'
import FullCalendarComponent from './FullCalendarComponent'
import EventDetail from './calendar/EventDetail'
import EventForm from './calendar/EventForm'
import DayView from './calendar/DayView'
import TodoList, { TodoListRef } from './calendar/TodoList'
import { ThemeButton } from './ui/Components'
import { Card } from './ui/card'
import LoadingSpinner from './ui/LoadingSpinner'
import { 
  ThemeDialog, 
  DialogHeader, 
  DialogTitle, 
  DialogContent, 
  DialogFooter,
  ConfirmDialog,
  RecurringEventActionDialog
} from './ui/Components'
import TestTimezoneController from './TestTimezoneController'
import type { Event, CalendarProps } from '../types/event'
import { convertUserTimeToUTC } from '../utils/timezoneService'
import { eventService } from '../services/eventService'
import { colorService, CoupleColors } from '../services/colorService'

const CalendarV3: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme } = useTheme()
  const { user } = useAuth()

  // 使用现有的数据管理hooks
  const eventData = useEventData(user)
  const eventForm = useEventForm(
    user,
    eventData.coupleId,
    eventData.coupleUsers,
    eventData.loadEvents,
    eventData.events
  )

  // 状态管理
  const [currentView, setCurrentView] = useState<'all' | 'my' | 'partner' | 'shared'>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [coupleColors, setCoupleColors] = useState<CoupleColors | null>(null)
  const todoListRef = useRef<TodoListRef>(null)

  const {
    events,
    loading,
    coupleUsers,
    isRefreshing,
    handleRefresh
  } = eventData

  const {
    showDetailModal,
    isEditing,
    selectedEvent,
    newEvent,
    editEvent,
    recurringActionDialog,
    confirmDialog,
    setNewEvent,
    setEditEvent,
    setIsEditing,
    setRecurringActionDialog,
    setConfirmDialog,
    handleEventSubmit,
    startEditWithScope,
    deleteEventWithScope,
    openEventDetail,
    closeDetailModal
  } = eventForm

  // 加载情侣颜色配置
  useEffect(() => {
    const loadCoupleColors = async () => {
      setCoupleColors(colorService.getDefaultColors())
    }
    
    loadCoupleColors()
  }, [coupleUsers])

  // 获取过滤后的事件
  const getFilteredEvents = useCallback((allEvents: Event[]): Event[] => {
    console.log('🔍 getFilteredEvents被调用:', {
      allEvents数量: allEvents.length,
      user存在: !!user,
      coupleUsers存在: !!coupleUsers,
      userId: user?.id,
      coupleUsersData: coupleUsers ? {
        user1: coupleUsers.user1.id,
        user2: coupleUsers.user2.id
      } : null
    });

    if (!user || !coupleUsers) {
      console.log('🚫 用户或情侣信息缺失，返回空数组');
      return []
    }
    
    console.log('🔍 开始过滤事件:', {
      总事件数: allEvents.length,
      当前视图: currentView,
      事件列表: allEvents.map(e => ({ 
        title: e.title, 
        participants: e.participants,
        date: e.date
      }))
    });

    const currentUserId = user.id
    const partnerIdForFiltering = coupleUsers.user1.id === currentUserId 
      ? coupleUsers.user2.id 
      : coupleUsers.user1.id

    let filteredEvents: Event[] = []
    
    switch (currentView) {
      case 'all':
        // 显示所有相关事件（我的 + 伴侣的 + 共同的）
        filteredEvents = allEvents.filter(event => {
          return event.participants.includes(currentUserId) || 
                 event.participants.includes(partnerIdForFiltering)
        })
        console.log('📋 全部事件过滤:', {
          原始数量: allEvents.length,
          过滤后数量: filteredEvents.length,
          过滤后事件: filteredEvents.map(e => e.title)
        })
        break
      case 'my':
        filteredEvents = allEvents.filter(event => {
          const includesMe = event.participants.includes(currentUserId)
          const includesPartner = event.participants.includes(partnerIdForFiltering)
          const isMyEvent = includesMe && !includesPartner
          
          console.log(`📋 我的事件过滤: ${event.title} - ${isMyEvent ? '✅' : '❌'}`, {
            事件参与者: event.participants,
            当前用户ID: currentUserId,
            伙伴ID: partnerIdForFiltering,
            包含我: includesMe,
            包含伙伴: includesPartner,
            是我的事件: isMyEvent
          })
          return isMyEvent
        })
        break
      case 'partner':
        filteredEvents = allEvents.filter(event => {
          return event.participants.includes(partnerIdForFiltering)
        })
        break
      case 'shared':
        filteredEvents = allEvents.filter(event => {
          return event.participants.includes(currentUserId) && 
                 event.participants.includes(partnerIdForFiltering)
        })
        break
      default:
        filteredEvents = allEvents
    }

    console.log('✅ 过滤完成:', {
      过滤后数量: filteredEvents.length,
      过滤后事件: filteredEvents.map(e => e.title)
    })

    return filteredEvents
  }, [user, coupleUsers, currentView])

  // 处理事件点击
  const handleEventClick = useCallback((event: Event) => {
    openEventDetail(event)
  }, [openEventDetail])

  // 处理日期选择 - 自动打开新建事件弹窗
  const handleDateSelect = useCallback((date: string, selectedTime?: string | null, isAllDay?: boolean) => {
    setSelectedDate(date)
    
    // 伴侣视图下不允许创建事件
    if (currentView === 'partner') {
      console.log('🚫 伴侣日历视图下不允许创建事件')
      return
    }
    
    // 智能设置默认值
    let defaultStart, defaultEnd, isAllDayEvent
    
    if (isAllDay) {
      // 点击全天区域 - 创建全天事件
      defaultStart = ''
      defaultEnd = ''
      isAllDayEvent = true
    } else if (selectedTime) {
      // 点击具体时间槽 - 使用选择的时间
      defaultStart = `${date}T${selectedTime}:00`
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const endHour = hours + 1
      defaultEnd = `${date}T${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      isAllDayEvent = false
    } else {
      // 其他情况 - 使用当前时间+1小时
      const now = new Date()
      defaultStart = `${date}T${(now.getHours() + 1).toString().padStart(2, '0')}:00:00`
      defaultEnd = `${date}T${(now.getHours() + 2).toString().padStart(2, '0')}:00:00`
      isAllDayEvent = false
    }
    
    // 智能设置参与者 - 根据当前视图决定是否为共同活动
    const isUser1 = coupleUsers && user && user.id === coupleUsers.user1.id
    let includesUser1, includesUser2
    
    if (currentView === 'shared') {
      // 共同日历视图 - 默认为共同活动
      includesUser1 = true
      includesUser2 = true
    } else {
      // 我的/伴侣视图 - 默认为个人活动
      includesUser1 = isUser1 ? true : false
      includesUser2 = isUser1 ? false : true
    }
    
    setNewEvent({
      title: '',
      location: '',
      startDateTime: defaultStart,
      endDateTime: defaultEnd,
      isAllDay: isAllDayEvent,
      description: '',
      includesUser1,
      includesUser2,
      isRecurring: false,
      recurrenceType: 'daily',
      recurrenceEnd: '',
      originalDate: ''
    })
    
    setShowNewEventDialog(true)
    
    // 🔇 隐藏日期选择调试信息
  }, [setNewEvent, coupleUsers, user, currentView])

  // 处理事件拖拽
  const handleEventDrop = useCallback(async (eventId: string, newDate: string, newTime?: string) => {
    console.log('🔄 事件拖拽更新:', { eventId, newDate, newTime });
    
    try {
      // 查找要更新的事件
      const eventToUpdate = eventData.events.find(e => e.id === eventId);
      if (!eventToUpdate) {
        console.error('❌ 找不到要更新的事件:', eventId);
        return;
      }

      // 🔧 检查是否是重复事件的展开实例
      const isExpandedInstance = eventId.includes('-') && eventId.match(/-\d{4}-\d{2}-\d{2}$/) !== null;
      const originalEventId = isExpandedInstance 
        ? eventId.split('-').slice(0, -3).join('-')  // 提取原始ID
        : eventId;

      console.log('🔄 事件拖拽分析:', {
        事件ID: eventId,
        是否展开实例: isExpandedInstance,
        原始ID: originalEventId,
        是否重复事件: eventToUpdate.isRecurring
      });

      // 🔧 重复事件实例拖拽现在支持单实例修改
      if (eventToUpdate.isRecurring && isExpandedInstance) {
        console.log('📅 重复事件实例拖拽 - 将修改单个实例');
      }

      // 构造新的开始和结束时间
      let newStartDateTime: string;
      let newEndDateTime: string;

      if (eventToUpdate.isAllDay) {
        // 全天事件：只更新日期
        newStartDateTime = `${newDate}T00:00:00`;
        newEndDateTime = `${newDate}T23:59:59`;
      } else {
        // 有时间的事件
        if (newTime) {
          // 使用拖拽到的新时间
          newStartDateTime = `${newDate}T${newTime}:00`;
          // 保持原有的持续时间
          const originalStart = new Date(eventToUpdate.rawStartTime ? `${eventToUpdate.date}T${eventToUpdate.rawStartTime}` : eventToUpdate.date);
          const originalEnd = new Date(eventToUpdate.rawEndTime ? `${eventToUpdate.date}T${eventToUpdate.rawEndTime}` : eventToUpdate.date);
          const durationMs = originalEnd.getTime() - originalStart.getTime();
          
          const newStart = new Date(`${newDate}T${newTime}:00`);
          const newEnd = new Date(newStart.getTime() + durationMs);
          
          newEndDateTime = newEnd.toISOString().slice(0, 19);
        } else {
          // 没有具体时间，使用原有时间但更新日期
          const originalTime = eventToUpdate.rawStartTime || '09:00:00';
          const originalEndTime = eventToUpdate.rawEndTime || '10:00:00';
          newStartDateTime = `${newDate}T${originalTime}`;
          newEndDateTime = `${newDate}T${originalEndTime}`;
        }
      }

      console.log('🕐 计算的新时间:', {
        原始事件: eventToUpdate.title,
        新开始时间: newStartDateTime,
        新结束时间: newEndDateTime
      });

      // 转换为UTC时间存储
      const utcStartDateTime = convertUserTimeToUTC(newStartDateTime);
      const utcEndDateTime = convertUserTimeToUTC(newEndDateTime);

      // 🔧 更新事件 - 区分重复事件的处理方式
      let updated = false;
      
      if (eventToUpdate.isRecurring && isExpandedInstance) {
        // 重复事件的展开实例 - 修改单个实例
        const instanceDate = eventToUpdate.originalDate || eventToUpdate.date;
        updated = await eventService.modifyRecurringEventInstance(originalEventId, instanceDate, {
          start_datetime: newStartDateTime, // 使用本地时间，函数内部会转换为UTC
          end_datetime: newEndDateTime,
          is_all_day: eventToUpdate.isAllDay
        });
      } else {
        // 非重复事件或原始重复事件 - 直接更新
        const targetEventId = eventToUpdate.isRecurring ? originalEventId : eventId;
        updated = await eventService.updateEvent(targetEventId, {
          start_datetime: utcStartDateTime,
          end_datetime: utcEndDateTime
        });
      }

      if (updated) {
        console.log('✅ 事件拖拽更新成功');
        // 触发事件重新加载 - useEventForm中的useEffect会自动同步selectedEvent
        await eventData.handleRefresh();
      }
    } catch (error) {
      console.error('❌ 事件拖拽更新失败:', error);
    }
  }, [eventData.events, eventData.handleRefresh])

  // 处理新建事件
  const handleAddEvent = useCallback(() => {
    // 🔧 如果没有选择日期，使用今天的日期
    const targetDate = selectedDate || new Date().toISOString().split('T')[0]
    
    // 设置默认时间
    const now = new Date()
    const defaultStart = `${targetDate}T${(now.getHours() + 1).toString().padStart(2, '0')}:00`
    const defaultEnd = `${targetDate}T${(now.getHours() + 2).toString().padStart(2, '0')}:00`
    
    setNewEvent({
      title: '',
      location: '',
      startDateTime: defaultStart,
      endDateTime: defaultEnd,
      isAllDay: false,
      description: '',
      includesUser1: true,
      includesUser2: true,
      isRecurring: false,
      recurrenceType: 'daily',
      recurrenceEnd: '',
      originalDate: ''
    })
    
    setShowNewEventDialog(true)
  }, [selectedDate, setNewEvent])

  // 获取选中日期的事件
  const getSelectedDateEvents = useCallback(() => {
    if (!selectedDate) return []
    const filteredEvents = getFilteredEvents(events)
    return filteredEvents.filter(event => event.date === selectedDate)
  }, [selectedDate, events, getFilteredEvents])

  // 处理待办事项拖拽到日历
  const handleTodoDrop = useCallback(async (todoData: any, date: string, time?: string | null) => {
    console.log('📅 处理待办事项拖拽:', { todoData, date, time })
    
    // 验证日期格式
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('❌ 无效的日期格式:', date)
      return
    }
    
    // 设置默认时间
    let startDateTime = ''
    let endDateTime = ''
    
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      // 有具体时间且格式正确
      startDateTime = `${date}T${time}:00`
      const [hours, minutes] = time.split(':').map(Number)
      
      // 验证时间范围
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('❌ 无效的时间值:', time)
        return
      }
      
      const endHour = hours + 1 > 23 ? 23 : hours + 1
      endDateTime = `${date}T${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
    } else {
      // 没有时间或时间格式错误，设为当前时间+1小时
      const now = new Date()
      const startHour = (now.getHours() + 1) % 24
      const endHour = (now.getHours() + 2) % 24
      startDateTime = `${date}T${startHour.toString().padStart(2, '0')}:00:00`
      endDateTime = `${date}T${endHour.toString().padStart(2, '0')}:00:00`
    }
    
    console.log('🕐 构造的时间字符串:', {
      开始时间: startDateTime,
      结束时间: endDateTime
    })
    
    // 验证构造的时间字符串
    try {
      const testStart = new Date(startDateTime)
      const testEnd = new Date(endDateTime)
      if (isNaN(testStart.getTime()) || isNaN(testEnd.getTime())) {
        console.error('❌ 构造的时间字符串无效:', { startDateTime, endDateTime })
        return
      }
    } catch (error) {
      console.error('❌ 时间字符串验证失败:', error)
      return
    }

    // 智能设置参与者
    const isUser1 = coupleUsers && user && user.id === coupleUsers.user1.id
    const includesUser1 = currentView === 'shared' ? true : (isUser1 ? true : false)
    const includesUser2 = currentView === 'shared' ? true : (isUser1 ? false : true)
    
    // 创建事件数据
    const eventData = {
      title: todoData.title,
      location: '',
      startDateTime,
      endDateTime,
      isAllDay: false,
      description: `从待办事项创建: ${todoData.title}`,
      includesUser1,
      includesUser2,
      // 🗑️ 移除date字段，因为createEvent不再需要它
      isRecurring: false,
      recurrenceType: null,
      recurrenceEnd: null,
      originalDate: ''
    }
    
    console.log('🚀 从待办事项创建事件:', eventData)
    
    try {
      // 使用现有的事件创建逻辑
      await handleEventSubmit('create', eventData)
      console.log('✅ 待办事项成功转换为事件')
      
      // 成功后从to-do list中移除待办事项
      if (todoListRef.current && todoListRef.current.removeTodo) {
        todoListRef.current.removeTodo(todoData.id)
      }
    } catch (error) {
      console.error('❌ 待办事项转换失败:', error)
    }
  }, [currentView, user, coupleUsers, handleEventSubmit])



  // 获取视图显示名称
  const getViewDisplayName = () => {
    switch (currentView) {
      case 'all': return '全部日程'
      case 'my': return '我的日程'
      case 'partner': return '伴侣日程'
      case 'shared': return '共同日程'
      default: return '所有日程'
    }
  }

  // 获取视图按钮的颜色样式
  const getViewThemeButtonStyle = (view: 'all' | 'my' | 'partner' | 'shared', isActive: boolean) => {
    if (!isActive) {
      return 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }

    // "全部"视图保持系统颜色
    if (view === 'all') {
      return 'bg-primary text-primary-foreground'
    }

    // 其他视图使用对应的用户颜色
    if (coupleColors && user && coupleUsers) {
      const user1Id = coupleUsers.user1.id
      const user2Id = coupleUsers.user2.id
      const currentUserId = user.id

      switch (view) {
        case 'my':
          const myColor = currentUserId === user1Id ? coupleColors.user1Color : coupleColors.user2Color
          return `text-white hover:opacity-90`
        case 'partner':
          const partnerColor = currentUserId === user1Id ? coupleColors.user2Color : coupleColors.user1Color
          return `text-white hover:opacity-90`
        case 'shared':
          return `text-white hover:opacity-90`
      }
    }

    // 降级到系统颜色
    return 'bg-primary text-primary-foreground'
  }

  // 获取视图按钮的背景颜色
  const getViewThemeButtonBackground = (view: 'all' | 'my' | 'partner' | 'shared', isActive: boolean) => {
    if (!isActive || view === 'all') return {}

    if (coupleColors && user && coupleUsers) {
      const user1Id = coupleUsers.user1.id
      const user2Id = coupleUsers.user2.id
      const currentUserId = user.id

      switch (view) {
        case 'my':
          const myColor = currentUserId === user1Id ? coupleColors.user1Color : coupleColors.user2Color
          return { backgroundColor: myColor }
        case 'partner':
          const partnerColor = currentUserId === user1Id ? coupleColors.user2Color : coupleColors.user1Color
          return { backgroundColor: partnerColor }
        case 'shared':
          return { backgroundColor: coupleColors.sharedColor }
      }
    }

    return {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  console.log('📊 CalendarV3渲染状态:', {
    events数量: events.length,
    user存在: !!user,
    coupleUsers存在: !!coupleUsers,
    currentView,
    loading
  })

  const filteredEvents = getFilteredEvents(events)
  
  console.log('🎯 传递给FullCalendar的事件:', {
    原始事件数: events.length,
    过滤后事件数: filteredEvents.length,
    过滤后事件: filteredEvents.map(e => ({ 
      title: e.title, 
      participants: e.participants,
      date: e.date,
      time: e.time
    }))
  })

  return (
    <div className="space-y-6">
      {/* 测试时区控制器 */}
      {process.env.NODE_ENV === 'development' && <TestTimezoneController />}
      
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'
            }`}>
              {theme === 'pixel' ? 'CALENDAR_V3.EXE' : '日历'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getViewDisplayName()} • {filteredEvents.length} 个事件
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* 视图切换按钮组 */}
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              {(['all', 'my', 'partner', 'shared'] as const).map((view) => {
                const isActive = currentView === view
                return (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`
                      h-8 px-3 rounded-md text-sm font-medium transition-all duration-200
                      ${getViewThemeButtonStyle(view, isActive)}
                    `}
                    style={getViewThemeButtonBackground(view, isActive)}
                  >
                    {view === 'all' && (theme === 'pixel' ? 'ALL' : '全部')}
                    {view === 'my' && (theme === 'pixel' ? 'MY' : '我的')}
                    {view === 'partner' && (theme === 'pixel' ? 'PTN' : '伴侣')}
                    {view === 'shared' && (theme === 'pixel' ? 'SHR' : '共同')}
                  </button>
                )
              })}
            </div>
            
            {/* 操作按钮组 */}
            <div className="flex items-center space-x-2">
              <ThemeButton
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? '刷新中...' : '刷新'}
              </ThemeButton>
              
              <ThemeButton
                onClick={handleAddEvent}
                variant="primary"
                size="sm"
              >
                添加日程
              </ThemeButton>
            </div>
          </div>
        </div>
        
        {/* 只读模式提示 */}
        {currentView === 'partner' && (
          <div className={`mt-3 inline-flex items-center text-xs px-3 py-1.5 rounded-full ${
            theme === 'pixel' 
              ? 'bg-pixel-panel text-pixel-textMuted font-mono border border-pixel-border'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            <span className="mr-1">⚠️</span>
            {theme === 'pixel' ? 'READ_ONLY_MODE' : '只读模式 - 查看伴侣日程'}
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        {/* 左侧 To-Do List - 粘性定位 */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 z-20">
            <TodoList 
              ref={todoListRef}
              onTodoDropped={(todoId) => {
                console.log('📝 待办事项已从列表中移除:', todoId)
              }}
            />
          </div>
        </div>

        {/* FullCalendar 主视图 */}
        <div className="lg:col-span-3">
          <FullCalendarComponent
            events={filteredEvents}
            currentView={currentView}
            user={user}
            coupleUsers={coupleUsers}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
            onTodoDrop={handleTodoDrop}
          />
        </div>
      </div>

      {/* 事件详情弹窗 */}
      <ThemeDialog open={showDetailModal} onOpenChange={(open) => !open && closeDetailModal()}>
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? (theme === 'pixel' ? 'EDIT_EVENT' : theme === 'modern' ? 'Edit Event' : '编辑事件')
              : (theme === 'pixel' ? 'EVENT_DETAILS' : theme === 'modern' ? 'Event Details' : '事件详情')
            }
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedEvent && !isEditing ? (
            <EventDetail
              event={selectedEvent}
              user={user}
              coupleUsers={coupleUsers}
              currentView={currentView}
              onEdit={() => {
                if (selectedEvent) {
                  // 🔧 直接进入编辑状态，不管是否为重复事件
                  startEditWithScope();
                }
              }}
              onDelete={() => {
                if (selectedEvent?.isRecurring) {
                  // 重复事件显示选择对话框
                  setRecurringActionDialog({
                    open: true,
                    onThisOnly: () => deleteEventWithScope('this_only'),
                    onThisAndFuture: () => deleteEventWithScope('this_and_future'),
                    onAllEvents: () => deleteEventWithScope('all_events')
                  });
                } else {
                  deleteEventWithScope('this_only');
                }
              }}
              onClose={closeDetailModal}
            />
          ) : selectedEvent && isEditing ? (
            <EventForm
              mode="edit"
              formData={editEvent}
              selectedDate={selectedEvent.date}
              coupleUsers={coupleUsers}
              user={user}
              onFormChange={(data) => setEditEvent(prev => ({ ...prev, ...data }))}
              onSubmit={(eventData) => {
                const mode = 'edit'
                if (selectedEvent?.isRecurring) {
                  // 重复事件显示选择对话框
                  setRecurringActionDialog({
                    open: true,
                    onThisOnly: () => {
                      handleEventSubmit(mode, eventData, 'this_only').then(() => {
                        setIsEditing(false);
                        setRecurringActionDialog(prev => ({ ...prev, open: false }));
                      });
                    },
                    onThisAndFuture: () => {
                      handleEventSubmit(mode, eventData, 'this_and_future').then(() => {
                        setIsEditing(false);
                        setRecurringActionDialog(prev => ({ ...prev, open: false }));
                      });
                    },
                    onAllEvents: () => {
                      handleEventSubmit(mode, eventData, 'all_events').then(() => {
                        setIsEditing(false);
                        setRecurringActionDialog(prev => ({ ...prev, open: false }));
                      });
                    }
                  });
                } else {
                  handleEventSubmit(mode, eventData).then(() => {
                    setIsEditing(false)
                  })
                }
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : null}
        </DialogContent>
      </ThemeDialog>

      {/* 新建事件弹窗 */}
      <ThemeDialog open={showNewEventDialog} onOpenChange={(open) => !open && setShowNewEventDialog(false)}>
        <DialogHeader>
          <DialogTitle>
            {theme === 'pixel' ? 'CREATE_EVENT' : theme === 'modern' ? 'Create Event' : '新建事件'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
                      <EventForm
              mode="create"
              formData={newEvent}
              selectedDate={selectedDate}
              coupleUsers={coupleUsers}
              user={user}
              onFormChange={(data) => setNewEvent(prev => ({ ...prev, ...data }))}
              onSubmit={(eventData) => {
                handleEventSubmit('create', eventData).then(() => {
                  setShowNewEventDialog(false)
                })
              }}
              onCancel={() => setShowNewEventDialog(false)}
            />
        </DialogContent>
      </ThemeDialog>

      {/* 重复事件操作对话框 */}
      <RecurringEventActionDialog
        open={recurringActionDialog.open}
        actionType="edit"
        onOpenChange={(open) => setRecurringActionDialog(prev => ({ ...prev, open }))}
        onThisOnly={recurringActionDialog.onThisOnly}
        onThisAndFuture={recurringActionDialog.onThisAndFuture}
        onAllEvents={recurringActionDialog.onAllEvents}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}

export default CalendarV3
