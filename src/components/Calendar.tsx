import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from './ui/Button';
import { 
  ThemeCard, 
  ThemeDialog, 
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
  ConfirmDialog,
  RecurringEventActionDialog
} from './ui/Components';
import TestTimezoneController from './TestTimezoneController';

// 导入拆分后的组件和hooks
import { useEventData } from '../hooks/calendar/useEventData';
import { useCalendarView } from '../hooks/calendar/useCalendarView';
import { useEventForm } from '../hooks/calendar/useEventForm';
import CalendarGrid from './calendar/CalendarGrid';
import EventForm from './calendar/EventForm';
import EventDetail from './calendar/EventDetail';
import DayView from './calendar/DayView';
import type { Event, CalendarProps } from '../types/event';

const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // 使用自定义hooks
  const eventData = useEventData(user);
  const calendarView = useCalendarView();
  const eventForm = useEventForm(
    user,
    eventData.coupleId,
    eventData.coupleUsers,
    eventData.loadEvents
  );

  const {
    events,
    loading,
    coupleUsers,
    isRefreshing,
    handleRefresh
  } = eventData;

  const {
    currentMonth,
    currentYear,
    selectedDate,
    currentView,
    calendarMode,
    calendarData,
    setSelectedDate,
    setCurrentView,
    setCalendarMode,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    formatMonthYear,
    isToday,
    getDateString,
    isSelectedDate,
    dayNames
  } = calendarView;

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
  } = eventForm;

  // 创建新事件的日期选择
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);



  // 获取当前周数
  const getWeekNumber = () => {
    const currentDate = selectedDate ? new Date(selectedDate) : new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDate.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  // 处理日期点击
  const handleDayClick = (day: number) => {
    const dateStr = getDateString(day);
    setSelectedDate(dateStr);
  };

  // 获取指定日期的事件
  const getEventsForDay = (day: number) => {
    const allEvents = events;
    const filteredEvents = getFilteredEvents(allEvents);
    const dayStr = getDateString(day);
    return filteredEvents.filter(event => event.date === dayStr);
  };

  // 获取过滤后的事件
  const getFilteredEvents = (allEvents: Event[]): Event[] => {
    if (!user || !coupleUsers) return [];

    const currentUserId = user.id;
    const partnerIdForFiltering = coupleUsers.user1.id === currentUserId 
      ? coupleUsers.user2.id 
      : coupleUsers.user1.id;

    let filteredEvents: Event[] = [];
    
    switch (currentView) {
      case 'my':
        filteredEvents = allEvents.filter(event => {
          return event.participants.includes(currentUserId) && 
                 !event.participants.includes(partnerIdForFiltering);
        });
        break;
      case 'partner':
        filteredEvents = allEvents.filter(event => event.participants.includes(partnerIdForFiltering));
        break;
      case 'shared':
        filteredEvents = allEvents.filter(event =>
          event.participants.includes(currentUserId) && 
          event.participants.includes(partnerIdForFiltering)
        );
        break;
      default:
        filteredEvents = allEvents;
    }

    return filteredEvents;
  };

  // 处理新建事件
  const handleAddEvent = () => {
    if (!selectedDate) {
      alert('请先选择一个日期');
      return;
    }
    
    // 设置默认时间
    const now = new Date();
    const defaultStart = `${selectedDate}T${(now.getHours() + 1).toString().padStart(2, '0')}:00`;
    const defaultEnd = `${selectedDate}T${(now.getHours() + 2).toString().padStart(2, '0')}:00`;
    
    setNewEvent({
      title: '',
      location: '',
      startDateTime: defaultStart,
      endDateTime: defaultEnd,
      isAllDay: false,
      description: '',
      includesUser1: true,
      includesUser2: true
    });
    
    setShowNewEventDialog(true);
  };

  // 处理编辑按钮点击
  const handleEditClick = () => {
    if (!selectedEvent) return;

    if (selectedEvent.isRecurring) {
      setRecurringActionDialog({
        open: true,
        onThisOnly: () => startEditWithScope(),
        onThisAndFuture: () => startEditWithScope(),
        onAllEvents: () => startEditWithScope()
      });
    } else {
      startEditWithScope();
    }
  };

  // 处理删除按钮点击
  const handleDeleteClick = () => {
    if (!selectedEvent) return;

    if (selectedEvent.isRecurring) {
      setRecurringActionDialog({
        open: true,
        onThisOnly: () => {
          setConfirmDialog({
            open: true,
            title: '删除此事件',
            message: '确定要删除这个事件实例吗？',
            onConfirm: () => deleteEventWithScope('this_only'),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false }))
          });
        },
        onThisAndFuture: () => {
          setConfirmDialog({
            open: true,
            title: '删除此事件及之后的事件',
            message: '确定要删除此事件及之后的所有重复事件吗？',
            onConfirm: () => deleteEventWithScope('this_and_future'),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false }))
          });
        },
        onAllEvents: () => {
          setConfirmDialog({
            open: true,
            title: '删除所有重复事件',
            message: '确定要删除所有相关的重复事件吗？',
            onConfirm: () => deleteEventWithScope('all_events'),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false }))
          });
        }
      });
    } else {
      setConfirmDialog({
        open: true,
        title: '删除事件',
        message: '确定要删除这个事件吗？',
        onConfirm: () => deleteEventWithScope('this_only'),
        onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false }))
      });
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg"
        title={theme === 'pixel' ? 'LOADING_CALENDAR' : theme === 'modern' ? 'Loading Calendar' : '加载日历中'}
        subtitle={theme === 'pixel' ? 'PLEASE_WAIT' : theme === 'modern' ? 'Please wait while we load your events' : '正在加载您的事件，请稍候'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 测试时区控制器 */}
      {process.env.NODE_ENV === 'development' && <TestTimezoneController />}

      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${
          theme === 'pixel' 
            ? 'text-pixel-text font-mono uppercase' 
            : theme === 'modern'
            ? 'text-foreground'
            : 'text-gray-900'
        }`}>
          {theme === 'pixel' ? 'CALENDAR.EXE' : theme === 'modern' ? 'Calendar' : '日历'}
        </h1>

        <div className="flex items-center space-x-2">
          {/* 刷新按钮 */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{theme === 'pixel' ? 'REFRESH' : theme === 'modern' ? 'Refresh' : '刷新'}</span>
          </Button>

          {/* 添加事件按钮 */}
          <Button
            onClick={handleAddEvent}
            disabled={!selectedDate}
            className="flex items-center space-x-2"
          >
            {theme === 'pixel' ? (
              <PixelIcon name="plus" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
            <span>{theme === 'pixel' ? 'NEW_EVENT' : theme === 'modern' ? 'New Event' : '新建事件'}</span>
          </Button>
        </div>
      </div>

      {/* 日历导航 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button onClick={goToPreviousMonth} variant="secondary" size="sm">
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          
          <h2 className={`text-xl font-semibold ${
            theme === 'pixel' 
              ? 'text-pixel-text font-mono' 
              : theme === 'modern'
              ? 'text-foreground'
              : 'text-gray-800'
          }`}>
            {calendarMode === 'week' 
              ? `${currentYear}年 第${getWeekNumber()}周`
              : formatMonthYear()
            }
          </h2>
          
          <Button onClick={goToNextMonth} variant="secondary" size="sm">
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
          
          <Button onClick={goToToday} variant="secondary" size="sm">
            {theme === 'pixel' ? 'TODAY' : theme === 'modern' ? 'Today' : '今天'}
          </Button>

          {/* 视图模式切换 */}
          <div className="flex items-center space-x-1 border rounded-lg p-1">
            <Button
              onClick={() => setCalendarMode('month')}
              variant={calendarMode === 'month' ? 'primary' : 'secondary'}
              size="sm"
            >
              {theme === 'pixel' ? 'MONTH' : theme === 'modern' ? 'Month' : '月'}
            </Button>
            <Button
              onClick={() => setCalendarMode('week')}
              variant={calendarMode === 'week' ? 'primary' : 'secondary'}
              size="sm"
            >
              {theme === 'pixel' ? 'WEEK' : theme === 'modern' ? 'Week' : '周'}
            </Button>
          </div>
        </div>

        {/* 视图切换 */}
        <div className="flex space-x-2">
          {(['my', 'partner', 'shared'] as const).map((view) => (
            <Button
              key={view}
              onClick={() => setCurrentView(view)}
              variant={currentView === view ? 'primary' : 'secondary'}
              size="sm"
            >
              {view === 'my' 
                ? (theme === 'pixel' ? 'MY_EVENTS' : theme === 'modern' ? 'My Events' : '我的') 
                : view === 'partner' 
                ? (theme === 'pixel' ? 'PARTNER_EVENTS' : theme === 'modern' ? 'Partner Events' : '伴侣的') 
                : (theme === 'pixel' ? 'SHARED_EVENTS' : theme === 'modern' ? 'Shared Events' : '共同的')
              }
            </Button>
          ))}
        </div>
      </div>

      {/* 主要内容区域 - 日历 + 事件列表 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 日历网格 - 左侧 */}
        <div className="xl:col-span-3">
          <ThemeCard>
            <CalendarGrid
              calendarData={calendarData}
              dayNames={dayNames}
              events={events}
              currentView={currentView}
              user={user}
              coupleUsers={coupleUsers}
              isToday={isToday}
              isSelectedDate={isSelectedDate}
              getDateString={getDateString}
              getEventsForDay={getEventsForDay}
              onDayClick={handleDayClick}
              onEventClick={openEventDetail}
            />
          </ThemeCard>
        </div>

        {/* 右侧日视图面板 */}
        <div className="xl:col-span-1">
          <ThemeCard className="h-fit sticky top-24 max-h-[80vh] overflow-y-auto">
            <DayView
              selectedDate={selectedDate}
              events={events}
              currentView={currentView}
              user={user}
              coupleUsers={coupleUsers}
              onEventClick={openEventDetail}
              getFilteredEvents={getFilteredEvents}
            />
          </ThemeCard>
        </div>
      </div>

      {/* 新建事件对话框 */}
      <ThemeDialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogHeader>
          <DialogTitle>
            {theme === 'pixel' ? 'CREATE_NEW_EVENT' : theme === 'modern' ? 'Create New Event' : '创建新事件'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <EventForm
            mode="create"
            formData={newEvent}
            selectedDate={selectedDate}
            coupleUsers={coupleUsers}
            onFormChange={(data) => setNewEvent(prev => ({ ...prev, ...data }))}
            onSubmit={(data) => {
              handleEventSubmit('create', data);
              setShowNewEventDialog(false);
            }}
            onCancel={() => setShowNewEventDialog(false)}
          />
        </DialogContent>
      </ThemeDialog>

      {/* 事件详情对话框 */}
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
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ) : selectedEvent && isEditing ? (
            <EventForm
              mode="edit"
              formData={editEvent}
              selectedDate={selectedEvent.date}
              coupleUsers={coupleUsers}
              onFormChange={(data) => setEditEvent(prev => ({ ...prev, ...data }))}
              onSubmit={(data) => {
                if (selectedEvent.isRecurring) {
                  // 对于重复事件，需要选择范围
                  setRecurringActionDialog({
                    open: true,
                    onThisOnly: () => handleEventSubmit('edit', data, 'this_only'),
                    onThisAndFuture: () => handleEventSubmit('edit', data, 'this_and_future'),
                    onAllEvents: () => handleEventSubmit('edit', data, 'all_events')
                  });
                } else {
                  handleEventSubmit('edit', data);
                }
              }}
              onCancel={() => {
                setIsEditing(false);
                setEditEvent({
                  title: '',
                  location: '',
                  startDateTime: '',
                  endDateTime: '',
                  isAllDay: false,
                  description: '',
                  includesUser1: true,
                  includesUser2: true
                });
              }}
            />
          ) : null}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={closeDetailModal}>
            {theme === 'pixel' ? 'CLOSE' : theme === 'modern' ? 'Close' : '关闭'}
          </Button>
        </DialogFooter>
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
  );
};

export default Calendar;
