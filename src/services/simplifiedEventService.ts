import { supabase } from '../lib/supabase';

// 简化的事件类型（与数据库表结构对应）
export interface SimplifiedEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
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
}

// 事件创建参数
export interface CreateEventParams {
  couple_id: string;
  title: string;
  event_date: string;
  created_by: string;
  includes_user1: boolean;
  includes_user2: boolean;
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  is_all_day?: boolean;
  location?: string | null;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  recurrence_end?: string | null;
}

// 事件更新参数
export interface UpdateEventParams {
  title?: string;
  event_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  is_all_day?: boolean;
  location?: string | null;
  includes_user1?: boolean;
  includes_user2?: boolean;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  recurrence_end?: string | null;
}

export const simplifiedEventService = {
  // 获取情侣的所有事件
  async getCoupleEvents(coupleId: string): Promise<SimplifiedEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('获取情侣事件失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取情侣事件失败:', error);
      throw error;
    }
  },

  // 创建新事件
  async createEvent(
    coupleId: string,
    title: string,
    eventDate: string,
    createdBy: string,
    includesUser1: boolean,
    includesUser2: boolean,
    startTime?: string | null,
    endTime?: string | null,
    description?: string | null,
    isAllDay?: boolean,
    location?: string | null,
    isRecurring?: boolean,
    recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null,
    recurrenceEnd?: string | null
  ): Promise<SimplifiedEvent | null> {
    try {
      const eventData: CreateEventParams = {
        couple_id: coupleId,
        title,
        event_date: eventDate,
        created_by: createdBy,
        includes_user1: includesUser1,
        includes_user2: includesUser2,
        start_time: startTime,
        end_time: endTime,
        description,
        is_all_day: isAllDay || false,
        location,
        is_recurring: isRecurring || false,
        recurrence_type: recurrenceType,
        recurrence_end: recurrenceEnd
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

      return data;
    } catch (error) {
      console.error('创建事件失败:', error);
      throw error;
    }
  },

  // 使用RPC函数创建事件（推荐方式）
  async createEventRPC(
    coupleId: string,
    title: string,
    eventDate: string,
    createdBy: string,
    includesUser1: boolean,
    includesUser2: boolean,
    startTime?: string | null,
    endTime?: string | null,
    description?: string | null,
    isAllDay?: boolean,
    location?: string | null,
    isRecurring?: boolean,
    recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null,
    recurrenceEnd?: string | null
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_simple_event', {
        p_couple_id: coupleId,
        p_title: title,
        p_event_date: eventDate,
        p_created_by: createdBy,
        p_includes_user1: includesUser1,
        p_includes_user2: includesUser2,
        p_start_time: startTime,
        p_end_time: endTime,
        p_description: description,
        p_is_all_day: isAllDay || false,
        p_location: location,
        p_is_recurring: isRecurring || false,
        p_recurrence_type: recurrenceType,
        p_recurrence_end: recurrenceEnd
      });

      if (error) {
        console.error('使用RPC创建事件失败:', error);
        throw error;
      }

      return data; // 返回新事件的ID
    } catch (error) {
      console.error('使用RPC创建事件失败:', error);
      throw error;
    }
  },

  // 更新事件
  async updateEvent(eventId: string, updates: UpdateEventParams): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) {
        console.error('更新事件失败:', error);
        throw error;
      }

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

      return true;
    } catch (error) {
      console.error('删除事件失败:', error);
      return false;
    }
  },

  // 获取用户的事件（基于参与情况）
  async getUserEvents(
    userId: string, 
    isUser1: boolean,
    startDate?: string,
    endDate?: string
  ): Promise<SimplifiedEvent[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq(isUser1 ? 'includes_user1' : 'includes_user2', true)
        .order('event_date', { ascending: true });

      // 通过couple_id过滤（需要先获取用户的couple关系）
      const { data: couples, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true);

      if (coupleError) {
        console.error('获取用户情侣关系失败:', coupleError);
        throw coupleError;
      }

      if (couples && couples.length > 0) {
        const coupleIds = couples.map(c => c.id);
        query = query.in('couple_id', coupleIds);
      }

      if (startDate) {
        query = query.gte('event_date', startDate);
      }

      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取用户事件失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取用户事件失败:', error);
      throw error;
    }
  }
};