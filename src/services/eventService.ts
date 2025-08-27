import { supabase } from '../lib/supabase';

// 简化的事件接口定义
export interface SimplifiedEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  location?: string;
  is_recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  recurrence_end?: string;
  original_date?: string;
  created_by: string;
  includes_user1: boolean;
  includes_user2: boolean;
  creator_name?: string;
  creator_email?: string;
  user1_id?: string;
  user2_id?: string;
  user1_name?: string;
  user2_name?: string;
  event_type: 'user1' | 'user2' | 'shared' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface CreateSimpleEventData {
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  is_all_day?: boolean;
  location?: string;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  recurrence_end?: string;
  includes_user1: boolean;
  includes_user2: boolean;
}

/**
 * 简化的事件服务
 * 移除复杂的邀请/确认机制，专为情侣日历优化
 */
export const simplifiedEventService = {
  /**
   * 获取情侣的所有事件
   */
  async getCoupleEvents(coupleId: string): Promise<SimplifiedEvent[]> {
    const { data, error } = await supabase
      .from('events_with_details')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching couple events:', error);
      return [];
    }

    return data || [];
  },

  /**
   * 获取用户参与的事件
   */
  async getUserEvents(userId: string, isUser1: boolean, startDate?: string, endDate?: string): Promise<SimplifiedEvent[]> {
    const { data, error } = await supabase.rpc('get_user_events_simple', {
      p_user_id: userId,
      p_is_user1: isUser1,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (error) {
      console.error('Error fetching user events:', error);
      return [];
    }

    return data || [];
  },

  /**
   * 创建新事件
   */
  async createEvent(coupleId: string, createdBy: string, eventData: CreateSimpleEventData): Promise<SimplifiedEvent | null> {
    try {
      const { data, error } = await supabase.rpc('create_simple_event', {
        p_couple_id: coupleId,
        p_title: eventData.title,
        p_event_date: eventData.event_date,
        p_created_by: createdBy,
        p_includes_user1: eventData.includes_user1,
        p_includes_user2: eventData.includes_user2,
        p_start_time: eventData.start_time || null,
        p_end_time: eventData.end_time || null,
        p_description: eventData.description || null,
        p_is_all_day: eventData.is_all_day || false,
        p_location: eventData.location || null,
        p_is_recurring: eventData.is_recurring || false,
        p_recurrence_type: eventData.recurrence_type || null,
        p_recurrence_end: eventData.recurrence_end || null
      });

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      // 获取创建的事件详情
      const newEventId = data;
      const { data: eventDetails, error: fetchError } = await supabase
        .from('events_with_details')
        .select('*')
        .eq('id', newEventId)
        .single();

      if (fetchError) {
        console.error('Error fetching created event:', fetchError);
        return null;
      }

      return eventDetails;
    } catch (error) {
      console.error('Error in createEvent:', error);
      return null;
    }
  },

  /**
   * 更新事件
   */
  async updateEvent(eventId: string, updates: Partial<CreateSimpleEventData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: updates.title,
          event_date: updates.event_date,
          start_time: updates.start_time,
          end_time: updates.end_time,
          description: updates.description,
          is_all_day: updates.is_all_day,
          location: updates.location,
          is_recurring: updates.is_recurring,
          recurrence_type: updates.recurrence_type,
          recurrence_end: updates.recurrence_end,
          includes_user1: updates.includes_user1,
          includes_user2: updates.includes_user2
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      return false;
    }
  },

  /**
   * 删除事件
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  },

  /**
   * 获取事件详情
   */
  async getEvent(eventId: string): Promise<SimplifiedEvent | null> {
    const { data, error } = await supabase
      .from('events_with_details')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return data;
  },

  /**
   * 检查用户是否参与事件
   */
  isUserParticipant(event: SimplifiedEvent, isUser1: boolean): boolean {
    return isUser1 ? event.includes_user1 : event.includes_user2;
  },

  /**
   * 获取事件参与者的显示文本
   */
  getParticipantsDisplayText(event: SimplifiedEvent): string {
    const participants: string[] = [];
    
    if (event.includes_user1 && event.user1_name) {
      participants.push(event.user1_name);
    }
    if (event.includes_user2 && event.user2_name) {
      participants.push(event.user2_name);
    }
    
    return participants.join(', ');
  },

  /**
   * 根据用户身份过滤事件
   */
  filterEventsByUser(events: SimplifiedEvent[], view: 'user1' | 'user2' | 'shared'): SimplifiedEvent[] {
    switch (view) {
      case 'user1':
        return events.filter(e => e.includes_user1 && !e.includes_user2);
      case 'user2':
        return events.filter(e => e.includes_user2 && !e.includes_user1);
      case 'shared':
        return events.filter(e => e.includes_user1 && e.includes_user2);
      default:
        return events;
    }
  },

  /**
   * 根据当前用户过滤事件
   */
  filterEventsByCurrentUser(events: SimplifiedEvent[], isCurrentUserUser1: boolean, view: 'user1' | 'user2' | 'shared'): SimplifiedEvent[] {
    switch (view) {
      case 'user1':
        // "我的日历" - 显示当前用户的个人事件
        if (isCurrentUserUser1) {
          return events.filter(e => e.includes_user1 && !e.includes_user2);
        } else {
          return events.filter(e => e.includes_user2 && !e.includes_user1);
        }
      case 'user2':
        // "伴侣日历" - 显示伴侣的个人事件
        if (isCurrentUserUser1) {
          return events.filter(e => e.includes_user2 && !e.includes_user1);
        } else {
          return events.filter(e => e.includes_user1 && !e.includes_user2);
        }
      case 'shared':
        // "共同日历" - 显示共同事件
        return events.filter(e => e.includes_user1 && e.includes_user2);
      default:
        return events;
    }
  },

  /**
   * 创建个人事件的便捷方法
   */
  async createPersonalEvent(
    coupleId: string, 
    createdBy: string, 
    isCreatorUser1: boolean, 
    eventData: Omit<CreateSimpleEventData, 'includes_user1' | 'includes_user2'>
  ): Promise<SimplifiedEvent | null> {
    return this.createEvent(coupleId, createdBy, {
      ...eventData,
      includes_user1: isCreatorUser1,
      includes_user2: false
    });
  },

  /**
   * 创建共同事件的便捷方法
   */
  async createSharedEvent(
    coupleId: string, 
    createdBy: string, 
    eventData: Omit<CreateSimpleEventData, 'includes_user1' | 'includes_user2'>
  ): Promise<SimplifiedEvent | null> {
    return this.createEvent(coupleId, createdBy, {
      ...eventData,
      includes_user1: true,
      includes_user2: true
    });
  }
};
