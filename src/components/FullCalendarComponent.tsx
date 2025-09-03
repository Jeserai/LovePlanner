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
import Button from './ui/Button'
import { Card } from './ui/card'

interface FullCalendarComponentProps {
  events: Event[]
  currentView: 'my' | 'partner' | 'shared'
  onEventClick?: (event: Event) => void
  onDateSelect?: (date: string, selectedTime?: string | null, isAllDay?: boolean) => void
  onEventDrop?: (eventId: string, newDate: string, newTime?: string) => void
  className?: string
}

const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({
  events,
  currentView,
  onEventClick,
  onDateSelect,
  onEventDrop,
  className = ''
}) => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [currentCalendarView, setCurrentCalendarView] = useState('timeGridWeek')
  const calendarRef = useRef<FullCalendar>(null)

  // 获取事件背景色
  const getEventBackgroundColor = useCallback((event: Event): string => {
    if (theme === 'pixel') {
      if (event.participants.length > 1) return '#ec4899' // pink-500
      return '#3b82f6' // blue-500
    }
    
    // Modern主题渐变色
    if (event.participants.length > 1) {
      return 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' // pink to purple
    }
    return 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' // blue to cyan
  }, [theme])

  // 获取事件边框色
  const getEventBorderColor = useCallback((event: Event): string => {
    if (event.participants.length > 1) return '#ec4899'
    return '#3b82f6'
  }, [])

  // 获取事件文字色
  const getEventTextColor = useCallback((event: Event): string => {
    return '#ffffff'
  }, [])

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
    console.log('🔄 转换事件到FullCalendar格式:', events.length, '个事件')
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
        backgroundColor: getEventBackgroundColor(event),
        borderColor: getEventBorderColor(event),
        textColor: getEventTextColor(event),
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
      
      console.log('📅 转换事件:', {
        原始: { 
          title: event.title, 
          date: event.date, 
          rawStartTime: event.rawStartTime,
          rawEndTime: event.rawEndTime,
          time: event.time,
          isAllDay: event.isAllDay,
          完整事件: event
        },
        转换后: { 
          title: fcEvent.title, 
          start: fcEvent.start, 
          end: fcEvent.end,
          allDay: fcEvent.allDay,
          完整FC事件: fcEvent
        }
      })
      
      return fcEvent
    })
    
    console.log('✅ FullCalendar事件转换完成:', converted.length, '个事件')
    
    // 只使用真实事件数据
    const allEvents = converted
    console.log('🎯 最终事件列表:', allEvents.length, '个事件')
    console.log('📊 详细事件数据:', allEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.backgroundColor
    })))
    
    return allEvents
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

  // 自定义事件内容渲染
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo
    const isShared = event.extendedProps.isShared
    const points = event.extendedProps.points
    const category = event.extendedProps.category

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
      {/* 自定义工具栏 */}
      <div className="flex flex-col space-y-4 mb-4">
        {/* 第一行：导航和标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrev}
              variant="secondary"
              size="sm"
            >
              {theme === 'pixel' ? '<' : '←'}
            </Button>
            <Button
              onClick={handleNext}
              variant="secondary"
              size="sm"
            >
              {theme === 'pixel' ? '>' : '→'}
            </Button>
            <Button
              onClick={handleToday}
              variant="secondary"
              size="sm"
            >
              {theme === 'pixel' ? 'TODAY' : '今天'}
            </Button>
          </div>

          {/* 当前月份年份显示 */}
          <div className={`
            text-xl font-bold
            ${theme === 'pixel' ? 'font-mono text-green-400' : 'text-gray-900'}
          `}>
            {calendarTitle}
          </div>

          {/* 视图状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className={`
              px-2 py-1 rounded text-xs
              ${theme === 'pixel' ? 'bg-gray-800 text-green-400 font-mono' : 'bg-gray-100 text-gray-600'}
            `}>
              {currentView === 'my' && '我的日程'}
              {currentView === 'partner' && '伴侣日程'}
              {currentView === 'shared' && '共同日程'}
            </div>
          </div>
        </div>

        {/* 第二行：视图切换 */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleViewChange('dayGridMonth')}
            variant={currentCalendarView === 'dayGridMonth' ? 'primary' : 'secondary'}
            size="sm"
          >
            {theme === 'pixel' ? 'MONTH' : '月'}
          </Button>
          <Button
            onClick={() => handleViewChange('timeGridWeek')}
            variant={currentCalendarView === 'timeGridWeek' ? 'primary' : 'secondary'}
            size="sm"
          >
            {theme === 'pixel' ? 'WEEK' : '周'}
          </Button>
          <Button
            onClick={() => handleViewChange('timeGridDay')}
            variant={currentCalendarView === 'timeGridDay' ? 'primary' : 'secondary'}
            size="sm"
          >
            {theme === 'pixel' ? 'DAY' : '日'}
          </Button>
          <Button
            onClick={() => handleViewChange('listWeek')}
            variant={currentCalendarView === 'listWeek' ? 'primary' : 'secondary'}
            size="sm"
          >
            {theme === 'pixel' ? 'LIST' : '列表'}
          </Button>
        </div>
      </div>

      {/* FullCalendar组件 */}
      <div className={`
        fullcalendar-container
        ${theme === 'pixel' ? 'pixel-calendar' : 'modern-calendar'}
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
          eventContent={renderEventContent}
          selectable={currentView !== 'partner'}
          selectMirror={currentView !== 'partner'}
          dayMaxEvents={true}
          weekends={true}
          editable={currentView !== 'partner'}
          droppable={false}
          height="auto"
          aspectRatio={1.35}
          locale="zh-cn"
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
