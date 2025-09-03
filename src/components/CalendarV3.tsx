'use client'

import React, { useState, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { useEventData } from '../hooks/calendar/useEventData'
import { useEventForm } from '../hooks/calendar/useEventForm'
import FullCalendarComponent from './FullCalendarComponent'
import EventDetail from './calendar/EventDetail'
import EventForm from './calendar/EventForm'
import DayView from './calendar/DayView'
import Button from './ui/Button'
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

const CalendarV3: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme } = useTheme()
  const { user } = useAuth()

  // 使用现有的数据管理hooks
  const eventData = useEventData(user)
  const eventForm = useEventForm(
    user,
    eventData.coupleId,
    eventData.coupleUsers,
    eventData.loadEvents
  )

  // 状态管理
  const [currentView, setCurrentView] = useState<'my' | 'partner' | 'shared'>('my')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)

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

  // 获取过滤后的事件
  const getFilteredEvents = useCallback((allEvents: Event[]): Event[] => {
    if (!user || !coupleUsers) {
      console.log('🚫 用户或情侣信息缺失')
      return []
    }

    console.log('🔍 开始过滤事件:', {
      总事件数: allEvents.length,
      当前视图: currentView,
      当前用户ID: user.id,
      当前用户名: user?.email,
      情侣用户: coupleUsers,
      事件列表: allEvents.map(e => ({ 
        title: e.title, 
        createdBy: e.createdBy, 
        participants: e.participants,
        date: e.date,
        time: e.time
      }))
    })

    const currentUserId = user.id
    const partnerIdForFiltering = coupleUsers.user1.id === currentUserId 
      ? coupleUsers.user2.id 
      : coupleUsers.user1.id

    let filteredEvents: Event[] = []
    
    switch (currentView) {
      case 'my':
        filteredEvents = allEvents.filter(event => {
          const isMyEvent = event.participants.includes(currentUserId) && 
                           !event.participants.includes(partnerIdForFiltering)
          console.log(`📋 我的事件过滤: ${event.title} - ${isMyEvent ? '✅' : '❌'}`, {
            事件参与者: event.participants,
            当前用户ID: currentUserId,
            伙伴ID: partnerIdForFiltering
          })
          return isMyEvent
        })
        break
      case 'partner':
        filteredEvents = allEvents.filter(event => {
          const isPartnerEvent = event.participants.includes(partnerIdForFiltering)
          console.log(`👫 伙伴事件过滤: ${event.title} - ${isPartnerEvent ? '✅' : '❌'}`)
          return isPartnerEvent
        })
        break
      case 'shared':
        filteredEvents = allEvents.filter(event => {
          const isSharedEvent = event.participants.includes(currentUserId) && 
                               event.participants.includes(partnerIdForFiltering)
          console.log(`🤝 共享事件过滤: ${event.title} - ${isSharedEvent ? '✅' : '❌'}`)
          return isSharedEvent
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
      includesUser2
    })
    
    setShowNewEventDialog(true)
    
    console.log('📅 日期选择 -> 打开新建事件弹窗:', {
      选择日期: date,
      选择时间: selectedTime,
      是否全天: isAllDay,
      当前视图: currentView,
      默认开始时间: defaultStart,
      默认结束时间: defaultEnd,
      是否全天事件: isAllDayEvent,
      参与者设置: { includesUser1, includesUser2 }
    })
  }, [setNewEvent, coupleUsers, user, currentView])

  // 处理事件拖拽
  const handleEventDrop = useCallback(async (eventId: string, newDate: string, newTime?: string) => {
    // 这里可以添加事件拖拽更新的逻辑
    console.log('Event dropped:', { eventId, newDate, newTime })
    // 可以调用eventService来更新事件
  }, [])

  // 处理新建事件
  const handleAddEvent = useCallback(() => {
    if (!selectedDate) {
      alert('请先选择一个日期')
      return
    }
    
    // 设置默认时间
    const now = new Date()
    const defaultStart = `${selectedDate}T${(now.getHours() + 1).toString().padStart(2, '0')}:00`
    const defaultEnd = `${selectedDate}T${(now.getHours() + 2).toString().padStart(2, '0')}:00`
    
    setNewEvent({
      title: '',
      location: '',
      startDateTime: defaultStart,
      endDateTime: defaultEnd,
      isAllDay: false,
      description: '',
      includesUser1: true,
      includesUser2: true
    })
    
    setShowNewEventDialog(true)
  }, [selectedDate, setNewEvent])

  // 获取选中日期的事件
  const getSelectedDateEvents = useCallback(() => {
    if (!selectedDate) return []
    const filteredEvents = getFilteredEvents(events)
    return filteredEvents.filter(event => event.date === selectedDate)
  }, [selectedDate, events, getFilteredEvents])

  // 获取视图显示名称
  const getViewDisplayName = () => {
    switch (currentView) {
      case 'my': return '我的日程'
      case 'partner': return '伴侣日程'
      case 'shared': return '共同日程'
      default: return '所有日程'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const filteredEvents = getFilteredEvents(events)

  return (
    <div className="space-y-6">
      {/* 测试时区控制器 */}
      {process.env.NODE_ENV === 'development' && <TestTimezoneController />}
      
      {/* 页面标题和控制 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className={`text-2xl font-bold ${
          theme === 'pixel' ? 'font-mono text-green-400' : 'text-gray-900'
        }`}>
          {theme === 'pixel' ? 'CALENDAR_V3.EXE' : 'FullCalendar 日历'}
        </h1>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
          
          {selectedDate && (
            <Button
              onClick={handleAddEvent}
              variant="primary"
              size="sm"
            >
              添加日程
            </Button>
          )}
        </div>
      </div>

      {/* 视图切换 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {(['my', 'partner', 'shared'] as const).map((view) => (
            <Button
              key={view}
              onClick={() => setCurrentView(view)}
              variant={currentView === view ? 'primary' : 'secondary'}
              size="sm"
            >
              {view === 'my' && (theme === 'pixel' ? 'MY' : '我的')}
              {view === 'partner' && (theme === 'pixel' ? 'PARTNER' : '伴侣')}
              {view === 'shared' && (theme === 'pixel' ? 'SHARED' : '共同')}
            </Button>
          ))}
          
          {/* 只读模式提示 */}
          {currentView === 'partner' && (
            <div className={`ml-4 text-xs px-2 py-1 rounded ${
              theme === 'pixel' 
                ? 'bg-pixel-panel text-pixel-textMuted font-mono border border-pixel-border'
                : theme === 'modern'
                ? 'bg-muted text-muted-foreground'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {theme === 'pixel' ? 'READ_ONLY' : '只读模式'}
            </div>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          当前显示: {getViewDisplayName()} ({filteredEvents.length} 个事件)
        </div>
      </Card>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FullCalendar 主视图 */}
        <div className="lg:col-span-2">
          <FullCalendarComponent
            events={filteredEvents}
            currentView={currentView}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
          />
        </div>

        {/* 右侧面板 */}
        <div className="space-y-4">
          {/* 选中日期的详细视图 */}
          {selectedDate && (
            <DayView
              selectedDate={selectedDate}
              events={getSelectedDateEvents()}
              currentView={currentView}
              user={user}
              coupleUsers={coupleUsers}
              onEventClick={handleEventClick}
              getFilteredEvents={getFilteredEvents}
            />
          )}

          {/* 统计信息 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">
              {theme === 'pixel' ? 'STATS' : '统计'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>我的日程:</span>
                <span className="font-mono">
                  {getFilteredEvents(events.filter(e => 
                    e.participants.includes(user?.id || '') && 
                    e.participants.length === 1
                  )).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>共同日程:</span>
                <span className="font-mono">
                  {getFilteredEvents(events.filter(e => e.participants.length > 1)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>本月总计:</span>
                <span className="font-mono">{events.length}</span>
              </div>
            </div>
          </Card>
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
                // 填充编辑表单数据
                if (selectedEvent) {
                  // 转换事件数据到表单格式
                  let startDateTime = '';
                  let endDateTime = '';
                  
                  if (!selectedEvent.isAllDay && selectedEvent.rawStartTime) {
                    startDateTime = `${selectedEvent.date}T${selectedEvent.rawStartTime.slice(0, 5)}`;
                  }
                  if (!selectedEvent.isAllDay && selectedEvent.rawEndTime) {
                    endDateTime = `${selectedEvent.date}T${selectedEvent.rawEndTime.slice(0, 5)}`;
                  }
                  
                  setEditEvent({
                    title: selectedEvent.title,
                    location: selectedEvent.location || '',
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    isAllDay: selectedEvent.isAllDay || false,
                    description: selectedEvent.description || '',
                    includesUser1: selectedEvent.participants.includes(coupleUsers?.user1?.id || ''),
                    includesUser2: selectedEvent.participants.includes(coupleUsers?.user2?.id || '')
                  });
                }
                setIsEditing(true);
              }}
              onDelete={() => {
                if (selectedEvent?.isRecurring) {
                  // 对于重复事件，显示选择对话框
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
                  // 对于重复事件，显示选择对话框
                  setRecurringActionDialog({
                    open: true,
                    onThisOnly: () => handleEventSubmit(mode, eventData, 'this_only'),
                    onThisAndFuture: () => handleEventSubmit(mode, eventData, 'this_and_future'),
                    onAllEvents: () => handleEventSubmit(mode, eventData, 'all_events')
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
