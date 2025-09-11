'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { useEventData } from '../hooks/calendar/useEventData'
import { useEventForm } from '../hooks/calendar/useEventForm'
import FullCalendarComponent from './FullCalendarComponent'
import EventDetail from './calendar/EventDetail'
import EventForm from './calendar/EventForm'
import Icon from './ui/Icon'
import TodoList, { TodoListRef } from './calendar/TodoList'
import TaskList, { TaskListRef } from './calendar/TaskList'
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
import type { Task } from '../types/task'
import { convertUserTimeToUTC } from '../utils/timezoneService'
import { eventService } from '../services/eventService'
import { colorService, CoupleColors } from '../services/colorService'

const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme, useSidebarLayout } = useTheme()
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
  const [currentView, setCurrentView] = useState<'all' | 'my' | 'partner' | 'shared'>('my')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [coupleColors, setCoupleColors] = useState<CoupleColors | null>(null)
  const [todoListWidth, setTodoListWidth] = useState(() => {
    // 从localStorage恢复宽度设置，默认300px
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('todoListWidth')
      return saved ? parseInt(saved, 10) : 300
    }
    return 300
  })
  // 任务详情弹窗状态
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const todoListRef = useRef<TodoListRef>(null)
  const taskListRef = useRef<TaskListRef>(null)

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

  // 保存待办列表宽度到localStorage
  useEffect(() => {
    localStorage.setItem('todoListWidth', todoListWidth.toString())
  }, [todoListWidth])

  // 获取过滤后的事件
  const getFilteredEvents = useCallback((allEvents: Event[]): Event[] => {

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
          // 只显示伴侣的个人事件，排除共同事件
          return event.participants.includes(partnerIdForFiltering) && 
                 !event.participants.includes(currentUserId)
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

    // 过滤完成

    return filteredEvents
  }, [user, coupleUsers, currentView])

  // 处理事件点击
  const handleEventClick = useCallback((event: Event) => {
    openEventDetail(event)
  }, [openEventDetail])

  // 处理日期选择 - 自动打开新建事件弹窗，支持跨天选择
  const handleDateSelect = useCallback((
    date: string, 
    selectedTime?: string | null, 
    isAllDay?: boolean, 
    details?: {
      endDate: string
      endTime: string | null
      duration: { days: number; hours: number; isMultiDay: boolean }
      selectInfo: any
    }
  ) => {
    setSelectedDate(date)
    
    // 伴侣视图下不允许创建事件
    if (currentView === 'partner') {
      console.log('🚫 伴侣日历视图下不允许创建事件')
      return
    }
    
    // 智能设置默认值 - 支持跨天选择
    let defaultStart, defaultEnd, isAllDayEvent
    
    console.log('📅 处理日期选择:', {
      基础信息: { date, selectedTime, isAllDay },
      扩展信息: details
    })
    
    if (details?.duration.isMultiDay) {
      // 跨天选择 - 使用选择的完整时间范围
      if (isAllDay) {
        // 跨天全天事件
        defaultStart = `${date}T00:00:00`
        defaultEnd = `${details.endDate}T23:59:59`
        isAllDayEvent = true
        console.log('🌅 创建跨天全天事件:', { 开始: defaultStart, 结束: defaultEnd })
      } else {
        // 跨天定时事件
        defaultStart = `${date}T${selectedTime || '09:00'}:00`
        defaultEnd = `${details.endDate}T${details.endTime || '18:00'}:00`
        isAllDayEvent = false
        console.log('⏰ 创建跨天定时事件:', { 开始: defaultStart, 结束: defaultEnd })
      }
    } else {
      // 单天选择 - 原有逻辑
      if (isAllDay) {
        // 点击全天区域 - 创建全天事件
        defaultStart = ''
        defaultEnd = ''
        isAllDayEvent = true
      } else if (selectedTime) {
        // 点击具体时间槽 - 使用选择的时间
        defaultStart = `${date}T${selectedTime}:00`
        
        if (details?.endTime && details.endTime !== selectedTime) {
          // 选择了时间范围
          defaultEnd = `${date}T${details.endTime}:00`
        } else {
          // 单点选择，默认1小时
          const [hours, minutes] = selectedTime.split(':').map(Number)
          const endHour = hours + 1
          defaultEnd = `${date}T${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
        }
        isAllDayEvent = false
      } else {
        // 其他情况 - 使用当前时间+1小时
        const now = new Date()
        defaultStart = `${date}T${(now.getHours() + 1).toString().padStart(2, '0')}:00:00`
        defaultEnd = `${date}T${(now.getHours() + 2).toString().padStart(2, '0')}:00:00`
        isAllDayEvent = false
      }
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

  // 处理待办事项和任务拖拽到日历
  const handleTodoDrop = useCallback(async (todoData: any, date: string, time?: string | null) => {
    console.log('📅 处理待办事项/任务拖拽:', { todoData, date, time })
    
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
      description: todoData.fromTask 
        ? `从任务创建: ${todoData.title} (${todoData.points || 0}分)`
        : `从待办事项创建: ${todoData.title}`,
      includesUser1,
      includesUser2,
      // 🗑️ 移除date字段，因为createEvent不再需要它
      isRecurring: false,
      recurrenceType: null,
      recurrenceEnd: null,
      originalDate: '',
      extendedProps: {
        fromTask: todoData.fromTask || false,
        taskId: todoData.taskId,
        originalTask: todoData.originalTask,
        points: todoData.points || 0
      }
    }
    
    console.log(todoData.fromTask ? '🚀 从任务创建事件:' : '🚀 从待办事项创建事件:', eventData)
    
    try {
      // 使用现有的事件创建逻辑
      await handleEventSubmit('create', eventData)
      console.log(todoData.fromTask ? '✅ 任务成功转换为事件' : '✅ 待办事项成功转换为事件')
      
      // 成功后处理项目移除
      if (todoData.fromTask) {
        // 任务不从列表中移除，允许为同一任务创建多个日程时段
        console.log('📋 任务已创建日程事件，但保留在任务列表中供重复安排')
        if (taskListRef.current && taskListRef.current.removeTask) {
          // 调用handleTaskDropped进行日志记录，但不实际移除
          taskListRef.current.removeTask(todoData.taskId || todoData.id)
        }
      } else if (todoListRef.current && todoListRef.current.removeTodo) {
        // 待办事项正常移除（因为通常是一次性的）
        todoListRef.current.removeTodo(todoData.id)
      }
    } catch (error) {
      console.error(todoData.fromTask ? '❌ 任务转换失败:' : '❌ 待办事项转换失败:', error)
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

  console.log('📊 Calendar渲染状态:', {
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
    <div 
      className="h-full flex flex-col"
      style={{ 
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        padding: '0'
      }}
    >
      {/* 测试时区控制器 */}
      {process.env.NODE_ENV === 'development' && <TestTimezoneController />}

      {/* 主要内容区域 - 使用flex布局支持可调整宽度 */}
      <div 
        className="flex gap-4 relative" 
        style={{ 
          height: useSidebarLayout 
            ? 'calc(100vh - 2rem)' // 侧边栏布局：与TaskBoard一致
            : 'calc(100vh - 5rem)' // 顶部导航布局：与TaskBoard一致
        }}
      >
        {/* 左侧 To-Do List 和 Task List - 可调整宽度 */}
        <div className="flex-shrink-0 relative" style={{ width: `${todoListWidth}px` }}>
          <div className="sticky top-0 z-20 h-full flex flex-col gap-4">
            {/* 待办事项列表 - 占50%高度 */}
            <div className="flex-1 min-h-0">
              <TodoList 
                ref={todoListRef}
                useSidebarLayout={useSidebarLayout}
                onTodoDropped={(todoId) => {
                  console.log('📝 待办事项已从列表中移除:', todoId)
                }}
              />
            </div>
            
            {/* 任务列表 - 占50%高度 */}
            <div className="flex-1 min-h-0">
              <TaskList 
                ref={taskListRef}
                useSidebarLayout={useSidebarLayout}
                onTaskDropped={(taskId) => {
                  console.log('⚡ 任务已从列表中移除:', taskId)
                }}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                }}
              />
            </div>
          </div>

          {/* 拖拽调整宽度的手柄 */}
          <div 
            className="absolute top-0 -right-3 w-6 h-full cursor-col-resize z-30 flex items-center justify-center group"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = todoListWidth;
              
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(200, Math.min(600, startWidth + (e.clientX - startX)));
                setTodoListWidth(newWidth);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                // 拖拽结束后保存到localStorage
                localStorage.setItem('todoListWidth', todoListWidth.toString());
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {/* 拖拽指示器 - 三个竖线 */}
            <div className="flex flex-col items-center justify-center space-y-0.5 opacity-30 group-hover:opacity-60 transition-opacity">
              <div className="w-0.5 h-4 bg-muted-foreground rounded-full"></div>
              <div className="w-0.5 h-4 bg-muted-foreground rounded-full"></div>
              <div className="w-0.5 h-4 bg-muted-foreground rounded-full"></div>
            </div>
          </div>
        </div>

        {/* FullCalendar 主视图 - 占据剩余空间 */}
        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-10">
          <FullCalendarComponent
            events={filteredEvents}
            currentView={currentView}
            user={user}
            coupleUsers={coupleUsers}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
            onTodoDrop={handleTodoDrop}
            onViewChange={setCurrentView}
            onAddEvent={handleAddEvent}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            filteredEventsCount={filteredEvents.length}
            useSidebarLayout={useSidebarLayout}
                />
              </div>
                </div>
              </div>

      {/* 事件详情弹窗 */}
      <ThemeDialog open={showDetailModal} onOpenChange={(open) => !open && closeDetailModal()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing 
                ? (theme === 'pixel' ? 'EDIT_EVENT' : theme === 'modern' ? 'Edit Event' : '编辑事件')
                : (theme === 'pixel' ? 'EVENT_DETAILS' : theme === 'modern' ? 'Event Details' : '事件详情')
              }
            </DialogTitle>
            {theme === 'modern' ? (
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                onClick={closeDetailModal}
                aria-label="关闭"
              >
                <Icon name="x" size="sm" />
              </button>
            ) : (
              <button
                className={`rounded-full p-2 transition-colors ${
                  theme === 'pixel'
                    ? 'bg-pixel-card border-2 border-pixel-border hover:bg-pixel-accent text-pixel-text' 
                    : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}
                onClick={closeDetailModal}
                aria-label="关闭"
              >
                <Icon name="x" size="sm" />
              </button>
            )}
          </div>
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
          <div className="flex items-center justify-between">
            <DialogTitle>
              {theme === 'pixel' ? 'CREATE_EVENT' : theme === 'modern' ? 'Create Event' : '新建事件'}
            </DialogTitle>
            {theme === 'modern' ? (
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                onClick={() => setShowNewEventDialog(false)}
                aria-label="关闭"
              >
                <Icon name="x" size="sm" />
              </button>
            ) : (
              <button
                className={`rounded-full p-2 transition-colors ${
                  theme === 'pixel'
                    ? 'bg-pixel-card border-2 border-pixel-border hover:bg-pixel-accent text-pixel-text' 
                    : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => setShowNewEventDialog(false)}
                aria-label="关闭"
              >
                <Icon name="x" size="sm" />
              </button>
            )}
          </div>
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

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <ThemeDialog open={true} onOpenChange={() => setSelectedTask(null)}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {theme === 'pixel' ? 'TASK_DETAILS' : '任务详情'}
              </DialogTitle>
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                onClick={() => setSelectedTask(null)}
                aria-label="关闭"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              {/* 任务标题 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                )}
              </div>

              {/* 任务信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">状态：</span>
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                    selectedTask.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    selectedTask.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTask.status === 'assigned' ? '已分配' :
                     selectedTask.status === 'in_progress' ? '进行中' :
                     selectedTask.status === 'completed' ? '已完成' :
                     selectedTask.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">积分：</span>
                  <span className="ml-1 text-blue-600 font-semibold">{selectedTask.points}分</span>
                </div>
                {selectedTask.task_deadline && (
                  <div className="col-span-2">
                    <span className="font-medium">截止时间：</span>
                    <span className="ml-1">
                      {new Date(selectedTask.task_deadline).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between pt-4">
                <ThemeButton
                  onClick={() => {
                    // 跳转到任务页面的"我领取的"页面
                    window.location.hash = '#tasks?view=my_claimed';
                    setSelectedTask(null);
                  }}
                  variant="secondary"
                >
                  查看完整详情
                </ThemeButton>
                <ThemeButton
                  onClick={() => setSelectedTask(null)}
                  variant="primary"
                >
                  关闭
                </ThemeButton>
              </div>
            </div>
          </DialogContent>
        </ThemeDialog>
      )}
    </div>
  )
}

export default Calendar
