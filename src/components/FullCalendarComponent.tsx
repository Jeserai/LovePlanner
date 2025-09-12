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
import { useTranslation } from '../utils/i18n'
import Icon from './ui/Icon'
import { CalendarIcon, ClockIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline'
import PixelIcon from './PixelIcon'

interface SelectionDetails {
  endDate: string
  endTime: string | null
  duration: {
    days: number
    hours: number
    isMultiDay: boolean
  }
  selectInfo: DateSelectArg
}

interface FullCalendarComponentProps {
  events: Event[]
  currentView: 'all' | 'my' | 'partner' | 'shared'
  user?: any
  coupleUsers?: {user1: any, user2: any} | null
  onEventClick?: (event: Event) => void
  onDateSelect?: (
    date: string, 
    selectedTime?: string | null, 
    isAllDay?: boolean, 
    details?: SelectionDetails
  ) => void
  onEventDrop?: (eventId: string, newDate: string, newTime?: string) => void
  onTodoDrop?: (todoData: any, date: string, time?: string | null) => void
  onViewChange?: (view: 'all' | 'my' | 'partner' | 'shared') => void
  onAddEvent?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  filteredEventsCount?: number
  className?: string
  useSidebarLayout?: boolean
  calendarWidth?: number
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
  onViewChange,
  onAddEvent,
  onRefresh,
  isRefreshing = false,
  filteredEventsCount = 0,
  className = '',
  useSidebarLayout = false,
  calendarWidth = 800
}) => {
  const { theme, isDarkMode, language } = useTheme()
  const t = useTranslation(language)
  const [currentCalendarView, setCurrentCalendarView] = useState('timeGridWeek')
  const [coupleColors, setCoupleColors] = useState<CoupleColors | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  // 根据容器宽度确定最适合的视图和配置
  const getResponsiveConfig = useMemo(() => {
    const width = calendarWidth
    
    // 定义断点
    const breakpoints = {
      mobile: 480,     // 极窄 - 强制列表视图
      tablet: 768,     // 中等 - 限制工具栏选项
      desktop: 1024    // 宽敞 - 完整功能
    }
    
    if (width <= breakpoints.mobile) {
      // 极窄模式：两行布局 + 图标化
      return {
        forcedView: 'listWeek',
        layoutMode: 'two-rows',
        useIcons: true,
        compactMode: true,
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          right: 'today'
        },
        availableViews: ['listWeek', 'listMonth']
      }
    } else if (width <= breakpoints.tablet) {
      // 中等宽度：紧凑单行布局
      return {
        forcedView: null,
        layoutMode: 'single-row-compact',
        useIcons: false,
        compactMode: true,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title', 
          right: 'timeGridWeek,listWeek'
        },
        availableViews: ['timeGridWeek', 'listWeek', 'dayGridMonth']
      }
    } else {
      // 宽敞模式：完整功能
      return {
        forcedView: null,
        layoutMode: 'single-row-full',
        useIcons: false,
        compactMode: false,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'listMonth']
      }
    }
  }, [calendarWidth])

  // 当容器宽度变化时，可能需要调整当前视图
  useEffect(() => {
    if (getResponsiveConfig.forcedView && currentCalendarView !== getResponsiveConfig.forcedView) {
      setCurrentCalendarView(getResponsiveConfig.forcedView)
    } else if (getResponsiveConfig.forcedView === null && getResponsiveConfig.availableViews.length > 0) {
      // 如果当前视图不在可用视图列表中，切换到第一个可用视图
      if (!getResponsiveConfig.availableViews.includes(currentCalendarView)) {
        setCurrentCalendarView(getResponsiveConfig.availableViews[0])
      }
    }
  }, [getResponsiveConfig, currentCalendarView])
  

  // 加载情侣颜色配置
  useEffect(() => {
    const loadCoupleColors = async () => {
      // 直接使用默认颜色配置，因为数据库中可能没有存储颜色配置
      // 后续可以根据需要从数据库加载自定义颜色
      setCoupleColors(colorService.getDefaultColors())
      
    }
    
    loadCoupleColors()
  }, [coupleUsers])

  // 获取视图按钮的颜色样式
  const getViewThemeButtonStyle = (view: 'all' | 'my' | 'partner' | 'shared', isActive: boolean) => {
    if (!isActive) {
      // 非活跃状态下，不同视图使用不同的hover颜色
      if (view === 'all') {
        return 'bg-transparent text-muted-foreground hover:bg-primary/20 hover:text-primary'
      }
      // 其他视图在hover时也显示对应的颜色（透明版本）
      return 'bg-transparent text-muted-foreground hover:text-white hover:bg-[var(--hover-bg)] transition-all duration-200'
    }

    // "全部"视图保持系统颜色
    if (view === 'all') {
      return 'bg-primary text-primary-foreground'
    }

    // 其他视图使用对应的用户颜色
    if (!coupleColors || !user || !coupleUsers) {
      return 'bg-primary text-primary-foreground'
    }

    return 'text-white'
  }

  // 获取视图按钮的背景颜色和hover样式
  const getViewThemeButtonBackground = (view: 'all' | 'my' | 'partner' | 'shared', isActive: boolean) => {
    if (view === 'all' || !coupleColors || !user || !coupleUsers) {
      return {}
    }

    const isUser1 = user.id === coupleUsers.user1.id
    
    if (isActive) {
      // 活跃状态的背景色
      switch (view) {
        case 'my':
          return { 
            backgroundColor: isUser1 ? coupleColors.user1Color : coupleColors.user2Color 
          }
        case 'partner':
          return { 
            backgroundColor: isUser1 ? coupleColors.user2Color : coupleColors.user1Color 
          }
        case 'shared':
          return { 
            backgroundColor: coupleColors.sharedColor 
          }
        default:
          return {}
      }
    } else {
      // 非活跃状态的hover背景色（使用CSS变量）
      switch (view) {
        case 'my':
          return { 
            '--hover-bg': isUser1 ? coupleColors.user1Color + '33' : coupleColors.user2Color + '33' // 20% 透明度
          } as React.CSSProperties
        case 'partner':
          return { 
            '--hover-bg': isUser1 ? coupleColors.user2Color + '33' : coupleColors.user1Color + '33'
          } as React.CSSProperties
        case 'shared':
          return { 
            '--hover-bg': coupleColors.sharedColor + '33'
          } as React.CSSProperties
        default:
          return {}
      }
    }
  }

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
      if (event.participants.length > 1) return '#8b5cf6' // 紫色 - 共同事件
      return '#3b82f6' // 蓝色 - 个人事件
    }
    
    // Modern主题使用纯色（不再使用渐变）
    if (event.participants.length > 1) {
      return '#8b5cf6' // 紫色 - 共同事件
    }
    return '#3b82f6' // 蓝色 - 个人事件
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
      
      if (hasUser1 && hasUser2) {
        return 'event-shared'
      } else if (hasUser1) {
        return 'event-user1'
      } else if (hasUser2) {
        return 'event-user2'
      }
    }
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
        if (language === 'zh') {
          title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`
        } else {
          title = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        }
      } else if (view.type === 'timeGridWeek') {
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        if (language === 'zh') {
          const weekNumber = Math.ceil(((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(weekStart.getFullYear(), 0, 1).getDay() + 1) / 7)
          title = `${weekStart.getFullYear()}年 第${weekNumber}周`
        } else {
          title = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      } else if (view.type === 'timeGridDay') {
        if (language === 'zh') {
          title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
        } else {
          title = currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      } else if (view.type === 'listWeek') {
        if (language === 'zh') {
          title = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月 议程`
        } else {
          title = `${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} Agenda`
        }
      }
      
      setCalendarTitle(title)
    }
  }, [language])

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

  // 语言变化时更新标题
  React.useEffect(() => {
    if (calendarRef.current) {
      setTimeout(updateCalendarTitle, 100)
    }
  }, [language, updateCalendarTitle])

  // 将事件转换为FullCalendar格式
  const fullCalendarEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return []
    }
    
    // 移除测试事件，完全基于真实数据库数据
    
    const converted = events.map(event => {
      // 🔧 修复跨天事件显示 - 直接使用数据库的完整时间信息
      let startTime = event.date // 默认全天
      let endTime = undefined
      let isAllDay = true
      
      
      // 🚨 重要：跨天事件检测
      let isPotentialMultiDay = false
      if (event.rawStartTime && event.rawEndTime && 
          event.rawStartTime.includes(' ') && event.rawEndTime.includes(' ')) {
        const startDatePart = event.rawStartTime.split(' ')[0]
        const endDatePart = event.rawEndTime.split(' ')[0]
        isPotentialMultiDay = startDatePart !== endDatePart
        
        if (isPotentialMultiDay) {
          console.log('🌅 检测到潜在跨天事件:', {
            事件: event.title,
            开始日期: startDatePart,
            结束日期: endDatePart
          })
        }
      }
      
      // 🚨 首先检查time字段是否包含完整的跨天信息
      if (event.time && event.time.includes(' - ') && event.time.includes('/')) {
        // time字段格式：2025/09/01 14:00:00 - 2025/09/02 15:00:00
        const timeParts = event.time.split(' - ')
        if (timeParts.length === 2) {
          const startPart = timeParts[0].trim() // "2025/09/01 14:00:00"
          const endPart = timeParts[1].trim()   // "2025/09/02 15:00:00"
          
          if (startPart.includes(' ') && endPart.includes(' ')) {
            // 转换开始时间
            const startParts = startPart.split(' ')
            const startDate = startParts[0].replace(/\//g, '-') // "2025-09-01"
            const startTime_part = startParts[1] // "14:00:00"
            startTime = `${startDate}T${startTime_part}`
            
            // 转换结束时间
            const endParts = endPart.split(' ')
            const endDate = endParts[0].replace(/\//g, '-') // "2025-09-02"
            const endTime_part = endParts[1] // "15:00:00"
            endTime = `${endDate}T${endTime_part}`
            
            isAllDay = false
            
          }
        }
      }
      // 如果time字段没有完整信息，再使用rawStartTime和rawEndTime
      else if (event.rawStartTime && event.rawStartTime !== 'Invalid Date') {
        // rawStartTime格式是 "2025/09/06 04:00:00" (中文本地化格式)
        if (event.rawStartTime.includes(' ')) {
          // 完整的日期时间格式：转换为ISO格式
          const parts = event.rawStartTime.split(' ')
          const datePart = parts[0].replace(/\//g, '-') // "2025/09/06" -> "2025-09-06"
          const timePart = parts[1] // "04:00:00"
          startTime = `${datePart}T${timePart}`
        } else if (event.rawStartTime.includes(':')) {
          // 只有时间部分，使用event.date作为日期
          startTime = `${event.date}T${event.rawStartTime}`
        } else {
          // 其他格式，尝试直接解析
          startTime = event.rawStartTime
        }
        isAllDay = false
        
        if (event.rawEndTime && event.rawEndTime !== 'Invalid Date') {
          // rawEndTime格式处理
          if (event.rawEndTime.includes(' ')) {
            // 完整的日期时间格式：转换为ISO格式
            const parts = event.rawEndTime.split(' ')
            const datePart = parts[0].replace(/\//g, '-') // "2025/09/06" -> "2025-09-06"
            const timePart = parts[1] // "04:00:00"
            endTime = `${datePart}T${timePart}`
            
          } else if (event.rawEndTime.includes(':')) {
            // 只有时间部分，需要判断是否跨天
            const startTimeStr = startTime.split('T')[1]
            const endTimeStr = event.rawEndTime
            
            // 如果结束时间小于开始时间，说明跨天了
            const startHour = parseInt(startTimeStr.split(':')[0])
            const endHour = parseInt(endTimeStr.split(':')[0])
            
            if (endHour < startHour || (endHour === startHour && endTimeStr < startTimeStr)) {
              // 跨天：结束时间在第二天
              const startDate = new Date(startTime.split('T')[0])
              const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // +1天
              endTime = `${endDate.toISOString().split('T')[0]}T${endTimeStr}`
            } else {
              // 同天
              const startDatePart = startTime.split('T')[0]
              endTime = `${startDatePart}T${endTimeStr}`
            }
          } else {
            // 其他格式，尝试直接使用
            endTime = event.rawEndTime
          }
        } else {
          // 如果没有结束时间，默认设置为开始时间+1小时
          const startDate = new Date(startTime)
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1小时
            endTime = endDate.toISOString().slice(0, 19)
          }
        }
      }
      // 如果没有rawStartTime但有time字段，尝试解析time（保持向后兼容）
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
            } else {
              // 如果只有开始时间，没有结束时间，默认设置为开始时间+1小时
              const [hours, minutes] = startTimePart.split(':').map(Number);
              const endHours = hours + 1;
              const endTimeString = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
              endTime = `${event.date}T${endTimeString}`;
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
        // 只保留CSS类名，让FullCalendar完全控制渲染
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
      
      
      return fcEvent
    })
    
    
    // 🔍 专门检查跨天事件
    const multiDayEvents = converted.filter(e => 
      e.start && e.end && e.start.split('T')[0] !== e.end.split('T')[0]
    );
    
    
    return converted
  }, [events, currentView, theme, getEventBackgroundColor, getEventBorderColor, getEventTextColor])

  // 简化的事件调试
  const handleEventDidMount = useCallback((info: any) => {
    if (info.el && info.event.start && info.event.end) {
      const startTime = info.event.start;
      const endTime = info.event.end;
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
    }
  }, []);

  // 处理事件点击
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const originalEvent = clickInfo.event.extendedProps.originalEvent as Event
    if (onEventClick && originalEvent) {
      onEventClick(originalEvent)
    }
  }, [onEventClick])

  // 处理日期选择 - 支持跨天和区域选择
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const startDate = selectInfo.start
    const endDate = selectInfo.end
    const isAllDay = selectInfo.allDay
    
    // 计算选择的时长
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))
    const durationHours = durationMs / (1000 * 60 * 60)
    
    // 格式化时间
    const startDateStr = startDate.toISOString().split('T')[0]
    const startTimeStr = isAllDay ? null : startDate.toTimeString().substring(0, 5)
    const endDateStr = endDate.toISOString().split('T')[0]
    const endTimeStr = isAllDay ? null : endDate.toTimeString().substring(0, 5)
    
    console.log('📅 FullCalendar区域选择:', {
      开始时间: selectInfo.startStr,
      结束时间: selectInfo.endStr,
      开始日期: startDateStr,
      结束日期: endDateStr,
      开始时间点: startTimeStr,
      结束时间点: endTimeStr,
      是否全天: isAllDay,
      持续天数: durationDays,
      持续小时: durationHours.toFixed(1),
      是否跨天: startDateStr !== endDateStr,
      视图类型: selectInfo.view.type
    })
    
    if (onDateSelect) {
      // 扩展回调参数，支持跨天选择
      onDateSelect(startDateStr, startTimeStr, isAllDay, {
        endDate: endDateStr,
        endTime: endTimeStr,
        duration: {
          days: durationDays,
          hours: durationHours,
          isMultiDay: startDateStr !== endDateStr
        },
        selectInfo: selectInfo // 传递完整的选择信息
      })
    }
    
    // 自动取消选择（可选）
    setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().unselect()
      }
    }, 100)
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
      const taskId = draggedEl?.getAttribute('data-task-id')
      const taskTitle = draggedEl?.getAttribute('data-task-title')
      const taskPoints = draggedEl?.getAttribute('data-task-points')
      
      console.log('🎯 Drop事件检测到的数据:', {
        todoId, todoTitle,
        taskId, taskTitle, taskPoints
      })
      
      if ((todoId && todoTitle) || (taskId && taskTitle)) {
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
          
          // 时区调整日志仅在开发模式下显示
          if (process.env.NODE_ENV === 'development') {
            console.log('📅 待办事项拖拽解析:', { dropDate, dropTime, isAllDay: !dropTime })
          }
        } else {
          console.error('❌ 无法从事件获取开始时间')
          return
        }
        
        console.log('📅 从FullCalendar事件解析:', {
          todoId, todoTitle,
          taskId, taskTitle, taskPoints,
          解析后日期: dropDate,
          解析后时间: dropTime,
          是否全天: event.allDay,
          原始start: event.start
        })
        
        // 阻止FullCalendar自动创建事件，我们手动处理
        eventInfo.revert()
        
        // 根据拖拽类型传递数据
        if (todoId && todoTitle && onTodoDrop) {
          // 传递待办事项数据
          onTodoDrop({ id: todoId, title: todoTitle }, dropDate, dropTime)
        } else if (taskId && taskTitle && onTodoDrop) {
          // 传递任务数据
          onTodoDrop({ 
            id: taskId, 
            title: taskTitle, 
            taskId: taskId,
            points: parseInt(taskPoints) || 0,
            fromTask: true,
            originalTask: { id: taskId, title: taskTitle, points: parseInt(taskPoints) || 0 }
          }, dropDate, dropTime)
        }
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

  // 响应式工具栏配置
  const headerToolbar = getResponsiveConfig.headerToolbar

  return (
    <Card 
      className={`p-0 ${className} flex flex-col overflow-hidden`} 
      style={{ 
        height: useSidebarLayout 
          ? 'calc(100vh - 6rem)'  // 侧边栏布局：减去TopBar(4rem) + padding(2rem)
          : 'calc(100vh - 5rem)',  // 顶部导航布局：减去header + padding
        minHeight: '600px' // 确保最小高度
      }}
    >
      {/* 工具栏 - 响应式布局 */}
      <div className="bg-card border-b p-4 flex-shrink-0">
        {getResponsiveConfig.layoutMode === 'two-rows' ? (
          /* 两行布局 - 用于极窄屏幕 */
          <div className="space-y-3">
            {/* 第一行：上一周 + 标题 + 下一周 */}
            <div className="flex items-center justify-between">
              <ThemeButton
                onClick={handlePrev}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {theme === 'pixel' ? '<' : '←'}
              </ThemeButton>
              <div className={`
                text-lg font-bold text-center flex-1
                ${theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'}
              `}>
                {calendarTitle}
              </div>
              <ThemeButton
                onClick={handleNext}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {theme === 'pixel' ? '>' : '→'}
              </ThemeButton>
            </div>

            {/* 第二行：今天 + 视图切换 + 事件过滤 */}
            <div className="flex items-center justify-between space-x-2">
              {/* 左侧：今天 + 视图切换 */}
              <div className="flex items-center space-x-2">
                <ThemeButton
                  onClick={handleToday}
                  variant="secondary"
                  size="sm"
                  className="p-2"
                  title={theme === 'pixel' ? 'TODAY' : t('today')}
                >
                  {theme === 'pixel' ? (
                    <PixelIcon name="calendar" className="w-4 h-4" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )}
                </ThemeButton>
                <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1 flex-shrink-0">
                {getResponsiveConfig.availableViews.includes('dayGridMonth') && (
                  <ThemeButton
                    onClick={() => handleViewChange('dayGridMonth')}
                    variant={currentCalendarView === 'dayGridMonth' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={theme === 'pixel' ? 'MON' : t('month')}
                  >
                    {theme === 'pixel' ? 'M' : '月'}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('timeGridWeek') && (
                  <ThemeButton
                    onClick={() => handleViewChange('timeGridWeek')}
                    variant={currentCalendarView === 'timeGridWeek' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={theme === 'pixel' ? 'WEK' : t('week')}
                  >
                    {theme === 'pixel' ? 'W' : '周'}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('timeGridDay') && (
                  <ThemeButton
                    onClick={() => handleViewChange('timeGridDay')}
                    variant={currentCalendarView === 'timeGridDay' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={theme === 'pixel' ? 'DAY' : t('day')}
                  >
                    {theme === 'pixel' ? 'D' : '日'}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('listWeek') && (
                  <ThemeButton
                    onClick={() => handleViewChange('listWeek')}
                    variant={currentCalendarView === 'listWeek' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={theme === 'pixel' ? 'LST' : t('list')}
                  >
                    {theme === 'pixel' ? 'L' : '列'}
                  </ThemeButton>
                )}
                </div>
              </div>

              {/* 右侧：事件过滤 + 操作按钮 */}
              <div className="flex items-center space-x-2">
              {/* 事件过滤按钮组 - 极窄模式下简化为图标 */}
              {onViewChange && (
                <div className="flex items-center space-x-1 bg-muted/30 rounded-lg p-1 flex-shrink-0">
                  {(['all', 'my', 'partner', 'shared'] as const).map((view) => {
                    const isActive = currentView === view
                    return (
                      <button
                        key={view}
                        onClick={() => onViewChange(view)}
                        className={`
                          h-8 w-8 rounded-md text-xs font-medium transition-all duration-200 flex-shrink-0 flex items-center justify-center
                          ${getViewThemeButtonStyle(view, isActive)}
                        `}
                        style={getViewThemeButtonBackground(view, isActive)}
                        title={
                          view === 'all' ? (theme === 'pixel' ? 'ALL' : t('all')) :
                          view === 'my' ? (theme === 'pixel' ? 'MY' : t('my')) :
                          view === 'partner' ? (theme === 'pixel' ? 'PTN' : t('partner')) :
                          (theme === 'pixel' ? 'SHR' : t('shared'))
                        }
                      >
                        {view === 'all' && (theme === 'pixel' ? 'A' : '全')}
                        {view === 'my' && (theme === 'pixel' ? 'M' : '我')}
                        {view === 'partner' && (theme === 'pixel' ? 'P' : '伴')}
                        {view === 'shared' && (theme === 'pixel' ? 'S' : '共')}
                      </button>
                    )
                  })}
                </div>
              )}
              
              {/* 操作按钮组 */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {onRefresh && (
                  <ThemeButton
                    onClick={onRefresh}
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={isRefreshing}
                    title={isRefreshing ? t('loading') : t('refresh')}
                  >
                    {theme === 'pixel' ? (
                      <PixelIcon name="refresh" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    ) : (
                      <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    )}
                  </ThemeButton>
                )}
                
                {onAddEvent && (
                  <ThemeButton
                    onClick={onAddEvent}
                    variant="primary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={t('add_event')}
                  >
                    {theme === 'pixel' ? (
                      <PixelIcon name="plus" className="w-4 h-4" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                  </ThemeButton>
                )}
              </div>
              </div>
            </div>
          </div>
        ) : (
          /* 单行布局 - 用于中等和宽屏 */
          <div className={`flex ${getResponsiveConfig.layoutMode === 'single-row-compact' ? 'flex-col space-y-2' : 'flex-row'} items-center justify-between gap-2 ${getResponsiveConfig.layoutMode === 'single-row-full' ? 'xl:gap-4' : 'gap-2'}`}>
            {/* 左侧：上一周按钮 */}
            <ThemeButton
              onClick={handlePrev}
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {theme === 'pixel' ? '<' : '←'}
            </ThemeButton>

            {/* 中间：标题和统计信息 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className={`
                ${getResponsiveConfig.compactMode ? 'text-lg' : 'text-2xl'} font-bold whitespace-nowrap
                ${theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'}
              `}>
                {calendarTitle}
              </div>
              {!getResponsiveConfig.compactMode && (
                <div className="text-sm text-muted-foreground mt-1">
                  {currentView === 'all' ? t('all_calendar') : 
                   currentView === 'my' ? t('my_calendar') : 
                   currentView === 'partner' ? t('partner_calendar') : 
                   t('shared_calendar')} • {filteredEventsCount} {language === 'zh' ? '个事件' : 'events'}
                </div>
              )}
            </div>

            {/* 右侧第一部分：下一周按钮 */}
            <ThemeButton
              onClick={handleNext}
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {theme === 'pixel' ? '>' : '→'}
            </ThemeButton>

            {/* 右侧第二部分：今天 + 视图切换 + 事件过滤 + 操作按钮 */}
            <div className="flex items-center space-x-2 justify-center xl:justify-end flex-shrink-0">
              {/* 今天按钮 */}
              <ThemeButton
                onClick={handleToday}
                variant="secondary"
                size="sm"
                className={getResponsiveConfig.compactMode ? "p-2" : ""}
                title={getResponsiveConfig.compactMode ? (theme === 'pixel' ? 'TODAY' : t('today')) : undefined}
              >
                {getResponsiveConfig.compactMode ? (
                  theme === 'pixel' ? (
                    <PixelIcon name="calendar" className="w-4 h-4" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )
                ) : (
                  theme === 'pixel' ? 'TODAY' : t('today')
                )}
              </ThemeButton>
              {/* 日历视图切换 - 响应式显示 */}
              <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1 flex-shrink-0">
                {getResponsiveConfig.availableViews.includes('dayGridMonth') && (
                  <ThemeButton
                    onClick={() => handleViewChange('dayGridMonth')}
                    variant={currentCalendarView === 'dayGridMonth' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 px-2"
                  >
                    {theme === 'pixel' ? 'MON' : t('month')}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('timeGridWeek') && (
                  <ThemeButton
                    onClick={() => handleViewChange('timeGridWeek')}
                    variant={currentCalendarView === 'timeGridWeek' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 px-2"
                  >
                    {theme === 'pixel' ? 'WEK' : t('week')}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('timeGridDay') && (
                  <ThemeButton
                    onClick={() => handleViewChange('timeGridDay')}
                    variant={currentCalendarView === 'timeGridDay' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 px-2"
                  >
                    {theme === 'pixel' ? 'DAY' : t('day')}
                  </ThemeButton>
                )}
                {getResponsiveConfig.availableViews.includes('listWeek') && (
                  <ThemeButton
                    onClick={() => handleViewChange('listWeek')}
                    variant={currentCalendarView === 'listWeek' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 px-2"
                  >
                    {theme === 'pixel' ? 'LST' : t('list')}
                  </ThemeButton>
                )}
              </div>

              {/* 事件过滤按钮组 */}
              {onViewChange && (
                <div className="flex items-center space-x-1 bg-muted/30 rounded-lg p-1 flex-shrink-0">
                  {(['all', 'my', 'partner', 'shared'] as const).map((view) => {
                    const isActive = currentView === view
                    return (
                      <button
                        key={view}
                        onClick={() => onViewChange(view)}
                        className={`
                          h-8 ${getResponsiveConfig.compactMode ? 'w-8 text-xs' : 'px-3'} rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 flex items-center justify-center
                          ${getViewThemeButtonStyle(view, isActive)}
                        `}
                        style={getViewThemeButtonBackground(view, isActive)}
                        title={getResponsiveConfig.compactMode ? (
                          view === 'all' ? (theme === 'pixel' ? 'ALL' : t('all')) :
                          view === 'my' ? (theme === 'pixel' ? 'MY' : t('my')) :
                          view === 'partner' ? (theme === 'pixel' ? 'PTN' : t('partner')) :
                          (theme === 'pixel' ? 'SHR' : t('shared'))
                        ) : undefined}
                      >
                        {getResponsiveConfig.compactMode ? (
                          view === 'all' ? (theme === 'pixel' ? 'A' : '全') :
                          view === 'my' ? (theme === 'pixel' ? 'M' : '我') :
                          view === 'partner' ? (theme === 'pixel' ? 'P' : '伴') :
                          (theme === 'pixel' ? 'S' : '共')
                        ) : (
                          view === 'all' ? (theme === 'pixel' ? 'ALL' : t('all')) :
                          view === 'my' ? (theme === 'pixel' ? 'MY' : t('my')) :
                          view === 'partner' ? (theme === 'pixel' ? 'PTN' : t('partner')) :
                          (theme === 'pixel' ? 'SHR' : t('shared'))
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 操作按钮组 */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {onRefresh && (
                  <ThemeButton
                    onClick={onRefresh}
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={isRefreshing}
                    title={isRefreshing ? t('loading') : t('refresh')}
                  >
                    {theme === 'pixel' ? (
                      <PixelIcon name="refresh" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    ) : (
                      <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    )}
                  </ThemeButton>
                )}
                
                {onAddEvent && (
                  <ThemeButton
                    onClick={onAddEvent}
                    variant="primary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={t('add_event')}
                  >
                    {theme === 'pixel' ? (
                      <PixelIcon name="plus" className="w-4 h-4" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                  </ThemeButton>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* FullCalendar组件 - 移除外层滚动，让FullCalendar自己处理 */}
      <div className={`
        flex-1
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
          eventDidMount={handleEventDidMount} // 添加事件渲染回调
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventReceive={handleEventReceive}
          eventContent={renderEventContent}
          selectable={currentView !== 'partner'}
          selectMirror={currentView !== 'partner'}
          unselectAuto={false} // 不自动取消选择，让用户看到选择结果
          selectOverlap={true} // 允许与现有事件重叠选择，支持跨天拖动
          selectMinDistance={0} // 最小选择距离设为0，允许更灵活的选择
          // selectConstraint 移除此行以允许跨天选择
          selectAllow={() => true} // 允许所有选择，包括跨天选择
          dayMaxEvents={true}
          weekends={true}
          editable={currentView !== 'partner'}
          droppable={true}
          height="100%"
          contentHeight="100%"
          expandRows={true}
          locale={language === 'zh' ? 'zh-cn' : 'en'}
          buttonText={{
            today: language === 'zh' ? '今天' : 'Today',
            month: language === 'zh' ? '月' : 'Month',
            week: language === 'zh' ? '周' : 'Week',
            day: language === 'zh' ? '日' : 'Day',
            list: language === 'zh' ? '列表' : 'List'
          }}
          dayHeaderFormat={
            language === 'zh' 
              ? { weekday: 'short' }
              : { weekday: 'short' }
          }
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: language === 'en'
          }}
          allDayText={language === 'zh' ? '全天' : 'All Day'}
          timeZone="local" // 使用本地时区
          forceEventDuration={true} // 强制事件持续时间
          defaultTimedEventDuration="01:00:00" // 默认1小时持续时间
          defaultAllDayEventDuration={{ days: 1 }} // 默认全天事件持续1天
          eventMinHeight={30} // 最小事件高度（像素）
          eventShortHeight={30} // 短事件的高度（像素）
          slotEventOverlap={false} // 禁止事件重叠，确保清晰显示
          nextDayThreshold="00:00:00" // 跨天阈值：设为午夜，确保跨天事件正确显示
          firstDay={1} // 周一开始
          eventDisplay="block"
          displayEventEnd={true} // 确保显示事件结束时间，对跨天事件很重要
          displayEventTime={true}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00" // 30分钟的时间槽
          snapDuration="00:30:00" // 30分钟的对齐间隔
          allDaySlot={true}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          nowIndicator={true}
          scrollTime="06:00:00"
          // 视图变化回调
          datesSet={updateCalendarTitle}
          viewDidMount={(info) => {
            updateCalendarTitle();
            
            // 调试信息已隐藏 - 如需调试可取消注释
            // console.log('🔍 当前视图:', info.view.type);
          }}
        />
      </div>
    </Card>
  )
}

export default FullCalendarComponent
