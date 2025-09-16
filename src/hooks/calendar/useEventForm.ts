import { useState, useCallback, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { globalEventService, GlobalEvents } from '../../services/globalEventService';
import type { Event, EditEventForm } from '../../types/event';
import { 
  convertUTCToUserDateTimeLocal,
  convertUserTimeToUTC,
  debugTimezone
} from '../../utils/timezoneService';

// 🔧 重复事件ID辅助函数
const getOriginalEventId = (eventId: string): string => {
  // 如果是展开的实例ID (格式: originalId-YYYY-MM-DD)，提取原始ID
  return eventId.includes('-') && eventId.match(/-\d{4}-\d{2}-\d{2}$/) 
    ? eventId.split('-').slice(0, -3).join('-')  // 移除最后的日期部分
    : eventId; // 原始事件ID
};

const isExpandedInstance = (eventId: string): boolean => {
  // 检查是否是展开的实例ID
  return eventId.includes('-') && eventId.match(/-\d{4}-\d{2}-\d{2}$/) !== null;
};

// 🎯 事件表单管理Hook
export const useEventForm = (
  user: any,
  coupleId: string | null,
  coupleUsers: {user1: any, user2: any} | null,
  loadEvents: () => Promise<void>,
  events: Event[] = []
) => {
  // 表单状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔧 同步selectedEvent：当events更新时，自动更新selectedEvent
  useEffect(() => {
    if (selectedEvent && events.length > 0) {
      const updatedEvent = events.find(e => e.id === selectedEvent.id);
      if (updatedEvent && 
          (updatedEvent.date !== selectedEvent.date || 
           updatedEvent.rawStartTime !== selectedEvent.rawStartTime || 
           updatedEvent.rawEndTime !== selectedEvent.rawEndTime)) {
        console.log('🔄 检测到事件更新，同步selectedEvent:', {
          旧事件: { date: selectedEvent.date, startTime: selectedEvent.rawStartTime },
          新事件: { date: updatedEvent.date, startTime: updatedEvent.rawStartTime }
        });
        setSelectedEvent(updatedEvent);
      }
    }
  }, [events, selectedEvent]);
  
  // 新建事件表单
  const [newEvent, setNewEvent] = useState<EditEventForm>({
    title: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    description: '',
    includesUser1: true,
    includesUser2: true,
    isRecurring: false,
    recurrenceType: 'daily',
    recurrenceEnd: '',
    originalDate: ''
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
    includesUser2: true,
    isRecurring: false,
    recurrenceType: 'daily',
    recurrenceEnd: '',
    originalDate: ''
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
          is_recurring: eventData.isRecurring,
          recurrence_type: eventData.recurrenceType as "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | null | undefined,
          recurrence_end: eventData.recurrenceEnd || null
        };

        let success = false;

        if (selectedEvent.isRecurring && scope) {
          const originalEventId = getOriginalEventId(selectedEvent.id);
          
          console.log('🔧 重复事件编辑参数:', {
            原始ID: originalEventId,
            选中事件ID: selectedEvent.id,
            是否展开实例: isExpandedInstance(selectedEvent.id),
            操作范围: scope
          });
          
          if (scope === 'all_events') {
            // 更新原始重复事件（影响所有实例）
            success = await eventService.updateEvent(originalEventId, updateData);
          } else if (scope === 'this_only') {
            // 🔧 修改单个实例：添加到modified_instances
            const instanceDate = selectedEvent.originalDate || selectedEvent.date;
            success = await eventService.modifyRecurringEventInstance(originalEventId, instanceDate, updateData);
          } else {
            // this_and_future 暂时不支持
            console.log('⚠️ 暂不支持编辑"此事件及之后"，请选择"仅此事件"或"所有重复事件"');
            alert('暂不支持编辑"此事件及之后"，请选择"仅此事件"或"所有重复事件"');
            return;
          }
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

  // 🔧 开始编辑操作的辅助函数 - 只负责设置编辑状态，不执行具体操作
  const startEditWithScope = useCallback(() => {
    if (!selectedEvent) return;
    
    // 预填充编辑表单数据
    const event = selectedEvent;
    
    // 🔧 时区修复：使用原始时间数据而不是解析显示字符串
    let startDateTime = '';
    let endDateTime = '';
    
    // 🎯 修复时区处理：rawStartTime和rawEndTime已经是本地时间，直接组合即可
    if ((event as any).rawStartTime) {
      // rawStartTime已经是本地时间（如 "11:30:00"），直接与日期组合
      const timeStr = (event as any).rawStartTime;
      startDateTime = `${event.date}T${timeStr.slice(0, 5)}`; // 只取HH:MM部分
      console.log('📝 编辑表单开始时间:', {
        原始rawStartTime: (event as any).rawStartTime,
        组合结果: startDateTime
      });
    }
    
    if ((event as any).rawEndTime) {
      // rawEndTime已经是本地时间（如 "12:30:00"），直接与日期组合
      const timeStr = (event as any).rawEndTime;
      endDateTime = `${event.date}T${timeStr.slice(0, 5)}`; // 只取HH:MM部分
      console.log('📝 编辑表单结束时间:', {
        原始rawEndTime: (event as any).rawEndTime,
        组合结果: endDateTime
      });
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
      includesUser2: event.participants.includes(coupleUsers?.user2.id || ''),
      isRecurring: event.isRecurring || false,
      recurrenceType: event.recurrenceType || 'daily',
      recurrenceEnd: event.recurrenceEnd || '',
      originalDate: event.originalDate || ''
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
        const originalEventId = getOriginalEventId(selectedEvent.id);
        const instanceDate = selectedEvent.originalDate || selectedEvent.date;
        
        console.log('🗑️ 重复事件删除参数:', {
          原始ID: originalEventId,
          选中事件ID: selectedEvent.id,
          是否展开实例: isExpandedInstance(selectedEvent.id),
          实例日期: instanceDate,
          操作范围: scope
        });
        
        if (scope === 'all_events') {
          // 删除原始重复事件（数据库中的真实记录）
          success = await eventService.deleteEvent(originalEventId);
        } else if (scope === 'this_only') {
          // 🔧 删除单个实例：添加到excluded_dates
          success = await eventService.excludeRecurringEventInstance(originalEventId, instanceDate);
        } else {
          // this_and_future 暂时不支持，因为需要更复杂的逻辑
          console.log('⚠️ 暂不支持删除"此事件及之后"，请选择"仅此事件"或"所有重复事件"');
          alert('暂不支持删除"此事件及之后"，请选择"仅此事件"或"所有重复事件"');
          return;
        }
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
    isSubmitting,
    isDeleting,
    
    // 设置函数
    setShowDetailModal,
    setIsEditing,
    setSelectedEvent,
    setNewEvent,
    setEditEvent,
    setRecurringActionDialog,
    setConfirmDialog,
    setIsSubmitting,
    setIsDeleting,
    
    // 操作函数
    handleEventSubmit,
    startEditWithScope,
    deleteEventWithScope,
    openEventDetail,
    closeDetailModal
  };
};
