'use client'

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import type { Event } from '../types/event'
import { ThemeButton } from './ui/Components'
import { Card } from './ui/card'
import { colorService, CoupleColors } from '../services/colorService'

interface FullCalendarComponentProps {
  events: Event[]
  currentView: 'all' | 'my' | 'partner' | 'shared'
  user?: any
  coupleUsers?: {user1: any, user2: any} | null
  onEventClick?: (event: Event) => void
  onDateSelect?: (date: string, selectedTime?: string | null, isAllDay?: boolean) => void
  onEventDrop?: (eventId: string, newDate: string, newTime?: string) => void
  onTodoDrop?: (todoData: any, date: string, time?: string | null) => void
  className?: string
}

const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({
  events,
  currentView,
  user,
  coupleUsers,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onTodoDrop,
  className = ''
}) => {
  const { theme, isDarkMode } = useTheme()
  const [currentCalendarView, setCurrentCalendarView] = useState('timeGridWeek')
  const [coupleColors, setCoupleColors] = useState<CoupleColors | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  // 加载情侣颜色配置
  useEffect(() => {
    const loadCoupleColors = async () => {
      // 直接使用默认颜色配置，因为数据库中可能没有存储颜色配置
      // 后续可以根据需要从数据库加载自定义颜色
      setCoupleColors(colorService.getDefaultColors())
      
      console.log('🎨 已加载默认颜色配置:', colorService.getDefaultColors())
    }
    
    loadCoupleColors()
  }, [coupleUsers])

  // 判断事件是否包含指定用户
  const eventIncludesUser = useCallback((event: Event, userId: string) => {
    return event.participants.includes(userId)
  }, [])

  // 获取事件背景色
  const getEventBackgroundColor = useCallback((event: Event): string => {
    console.log('🎨 获取事件背景色:', {
      eventTitle: event.title,
      currentView,
      hasColors: !!coupleColors,
      hasUser: !!user,
      hasCoupleUsers: !!coupleUsers,
      participants: event.participants
    })
    
    // 如果在"全部"视图下且有颜色配置，使用基于用户的颜色编码
    if (currentView === 'all' && coupleColors && user && coupleUsers) {
      const user1Id = coupleUsers.user1.id
      const user2Id = coupleUsers.user2.id
      
      console.log('🔍 颜色判断条件:', {
        user1Id,
        user2Id,
        currentUserId: user.id,
        participants: event.participants
      })
      
      const eventColor = colorService.getEventColor(
        event.participants,
        user1Id,
        user2Id,
        coupleColors,
        eventIncludesUser
      )
      
      console.log('🎯 计算出的事件颜色:', eventColor)
      
      // 为像素主题保持原有风格
      if (theme === 'pixel') {
        return eventColor
      }
      
      // Modern主题使用纯色（FullCalendar不支持渐变）
      const hasUser1 = eventIncludesUser(event, user1Id)
      const hasUser2 = eventIncludesUser(event, user2Id)
      
      console.log('👥 用户参与情况:', {
        hasUser1,
        hasUser2,
        user1Id,
        user2Id
      })
      
      if (hasUser1 && hasUser2) {
        // 共同事件
        console.log('💚 共同事件颜色:', coupleColors.sharedColor)
        return coupleColors.sharedColor
      } else if (hasUser1) {
        // 用户1的事件
        console.log('💙 用户1事件颜色:', coupleColors.user1Color)
        return coupleColors.user1Color
      } else if (hasUser2) {
        // 用户2的事件  
        console.log('💜 用户2事件颜色:', coupleColors.user2Color)
        return coupleColors.user2Color
      }
    }
    
    console.log('⚪ 使用默认颜色逻辑')
    
    // 其他视图或无颜色配置时的默认逻辑
    if (theme === 'pixel') {
      if (event.participants.length > 1) return '#ec4899' // pink-500
      return '#3b82f6' // blue-500
    }
    
    // Modern主题渐变色
    if (event.participants.length > 1) {
      return 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' // pink to purple
    }
    return 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' // blue to cyan
  }, [theme, currentView, coupleColors, user, coupleUsers, eventIncludesUser])

  // 获取事件边框色
  const getEventBorderColor = useCallback((event: Event): string => {
    // 在"全部"视图下使用与背景色匹配的边框色
    if (currentView === 'all' && coupleColors && user && coupleUsers) {
      const user1Id = coupleUsers.user1.id
      const user2Id = coupleUsers.user2.id
      
      const borderColor = colorService.getEventColor(
        event.participants,
        user1Id,
        user2Id,
        coupleColors,
        eventIncludesUser
      )
      
      console.log('🔲 边框颜色:', borderColor)
      return borderColor
    }
    
    // 默认逻辑
    if (event.participants.length > 1) return '#ec4899'
    return '#3b82f6'
  }, [currentView, coupleColors, user, coupleUsers, eventIncludesUser])

  // 获取事件文字色
  const getEventTextColor = useCallback((event: Event): string => {
    return '#ffffff'
  }, [])

  // 获取事件CSS类名
  const getEventClassName = useCallback((event: Event): string => {
    // 为所有视图应用颜色编码，不仅仅是'all'视图
    if (coupleColors && user && coupleUsers) {
      const user1Id = coupleUsers.user1.id
      const user2Id = coupleUsers.user2.id
      const hasUser1 = eventIncludesUser(event, user1Id)
      const hasUser2 = eventIncludesUser(event, user2Id)
      
      console.log('🎨 事件分类:', {
        eventTitle: event.title,
        user1Id,
        user2Id,
        hasUser1,
        hasUser2,
        participants: event.participants,
        currentView
      })
      
      if (hasUser1 && hasUser2) {
        console.log('💚 共同事件:', event.title)
        return 'event-shared'
      } else if (hasUser1) {
        console.log('💙 用户1事件:', event.title)
        return 'event-user1'
      } else if (hasUser2) {
        console.log('💜 用户2事件:', event.title)
        return 'event-user2'
      }
    }
    console.log('⚪ 默认事件:', event.title)
    return 'event-default'
  }, [coupleColors, user, coupleUsers, eventIncludesUser])

  // 标题状态
  const [calendarTitle, setCalendarTitle] = useState('日历')

  // 更新标题
  const updateCalendarTitle = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      const currentDate = calendarApi.getDate()
      const view = calendarApi.view
      
      let title = ''
      if (view.type === 'dayGridMonth') {
        title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`
      } else if (view.type === 'timeGridWeek') {
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        title = `${weekStart.getFullYear()}年 第${Math.ceil(((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(weekStart.getFullYear(), 0, 1).getDay() + 1) / 7)}周`
      } else if (view.type === 'timeGridDay') {
        title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
      } else if (view.type === 'listWeek') {
        title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月 议程`
      }
      
      setCalendarTitle(title)
    }
  }, [])

  // 处理视图切换
  const handleViewChange = useCallback((view: string) => {
    setCurrentCalendarView(view)
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(view)
      // 延迟更新标题，确保视图已切换
      setTimeout(updateCalendarTitle, 100)
    }
  }, [updateCalendarTitle])

  // 处理导航
  const handlePrev = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev()
      setTimeout(updateCalendarTitle, 100)
    }
  }, [updateCalendarTitle])

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next()
      setTimeout(updateCalendarTitle, 100)
    }
  }, [updateCalendarTitle])

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today()
      setTimeout(updateCalendarTitle, 100)
    }
  }, [updateCalendarTitle])

  // 初始化标题
  React.useEffect(() => {
    if (calendarRef.current) {
      setTimeout(updateCalendarTitle, 100)
    }
  }, [updateCalendarTitle])

    // 将事件转换为FullCalendar格式
  const fullCalendarEvents = useMemo(() => {
    console.log('🔄 FullCalendar接收事件:', events.length, '个事件')
    
    if (!events || events.length === 0) {
      console.log('⚠️ FullCalendar没有接收到事件数据')
      return []
    }
    
    console.log('📋 接收到的事件详情:', events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      rawStartTime: e.rawStartTime,
      rawEndTime: e.rawEndTime,
      isAllDay: e.isAllDay,
      participants: e.participants,
      createdBy: e.createdBy
    })))
    
    // 移除测试事件，完全基于真实数据库数据
    
    const converted = events.map(event => {
      // 处理时间格式 - 确保使用正确的时间
      let startTime = event.date // 默认全天
      let endTime = undefined
      let isAllDay = true
      
      // 如果有具体时间，使用rawStartTime和rawEndTime
      if (event.rawStartTime && event.rawStartTime !== 'Invalid Date') {
        startTime = `${event.date}T${event.rawStartTime}`
        isAllDay = false
        
        if (event.rawEndTime && event.rawEndTime !== 'Invalid Date') {
          endTime = `${event.date}T${event.rawEndTime}`
        }
      }
      // 如果没有rawStartTime但有time字段，尝试解析time
      else if (event.time && event.time !== '全天' && event.time.includes(':')) {
        // time格式可能是 "10:00 - 11:00" 或 "10:00"
        const timeParts = event.time.split(' - ')
        if (timeParts.length >= 1) {
          const startTimePart = timeParts[0].trim()
          if (startTimePart.match(/^\d{1,2}:\d{2}$/)) {
            startTime = `${event.date}T${startTimePart}:00`
            isAllDay = false
            
            if (timeParts.length > 1) {
              const endTimePart = timeParts[1].trim()
              if (endTimePart.match(/^\d{1,2}:\d{2}$/)) {
                endTime = `${event.date}T${endTimePart}:00`
              }
            }
          }
        }
      }
      
      const fcEvent = {
        id: event.id,
        title: event.title,
        start: startTime,
        end: endTime,
        allDay: isAllDay,
        // 移除backgroundColor和borderColor，完全依赖CSS类名
        textColor: getEventTextColor(event),
        className: getEventClassName(event),
        extendedProps: {
          description: event.description,
          location: event.location,
          participants: event.participants,
          isShared: event.participants.length > 1,
          points: event.points || 0,
          originalEvent: event,
          category: event.category || 'general'
        }
      }
      
      console.log('📅 单个事件转换结果:', {
        原始事件: event.title,
        参与者: event.participants,
        文字色: fcEvent.textColor,
        CSS类名: fcEvent.className,
        FullCalendar格式: {
          id: fcEvent.id,
          title: fcEvent.title,
          start: fcEvent.start,
          end: fcEvent.end,
          allDay: fcEvent.allDay,
          textColor: fcEvent.textColor,
          className: fcEvent.className
        }
      });
      
      return fcEvent
    })
    
    console.log('✅ FullCalendar事件转换完成:', converted.length, '个事件')
    console.log('🎯 最终传递给FullCalendar的事件:', converted.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay
    })));
    
    return converted
  }, [events, currentView, theme, getEventBackgroundColor, getEventBorderColor, getEventTextColor])

  // 处理事件点击
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const originalEvent = clickInfo.event.extendedProps.originalEvent as Event
    if (onEventClick && originalEvent) {
      onEventClick(originalEvent)
    }
  }, [onEventClick])

  // 处理日期选择
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const dateStr = selectInfo.startStr.split('T')[0]
    const timeStr = selectInfo.startStr.includes('T') 
      ? selectInfo.startStr.split('T')[1].substring(0, 5) 
      : null
    
    // 检测是否是全天区域点击
    const isAllDayClick = selectInfo.allDay || !timeStr
    
    console.log('📅 FullCalendar日期选择:', {
      完整选择信息: selectInfo,
      开始时间: selectInfo.startStr,
      结束时间: selectInfo.endStr,
      提取日期: dateStr,
      提取时间: timeStr,
      是否全天点击: isAllDayClick,
      allDay属性: selectInfo.allDay
    })
    
    if (onDateSelect) {
      // 传递日期、时间和全天信息
      onDateSelect(dateStr, timeStr, isAllDayClick)
    }
  }, [onDateSelect])

  // 处理事件拖拽
  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    const eventId = dropInfo.event.id
    const newDate = dropInfo.event.startStr.split('T')[0]
    const newTime = dropInfo.event.startStr.includes('T') 
      ? dropInfo.event.startStr.split('T')[1].substring(0, 5) 
      : undefined
    
    if (onEventDrop) {
      onEventDrop(eventId, newDate, newTime)
    }
  }, [onEventDrop])



  // 处理事件接收（当外部元素被拖拽并创建事件时）
  const handleEventReceive = useCallback((eventInfo: any) => {
    console.log('📅 FullCalendar接收到新事件:', {
      完整eventInfo: eventInfo,
      event: eventInfo.event,
      draggedEl: eventInfo.draggedEl,
      eventStart: eventInfo.event?.start,
      eventStartStr: eventInfo.event?.startStr
    })
    
    // 伴侣视图下不允许拖拽创建
    if (currentView === 'partner') {
      console.log('🚫 伴侣日历视图下不允许拖拽创建事件')
      eventInfo.revert()
      return
    }
    
    try {
      const draggedEl = eventInfo.draggedEl
      const todoId = draggedEl?.getAttribute('data-todo-id')
      const todoTitle = draggedEl?.getAttribute('data-todo-title')
      
      if (todoId && todoTitle && onTodoDrop) {
        // 从事件对象获取日期时间
        const event = eventInfo.event
        let dropDate: string
        let dropTime: string | null = null
        
        if (event.start) {
          // 详细的时区调试信息
          const startDate = event.start
          console.log('🕐 详细时间分析:', {
            原始event_start: startDate,
            start_toString: startDate.toString(),
            start_toISOString: startDate.toISOString(),
            start_getTime: startDate.getTime(),
            本地年: startDate.getFullYear(),
            本地月: startDate.getMonth() + 1,
            本地日: startDate.getDate(),
            本地时: startDate.getHours(),
            本地分: startDate.getMinutes(),
            时区偏移: startDate.getTimezoneOffset(),
            用户时区: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
          
          // 检查startDate是否为UTC时间（通过时区偏移判断）
          const timezoneOffset = new Date().getTimezoneOffset() // 分钟
          const isLikelyUTC = Math.abs(startDate.getTimezoneOffset()) < 60 && timezoneOffset !== 0
          
          let actualDate: Date
          if (isLikelyUTC && timezoneOffset !== 0) {
            // 如果startDate看起来是UTC时间，需要转换为本地时间
            console.log('⚠️ 检测到可能的UTC时间，进行本地转换')
            actualDate = new Date(startDate.getTime() - (timezoneOffset * 60000))
          } else {
            // 直接使用startDate
            actualDate = startDate
          }
          
          // 使用调整后的时间
          const year = actualDate.getFullYear()
          const month = (actualDate.getMonth() + 1).toString().padStart(2, '0')
          const day = actualDate.getDate().toString().padStart(2, '0')
          dropDate = `${year}-${month}-${day}`
          
          if (!event.allDay) {
            const hours = actualDate.getHours().toString().padStart(2, '0')
            const minutes = actualDate.getMinutes().toString().padStart(2, '0')
            dropTime = `${hours}:${minutes}`
          }
          
          console.log('🔧 时区调整分析:', {
            原始startDate: startDate,
            startDate时区偏移: startDate.getTimezoneOffset(),
            本地时区偏移: timezoneOffset,
            是否疑似UTC: isLikelyUTC,
            调整后时间: actualDate,
            最终日期: dropDate,
            最终时间: dropTime
          })
          
          console.log('✅ 最终解析结果:', {
            dropDate,
            dropTime,
            构造的本地时间: dropTime ? `${dropDate}T${dropTime}:00` : `${dropDate} (全天)`
          })
        } else {
          console.error('❌ 无法从事件获取开始时间')
          return
        }
        
        console.log('📅 从FullCalendar事件解析:', {
          todoId,
          todoTitle,
          解析后日期: dropDate,
          解析后时间: dropTime,
          是否全天: event.allDay,
          原始start: event.start
        })
        
        // 阻止FullCalendar自动创建事件，我们手动处理
        eventInfo.revert()
        
        // 传递待办事项数据到我们的处理函数
        onTodoDrop({ id: todoId, title: todoTitle }, dropDate, dropTime)
      }
    } catch (error) {
      console.error('事件接收处理失败:', error)
      eventInfo.revert()
    }
  }, [onTodoDrop, currentView])

  // 自定义事件内容渲染
  const renderEventContent = (eventInfo: any) => {
    const { event, view } = eventInfo
    const isShared = event.extendedProps.isShared
    const points = event.extendedProps.points
    const category = event.extendedProps.category
    const location = event.extendedProps.location

    // 列表视图显示更详细的信息
    if (view.type === 'listWeek') {
      return (
        <div className={`
          flex flex-col space-y-1 p-2 rounded text-sm w-full
          ${theme === 'pixel' ? 'font-mono' : 'font-sans'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {isShared && <span className="text-xs">💕</span>}
              {category === 'date' && <span className="text-xs">🌹</span>}
              {category === 'task' && <span className="text-xs">🎯</span>}
              <span className="font-medium truncate">{event.title}</span>
            </div>
            {points > 0 && (
              <span className="ml-2 bg-yellow-200 text-yellow-800 px-1 rounded text-xs flex-shrink-0">
                +{points}
              </span>
            )}
          </div>
          {location && (
            <div className={`text-xs flex items-center space-x-1 ${
              theme === 'pixel' ? 'text-pixel-textMuted' : 'text-muted-foreground'
            }`}>
              <span>📍</span>
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      )
    }

    // 其他视图保持原有样式
    return (
      <div className={`
        flex items-center justify-between p-1 rounded text-xs
        ${theme === 'pixel' ? 'font-mono' : 'font-sans'}
        transition-all duration-200 hover:shadow-md
      `}>
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {isShared && <span className="text-xs">💕</span>}
          {category === 'date' && <span className="text-xs">🌹</span>}
          {category === 'task' && <span className="text-xs">🎯</span>}
          <span className="font-medium truncate">{event.title}</span>
        </div>
        {points > 0 && (
          <span className="ml-1 bg-yellow-200 text-yellow-800 px-1 rounded text-xs flex-shrink-0">
            +{points}
          </span>
        )}
      </div>
    )
  }

  // 工具栏配置
  const headerToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* 自定义工具栏 - 粘性定位 */}
      <div className="sticky top-6 z-30 bg-card/95 backdrop-blur-sm border-b pb-4 mb-6 -mx-4 px-4 -mt-4 pt-4">
        {/* 主工具栏：导航、标题、视图切换 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          {/* 左侧：导航按钮组 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              <ThemeButton
                onClick={handlePrev}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {theme === 'pixel' ? '<' : '←'}
              </ThemeButton>
              <ThemeButton
                onClick={handleNext}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {theme === 'pixel' ? '>' : '→'}
              </ThemeButton>
            </div>
            <ThemeButton
              onClick={handleToday}
              variant="secondary"
              size="sm"
            >
              {theme === 'pixel' ? 'TODAY' : '今天'}
            </ThemeButton>
          </div>

          {/* 中间：当前日期标题 */}
          <div className={`
            text-2xl font-bold text-center
            ${theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'}
          `}>
            {calendarTitle}
          </div>

          {/* 右侧：视图切换按钮组 */}
          <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
            <ThemeButton
              onClick={() => handleViewChange('dayGridMonth')}
              variant={currentCalendarView === 'dayGridMonth' ? 'primary' : 'secondary'}
              size="sm"
              className="h-8"
            >
              {theme === 'pixel' ? 'MON' : '月'}
            </ThemeButton>
            <ThemeButton
              onClick={() => handleViewChange('timeGridWeek')}
              variant={currentCalendarView === 'timeGridWeek' ? 'primary' : 'secondary'}
              size="sm"
              className="h-8"
            >
              {theme === 'pixel' ? 'WEK' : '周'}
            </ThemeButton>
            <ThemeButton
              onClick={() => handleViewChange('timeGridDay')}
              variant={currentCalendarView === 'timeGridDay' ? 'primary' : 'secondary'}
              size="sm"
              className="h-8"
            >
              {theme === 'pixel' ? 'DAY' : '日'}
            </ThemeButton>
            <ThemeButton
              onClick={() => handleViewChange('listWeek')}
              variant={currentCalendarView === 'listWeek' ? 'primary' : 'secondary'}
              size="sm"
              className="h-8"
            >
              {theme === 'pixel' ? 'LST' : '列表'}
            </ThemeButton>
          </div>
        </div>
        
        {/* 颜色图例 - 仅在全部视图下显示 */}
        {currentView === 'all' && coupleColors && user && coupleUsers && (
          <div className="flex items-center justify-center gap-6 mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: coupleColors.user1Color }}
              />
              <span className="text-sm text-muted-foreground">
                {coupleUsers.user1.display_name || '用户1'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: coupleColors.user2Color }}
              />
              <span className="text-sm text-muted-foreground">
                {coupleUsers.user2.display_name || '用户2'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: coupleColors.sharedColor }}
              />
              <span className="text-sm text-muted-foreground">
                {theme === 'pixel' ? 'SHARED' : '共同活动'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FullCalendar组件 */}
      <div className={`
        fullcalendar-container
        ${theme === 'pixel' ? 'pixel-calendar' : 
          theme === 'modern' ? `modern-calendar ${isDarkMode ? 'dark-calendar' : 'light-calendar'}` : 
          'modern-calendar'}
      `}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentCalendarView}
          headerToolbar={false} // 使用自定义工具栏
          events={fullCalendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventReceive={handleEventReceive}
          eventContent={renderEventContent}
          selectable={currentView !== 'partner'}
          selectMirror={currentView !== 'partner'}
          dayMaxEvents={true}
          weekends={true}
          editable={currentView !== 'partner'}
          droppable={true}
          height="auto"
          aspectRatio={1.35}
          locale="zh-cn"
          timeZone="local" // 使用本地时区
          forceEventDuration={true} // 强制事件持续时间
          firstDay={1} // 周一开始
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={true}
          allDayText="全天"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          nowIndicator={true}
          scrollTime="08:00:00"
          // 视图变化回调
          datesSet={updateCalendarTitle}
          viewDidMount={updateCalendarTitle}
        />
      </div>
    </Card>
  )
}

export default FullCalendarComponent
