import { useState, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { globalEventService, GlobalEvents } from '../../services/globalEventService';
import type { Event, EditEventForm } from '../../types/event';
import { 
  convertUTCToUserDateTimeLocal,
  convertUserTimeToUTC,
  debugTimezone
} from '../../utils/timezoneService';

// 🎯 事件表单管理Hook
export const useEventForm = (
  user: any,
  coupleId: string | null,
  coupleUsers: {user1: any, user2: any} | null,
  loadEvents: () => Promise<void>
) => {
  // 表单状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 新建事件表单
  const [newEvent, setNewEvent] = useState<EditEventForm>({
    title: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    description: '',
    includesUser1: true,
    includesUser2: true
  });

  // 编辑事件表单
  const [editEvent, setEditEvent] = useState<EditEventForm>({
    title: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    description: '',
    includesUser1: true,
    includesUser2: true
  });

  // 重复事件操作对话框
  const [recurringActionDialog, setRecurringActionDialog] = useState<{
    open: boolean;
    onThisOnly: () => void;
    onThisAndFuture: () => void;
    onAllEvents: () => void;
  }>({
    open: false,
    onThisOnly: () => {},
    onThisAndFuture: () => {},
    onAllEvents: () => {}
  });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // 统一的事件提交处理
  const handleEventSubmit = useCallback(async (
    mode: 'create' | 'edit', 
    eventData: any, 
    scope?: 'this_only' | 'this_and_future' | 'all_events'
  ) => {
    if (!user || !coupleId || !coupleUsers) return;

    try {
      // 权限检查
      const hasEditPermission = !selectedEvent || selectedEvent.createdBy === user.id;
      if (mode === 'edit' && !hasEditPermission) {
        alert('您没有权限编辑此事件');
        return;
      }

      // 确定参与者
      const includesUser1 = eventData.includesUser1;
      const includesUser2 = eventData.includesUser2;

      if (mode === 'edit' && selectedEvent) {
        // 编辑模式
        const updateData = {
          title: eventData.title,
          // 🗑️ 移除event_date字段
          start_datetime: eventData.startDateTime,
          end_datetime: eventData.endDateTime,
          description: eventData.description,
          is_all_day: eventData.isAllDay,
          location: eventData.location,
          includes_user1: includesUser1,
          includes_user2: includesUser2,
          is_recurring: selectedEvent.isRecurring,
          recurrence_type: selectedEvent.recurrenceType as "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | null | undefined
        };

        let success = false;

        if (selectedEvent.isRecurring && scope) {
          // 处理重复事件
          const apiScope = scope === 'all_events' ? 'all' : 'this_and_following';
          success = await eventService.updateRecurringEventInstances(
            selectedEvent.id.split('-')[0],
            apiScope,
            selectedEvent.originalDate || selectedEvent.date,
            updateData
          );
        } else {
          // 处理单个事件
          success = await eventService.updateEvent(selectedEvent.id, updateData);
        }

        if (success) {
          // 刷新事件列表
          if (coupleId && coupleUsers) {
            await loadEvents();
          }
          
          setShowDetailModal(false);
          setIsEditing(false);
          globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
        }
      } else {
        // 创建模式
        // 🔇 隐藏事件创建调试信息
        
        const savedEvent = await eventService.createEvent(
          coupleId,
          eventData.title,
          // 🗑️ 移除eventDate参数
          user.id,
          includesUser1,
          includesUser2,
          eventData.startDateTime,
          eventData.endDateTime,
          eventData.description,
          eventData.isAllDay,
          eventData.location,
          eventData.isRecurring,
          eventData.recurrenceType,
          eventData.recurrenceEnd,
          eventData.originalDate
        );
        
        if (savedEvent) {
          await loadEvents();
          globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
        }

        setNewEvent({
          title: '',
          location: '',
          startDateTime: '',
          endDateTime: '',
          isAllDay: false,
          description: '',
          includesUser1: true,
          includesUser2: true
        });
      }
    } catch (error) {
      console.error('事件提交失败:', error);
      alert('操作失败，请重试');
    }
  }, [user, coupleId, coupleUsers, selectedEvent, loadEvents]);

  // 开始编辑操作的辅助函数
  const startEditWithScope = useCallback(async (scope: 'this_only' | 'this_and_future' | 'all_events') => {
    if (!selectedEvent) return;
    
    // 预填充编辑表单数据
    const event = selectedEvent;
    
    // 🔧 时区修复：使用原始时间数据而不是解析显示字符串
    let startDateTime = '';
    let endDateTime = '';
    
    // 🎯 统一时区处理：将UTC时间转换为用户本地的datetime-local格式
    const convertToDateTimeLocal = (timeStr: string, dateStr: string) => {
      try {
        if (timeStr.includes('T') || timeStr.includes(' ')) {
          // 完整的 datetime 字符串 (ISO format)
          return convertUTCToUserDateTimeLocal(timeStr);
        } else if (timeStr.includes(':')) {
          // 时间字符串格式："HH:MM:SS" 或 "HH:MM"
          // 统一假设为UTC时间，转换为本地时间
          const utcDatetimeString = `${dateStr}T${timeStr}${timeStr.length === 5 ? ':00' : ''}Z`;
          return convertUTCToUserDateTimeLocal(utcDatetimeString);
        }
      } catch (e) {
        console.warn('时间转换失败:', timeStr, e);
      }
      return `${dateStr}T09:00`; // 默认值
    };
    
    if ((event as any).rawStartTime) {
      startDateTime = convertToDateTimeLocal((event as any).rawStartTime, event.date);
      debugTimezone('编辑表单开始时间', (event as any).rawStartTime);
    }
    
    if ((event as any).rawEndTime) {
      endDateTime = convertToDateTimeLocal((event as any).rawEndTime, event.date);
      debugTimezone('编辑表单结束时间', (event as any).rawEndTime);
    }
    
    // 默认值，如果没有原始时间数据
    if (!startDateTime) {
      startDateTime = `${event.date}T09:00`;
    }
    if (!endDateTime) {
      endDateTime = `${event.date}T10:00`;
    }

    setEditEvent({
      title: event.title,
      location: event.location || '',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      isAllDay: event.isAllDay || false,
      description: event.description || '',
      includesUser1: event.participants.includes(coupleUsers?.user1.id || ''),
      includesUser2: event.participants.includes(coupleUsers?.user2.id || '')
    });

    setIsEditing(true);
    
    // 关闭重复事件对话框
    setRecurringActionDialog(prev => ({ ...prev, open: false }));
  }, [selectedEvent, coupleUsers]);

  // 删除事件
  const deleteEventWithScope = useCallback(async (scope: 'this_only' | 'this_and_future' | 'all_events') => {
    if (!selectedEvent || !user || !coupleId) return;

    try {
      const hasEditPermission = selectedEvent.createdBy === user.id;
      if (!hasEditPermission) {
        alert('您没有权限删除此事件');
        return;
      }

      let success = false;

      if (selectedEvent.isRecurring) {
        const originalEventId = selectedEvent.id.split('-')[0];
        const instanceDate = selectedEvent.originalDate || selectedEvent.date;
        // 映射scope参数到API期望的值
        const apiScope = scope === 'all_events' ? 'all' : scope === 'this_and_future' ? 'this_and_following' : 'this_only';
        success = await eventService.deleteRecurringEventInstances(originalEventId, apiScope, instanceDate);
      } else {
        success = await eventService.deleteEvent(selectedEvent.id);
      }

      if (success) {
        await loadEvents();
        setShowDetailModal(false);
        globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除事件失败:', error);
      alert('删除事件失败，请重试');
    }
    
    // 关闭对话框
    setConfirmDialog(prev => ({ ...prev, open: false }));
    setRecurringActionDialog(prev => ({ ...prev, open: false }));
  }, [selectedEvent, user, coupleId, loadEvents]);

  // 打开事件详情
  const openEventDetail = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
    setIsEditing(false);
  }, []);

  // 关闭详情模态框
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedEvent(null);
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
  }, []);

  return {
    // 状态
    showDetailModal,
    isEditing,
    selectedEvent,
    newEvent,
    editEvent,
    recurringActionDialog,
    confirmDialog,
    
    // 设置函数
    setShowDetailModal,
    setIsEditing,
    setSelectedEvent,
    setNewEvent,
    setEditEvent,
    setRecurringActionDialog,
    setConfirmDialog,
    
    // 操作函数
    handleEventSubmit,
    startEditWithScope,
    deleteEventWithScope,
    openEventDetail,
    closeDetailModal
  };
};
