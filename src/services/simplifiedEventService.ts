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
  original_date?: string | null;
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
    recurrenceEnd?: string | null,
    originalDate?: string | null
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

  // 删除重复事件的指定实例
  async deleteRecurringEventInstances(
    eventId: string, 
    scope: 'this_only' | 'this_and_future' | 'all_events',
    currentDate?: string
  ): Promise<boolean> {
    try {
      // 首先获取原始事件信息
      const { data: originalEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !originalEvent) {
        console.error('获取原始事件失败:', fetchError);
        return false;
      }

      if (scope === 'this_only') {
        // 对于重复事件的单个实例删除，我们创建一个例外记录
        // 在事件的 excluded_dates 字段中添加这个日期
        if (!currentDate) return false;
        
        // 获取当前的排除日期列表
        const excludedDates = originalEvent.excluded_dates || [];
        const newExcludedDates = [...excludedDates, currentDate];
        
        // 更新原始事件，添加排除日期
        const { error: updateError } = await supabase
          .from('events')
          .update({ excluded_dates: newExcludedDates })
          .eq('id', eventId);

        if (updateError) {
          console.error('添加排除日期失败:', updateError);
          return false;
        }
        return true;
      } else if (scope === 'all_events') {
        // 删除整个重复事件系列 - 直接删除原始记录
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);

        if (error) {
          console.error('删除重复事件系列失败:', error);
          return false;
        }
        return true;
      } else if (scope === 'this_and_future') {
        // 删除从当前日期开始的所有未来事件
        if (!currentDate) return false;
        
        // 对于"此事件及未来事件"，我们设置重复结束日期为前一天
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() - 1);
        const newEndDate = endDate.toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('events')
          .update({ recurrence_end: newEndDate })
          .eq('id', eventId);

        if (error) {
          console.error('更新重复事件结束日期失败:', error);
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('删除重复事件实例失败:', error);
      return false;
    }
  },

  // 智能更新重复事件实例
  async updateRecurringEventInstances(
    eventId: string,
    scope: 'this_only' | 'this_and_future' | 'all_events',
    currentDate: string,
    updateData: Partial<{
      title: string;
      start_time: string;
      end_time: string;
      location: string;
      description: string;
      includes_user1: boolean;
      includes_user2: boolean;
    }>
  ): Promise<boolean> {
    try {
      // 获取原始事件信息
      const { data: originalEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !originalEvent) {
        console.error('获取原始事件失败:', fetchError);
        return false;
      }

      if (scope === 'all_events') {
        // 更新整个系列 - 直接更新原记录
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', eventId);

        if (error) {
          console.error('更新整个系列失败:', error);
          return false;
        }
        return true;
      }

      if (scope === 'this_only') {
        // 单个实例修改 - 使用 modified_instances
        const modifiedInstances = originalEvent.modified_instances || {};
        modifiedInstances[currentDate] = updateData;

        const { error } = await supabase
          .from('events')
          .update({ modified_instances: modifiedInstances })
          .eq('id', eventId);

        if (error) {
          console.error('添加修改实例失败:', error);
          
          // 如果 modified_instances 字段不存在，回退到提示用户
          if (error.message && error.message.includes('modified_instances')) {
            console.log('⚠️ modified_instances 字段不存在，请执行数据库迁移');
            alert('重复事件的单个实例修改功能需要数据库升级。请联系管理员添加 modified_instances 字段。\n\n暂时请选择"系列中的所有事件"来更新整个系列。');
            return false;
          }
          
          return false;
        }
        return true;
      }

      if (scope === 'this_and_future') {
        // 未来事件修改 - 需要计算影响范围
        const startDate = new Date(originalEvent.original_date || originalEvent.event_date);
        const currentDateObj = new Date(currentDate);
        const endDate = originalEvent.recurrence_end 
          ? new Date(originalEvent.recurrence_end)
          : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 默认1年

        // 计算会受影响的实例数量
        const affectedCount = this.calculateAffectedInstances(
          currentDateObj,
          endDate,
          originalEvent.recurrence_type as any
        );

        const THRESHOLD = 10; // 阈值：超过10个实例就分割

        if (affectedCount <= THRESHOLD) {
          // 使用 modified_instances 策略
          const modifiedInstances = originalEvent.modified_instances || {};
          
          // 为所有未来日期添加修改记录
          let tempDate = new Date(currentDateObj);
          while (tempDate <= endDate) {
            const dateString = tempDate.toISOString().split('T')[0];
            modifiedInstances[dateString] = updateData;
            
            // 计算下一个重复日期
            this.addRecurrenceInterval(tempDate, originalEvent.recurrence_type as any);
          }

          const { error } = await supabase
            .from('events')
            .update({ modified_instances: modifiedInstances })
            .eq('id', eventId);

          if (error) {
            console.error('批量添加修改实例失败:', error);
            return false;
          }
          return true;
        } else {
          // 使用分割策略
          return await this.splitRecurringSeries(originalEvent, currentDate, updateData);
        }
      }

      return false;
    } catch (error) {
      console.error('智能更新重复事件实例失败:', error);
      return false;
    }
  },

  // 计算受影响的实例数量
  calculateAffectedInstances(
    startDate: Date,
    endDate: Date,
    recurrenceType: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  ): number {
    let count = 0;
    const tempDate = new Date(startDate);

    while (tempDate <= endDate && count < 100) { // 最多计算100个
      count++;
      this.addRecurrenceInterval(tempDate, recurrenceType);
    }

    return count;
  },

  // 添加重复间隔
  addRecurrenceInterval(date: Date, recurrenceType: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'): void {
    switch (recurrenceType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
  },

  // 分割重复事件系列
  async splitRecurringSeries(
    originalEvent: any,
    splitDate: string,
    newEventData: any
  ): Promise<boolean> {
    try {
      // 1. 结束原系列到分割日期前一天
      const previousDay = new Date(splitDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const newEndDate = previousDay.toISOString().split('T')[0];

      const { error: updateError } = await supabase
        .from('events')
        .update({ recurrence_end: newEndDate })
        .eq('id', originalEvent.id);

      if (updateError) {
        console.error('结束原系列失败:', updateError);
        return false;
      }

      // 2. 创建新的重复事件系列
      const newEvent = {
        ...originalEvent,
        ...newEventData,
        id: undefined, // 让数据库生成新ID
        original_date: splitDate,
        event_date: splitDate,
        created_at: undefined,
        updated_at: undefined,
        modified_instances: null, // 新系列重置修改记录
        excluded_dates: [] // 新系列重置排除记录
      };

      delete newEvent.id;
      delete newEvent.created_at;
      delete newEvent.updated_at;

      const { error: createError } = await supabase
        .from('events')
        .insert(newEvent);

      if (createError) {
        console.error('创建新系列失败:', createError);
        // 回滚：恢复原系列的结束日期
        await supabase
          .from('events')
          .update({ recurrence_end: originalEvent.recurrence_end })
          .eq('id', originalEvent.id);
        return false;
      }

      console.log(`✅ 成功分割重复事件系列: ${originalEvent.title}`);
      return true;
    } catch (error) {
      console.error('分割重复事件系列失败:', error);
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