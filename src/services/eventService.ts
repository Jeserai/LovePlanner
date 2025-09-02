// Events Service - 适配新的events表结构
import { supabase } from '../lib/supabase';
import { 
  convertUserTimeToUTC, 
  convertUTCToUserDateTimeLocal,
  getUserTimezone 
} from '../utils/timezoneService';

// 🎯 更新后的事件类型（对应events表结构）
export interface SimplifiedEventV2 {
  id: string;
  couple_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  start_datetime?: string | null;     // 🆕 完整时间戳 (timestamptz)
  end_datetime?: string | null;       // 🆕 完整时间戳 (timestamptz)
  is_all_day: boolean;
  location?: string | null;
  is_recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  recurrence_end?: string | null;
  original_date?: string | null;
  created_by: string;
  includes_user1: boolean;
  includes_user2: boolean;
  created_at: string;
  updated_at: string;
  
  // 🔄 向后兼容字段（自动计算）
  start_time?: string | null;        // 从start_datetime提取
  end_time?: string | null;          // 从end_datetime提取
}

// 事件创建参数
export interface CreateEventParamsV2 {
  couple_id: string;
  title: string;
  event_date: string;
  created_by: string;
  includes_user1: boolean;
  includes_user2: boolean;
  start_datetime?: string | null;
  end_datetime?: string | null;
  description?: string | null;
  is_all_day?: boolean;
  location?: string | null;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  recurrence_end?: string | null;
  original_date?: string | null;
}

// 事件更新参数
export interface UpdateEventParamsV2 {
  title?: string;
  event_date?: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  description?: string | null;
  is_all_day?: boolean;
  location?: string | null;
  includes_user1?: boolean;
  includes_user2?: boolean;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  recurrence_end?: string | null;
}

// 🔄 数据转换辅助函数
function addCompatibilityFields(event: any): SimplifiedEventV2 {
  // 为向后兼容，从timestamptz提取时间部分
  if (event.start_datetime) {
    event.start_time = new Date(event.start_datetime).toISOString().split('T')[1].split('.')[0];
  }
  if (event.end_datetime) {
    event.end_time = new Date(event.end_datetime).toISOString().split('T')[1].split('.')[0];
  }
  return event;
}

export const eventService = {
  // 创建新事件
  async createEvent(
    coupleId: string,
    title: string,
    eventDate: string,
    createdBy: string,
    includesUser1: boolean,
    includesUser2: boolean,
    startDateTime?: string | null,  // 用户本地时间
    endDateTime?: string | null,    // 用户本地时间
    description?: string | null,
    isAllDay?: boolean,
    location?: string | null,
    isRecurring?: boolean,
    recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null,
    recurrenceEnd?: string | null,
    originalDate?: string | null
  ): Promise<SimplifiedEventV2 | null> {
    try {
      // 🎯 转换用户本地时间到UTC
      let utcStartDateTime = null;
      let utcEndDateTime = null;
      
      if (startDateTime && !isAllDay) {
        utcStartDateTime = convertUserTimeToUTC(startDateTime);
      }
      if (endDateTime && !isAllDay) {
        utcEndDateTime = convertUserTimeToUTC(endDateTime);
      }

      const eventData: CreateEventParamsV2 = {
        couple_id: coupleId,
        title,
        event_date: eventDate,
        created_by: createdBy,
        includes_user1: includesUser1,
        includes_user2: includesUser2,
        start_datetime: utcStartDateTime,
        end_datetime: utcEndDateTime,
        description,
        is_all_day: isAllDay || false,
        location,
        is_recurring: isRecurring || false,
        recurrence_type: recurrenceType,
        recurrence_end: recurrenceEnd,
        original_date: originalDate
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('创建事件失败:', error);
        throw error;
      }

      console.log('🎉 事件创建成功:', data);
      return addCompatibilityFields(data);
    } catch (error) {
      console.error('创建事件失败:', error);
      throw error;
    }
  },

  // 获取夫妻的所有事件
  async getCoupleEvents(coupleId: string): Promise<SimplifiedEventV2[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('获取事件失败:', error);
        throw error;
      }

      // 添加兼容性字段
      return (data || []).map(addCompatibilityFields);
    } catch (error) {
      console.error('获取事件失败:', error);
      return [];
    }
  },

  // 更新事件
  async updateEvent(eventId: string, updates: UpdateEventParamsV2): Promise<boolean> {
    try {
      // 🎯 如果有时间更新，转换为UTC
      const updateData = { ...updates };
      
      if (updates.start_datetime && !updates.is_all_day) {
        updateData.start_datetime = convertUserTimeToUTC(updates.start_datetime);
      }
      if (updates.end_datetime && !updates.is_all_day) {
        updateData.end_datetime = convertUserTimeToUTC(updates.end_datetime);
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('更新事件失败:', error);
        throw error;
      }

      console.log('✅ 事件更新成功:', eventId);
      return true;
    } catch (error) {
      console.error('更新事件失败:', error);
      return false;
    }
  },

  // 删除事件
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('删除事件失败:', error);
        throw error;
      }

      console.log('🗑️ 事件删除成功:', eventId);
      return true;
    } catch (error) {
      console.error('删除事件失败:', error);
      return false;
    }
  },

  // 批量删除重复事件实例
  async deleteRecurringEventInstances(
    originalEventId: string,
    scope: 'this_only' | 'this_and_following' | 'all',
    instanceDate?: string
  ): Promise<boolean> {
    try {
      if (scope === 'all') {
        // 删除所有相关的重复事件
        const { error } = await supabase
          .from('events')
          .delete()
          .or(`id.eq.${originalEventId},id.like.${originalEventId}-%`);

        if (error) throw error;
      } else if (scope === 'this_only' && instanceDate) {
        // 只删除特定日期的实例
        const instanceId = `${originalEventId}-${instanceDate}`;
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', instanceId);

        if (error) throw error;
      } else if (scope === 'this_and_following' && instanceDate) {
        // 删除这个及之后的实例
        const { error } = await supabase
          .from('events')
          .delete()
          .or(`id.eq.${originalEventId}-${instanceDate},id.like.${originalEventId}-${instanceDate}%`)
          .gte('event_date', instanceDate);

        if (error) throw error;
      }

      console.log('🗑️ 重复事件删除成功');
      return true;
    } catch (error) {
      console.error('删除重复事件失败:', error);
      return false;
    }
  },

  // 更新重复事件实例
  async updateRecurringEventInstances(
    originalEventId: string,
    scope: 'this_only' | 'this_and_following' | 'all',
    instanceDate: string,
    updates: UpdateEventParamsV2
  ): Promise<boolean> {
    try {
      // 🎯 转换时间为UTC
      const updateData = { ...updates };
      if (updates.start_datetime && !updates.is_all_day) {
        updateData.start_datetime = convertUserTimeToUTC(updates.start_datetime);
      }
      if (updates.end_datetime && !updates.is_all_day) {
        updateData.end_datetime = convertUserTimeToUTC(updates.end_datetime);
      }

      if (scope === 'all') {
        // 更新所有相关的重复事件
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .or(`id.eq.${originalEventId},id.like.${originalEventId}-%`);

        if (error) throw error;
      } else if (scope === 'this_only') {
        // 只更新特定日期的实例
        const instanceId = `${originalEventId}-${instanceDate}`;
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', instanceId);

        if (error) throw error;
      } else if (scope === 'this_and_following') {
        // 更新这个及之后的实例
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .or(`id.eq.${originalEventId}-${instanceDate},id.like.${originalEventId}-${instanceDate}%`)
          .gte('event_date', instanceDate);

        if (error) throw error;
      }

      console.log('✅ 重复事件更新成功');
      return true;
    } catch (error) {
      console.error('更新重复事件失败:', error);
      return false;
    }
  }
};

// 🔄 为了最小化代码更改，导出一个兼容的接口
// 导出默认服务实例
export default eventService;
export type SimplifiedEvent = SimplifiedEventV2;
export type CreateEventParams = CreateEventParamsV2;
export type UpdateEventParams = UpdateEventParamsV2;
