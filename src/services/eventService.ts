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
  // 🗑️ 移除event_date字段，避免时区混淆
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
  excluded_dates?: string[] | null;    // 🔧 添加缺失字段
  modified_instances?: Record<string, any> | null; // 🔧 添加缺失字段
  
  // 🔄 向后兼容字段（自动计算）
  start_time?: string | null;        // 从start_datetime提取
  end_time?: string | null;          // 从end_datetime提取
}

// 事件创建参数
export interface CreateEventParamsV2 {
  couple_id: string;
  title: string;
  // 🗑️ 移除event_date字段，避免时区混淆
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
  // 🗑️ 移除event_date字段
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
    // 🗑️ 移除eventDate参数，不再需要单独的日期字段
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
        // 🔇 隐藏时间转换调试信息
      }
      if (endDateTime && !isAllDay) {
        utcEndDateTime = convertUserTimeToUTC(endDateTime);
      }

      const eventData: CreateEventParamsV2 = {
        couple_id: coupleId,
        title,
        // 🗑️ 移除event_date字段
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
        // 🔧 修复：空字符串转换为null，避免PostgreSQL日期解析错误
        recurrence_end: recurrenceEnd && recurrenceEnd.trim() !== '' ? recurrenceEnd : null,
        original_date: originalDate && originalDate.trim() !== '' ? originalDate : null
      };

      console.log('📝 创建事件参数:', {
        recurrence_end: eventData.recurrence_end,
        original_date: eventData.original_date,
        recurrenceEnd原值: recurrenceEnd,
        originalDate原值: originalDate
      });

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('创建事件失败:', error);
        throw error;
      }

      // 🔇 隐藏事件创建调试信息
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
        .order('start_datetime', { ascending: true, nullsFirst: false });

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
      
      // 🔧 修复：空字符串转换为null，避免PostgreSQL日期解析错误
      if ('recurrence_end' in updateData && updateData.recurrence_end === '') {
        updateData.recurrence_end = null;
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
      
      // 🔧 修复：空字符串转换为null，避免PostgreSQL日期解析错误
      if ('recurrence_end' in updateData && updateData.recurrence_end === '') {
        updateData.recurrence_end = null;
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
  },

  // 🔧 新增：排除重复事件的特定实例（添加到excluded_dates）
  async excludeRecurringEventInstance(eventId: string, excludeDate: string): Promise<boolean> {
    try {
      // 获取原始事件
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('excluded_dates')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('获取事件失败:', fetchError);
        return false;
      }

      // 添加新的排除日期
      const currentExcludedDates = event.excluded_dates || [];
      const updatedExcludedDates = [...currentExcludedDates, excludeDate];

      // 更新数据库
      const { error: updateError } = await supabase
        .from('events')
        .update({ excluded_dates: updatedExcludedDates })
        .eq('id', eventId);

      if (updateError) {
        console.error('更新excluded_dates失败:', updateError);
        return false;
      }

      console.log('✅ 成功排除重复事件实例:', { eventId, excludeDate });
      return true;
    } catch (error) {
      console.error('排除重复事件实例失败:', error);
      return false;
    }
  },

  // 🔧 新增：修改重复事件的特定实例（添加到modified_instances）
  async modifyRecurringEventInstance(
    eventId: string, 
    modifyDate: string, 
    modifications: Partial<UpdateEventParamsV2>
  ): Promise<boolean> {
    try {
      // 获取原始事件
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('modified_instances')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('获取事件失败:', fetchError);
        return false;
      }

      // 转换时间为UTC（如果有时间修改）
      const processedModifications = { ...modifications };
      if (modifications.start_datetime && !modifications.is_all_day) {
        processedModifications.start_datetime = convertUserTimeToUTC(modifications.start_datetime);
      }
      if (modifications.end_datetime && !modifications.is_all_day) {
        processedModifications.end_datetime = convertUserTimeToUTC(modifications.end_datetime);
      }

      // 添加新的修改实例数据
      const currentModifiedInstances = event.modified_instances || {};
      const updatedModifiedInstances = {
        ...currentModifiedInstances,
        [modifyDate]: processedModifications
      };

      // 更新数据库
      const { error: updateError } = await supabase
        .from('events')
        .update({ modified_instances: updatedModifiedInstances })
        .eq('id', eventId);

      if (updateError) {
        console.error('更新modified_instances失败:', updateError);
        return false;
      }

      console.log('✅ 成功修改重复事件实例:', { eventId, modifyDate, modifications: processedModifications });
      return true;
    } catch (error) {
      console.error('修改重复事件实例失败:', error);
      return false;
    }
  },

  // 🗑️ 排除重复事件的单个实例（添加到excluded_dates）
  // 🧠 智能清理：如果所有实例都被排除，自动删除原始记录
  async excludeRecurringEventInstance(
    eventId: string,
    excludeDate: string
  ): Promise<boolean> {
    try {
      // 获取完整的事件信息
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('excluded_dates, start_datetime, recurrence_type, recurrence_end')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('获取事件失败:', fetchError);
        return false;
      }

      // 添加日期到排除列表
      const currentExcludedDates = event.excluded_dates || [];
      const updatedExcludedDates = [...currentExcludedDates];
      
      // 避免重复添加
      if (!updatedExcludedDates.includes(excludeDate)) {
        updatedExcludedDates.push(excludeDate);
      }

      // 🧠 智能检查：计算所有可能的重复实例，判断是否全部被排除
      const shouldDeleteOriginal = await this.checkIfAllInstancesExcluded(
        event, 
        updatedExcludedDates
      );

      if (shouldDeleteOriginal) {
        // 🗑️ 删除原始记录，因为所有实例都被排除了
        // console.log('🧠 检测到所有实例都被排除，删除原始重复事件记录:', eventId);
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);

        if (deleteError) {
          console.error('删除原始事件记录失败:', deleteError);
          return false;
        }

        // console.log('✅ 智能清理完成：已删除无实例的重复事件记录');
        return true;
      } else {
        // 正常更新excluded_dates
        const { error: updateError } = await supabase
          .from('events')
          .update({ excluded_dates: updatedExcludedDates })
          .eq('id', eventId);

        if (updateError) {
          console.error('更新excluded_dates失败:', updateError);
          return false;
        }

        // console.log('✅ 成功排除重复事件实例:', { eventId, excludeDate });
        return true;
      }
    } catch (error) {
      console.error('排除重复事件实例失败:', error);
      return false;
    }
  },

  // 🧠 检查是否所有重复实例都被排除
  async checkIfAllInstancesExcluded(
    event: any,
    excludedDates: string[]
  ): Promise<boolean> {
    if (!event.start_datetime || !event.recurrence_type) {
      return false;
    }

    // 生成所有可能的重复实例日期
    const allInstanceDates = this.generateAllRecurringDates(
      event.start_datetime,
      event.recurrence_type,
      event.recurrence_end
    );

    // 检查是否所有日期都在excludedDates中
    const excludedSet = new Set(excludedDates);
    const allExcluded = allInstanceDates.every(date => excludedSet.has(date));

    // console.log('🧠 智能检查结果:', { 总实例数: allInstanceDates.length, 排除实例数: excludedDates.length, 是否全部排除: allExcluded });

    return allExcluded;
  },

  // 📊 生成所有重复实例的日期
  generateAllRecurringDates(
    startDateTime: string,
    recurrenceType: string,
    recurrenceEnd: string | null
  ): string[] {
    const dates: string[] = [];
    const startDate = new Date(startDateTime);
    const endDate = recurrenceEnd 
      ? new Date(recurrenceEnd + 'T23:59:59')
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 默认1年

    let currentDate = new Date(startDate);
    const maxInstances = 1000; // 防止无限循环
    let instanceCount = 0;

    while (currentDate <= endDate && instanceCount < maxInstances) {
      dates.push(currentDate.toISOString().split('T')[0]);
      
      // 计算下一个日期
      switch (recurrenceType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          return dates;
      }
      instanceCount++;
    }

    return dates;
  },

  // 📊 计算剩余实例数
  async calculateRemainingInstances(
    event: any,
    excludedDates: string[]
  ): Promise<number> {
    const allDates = this.generateAllRecurringDates(
      event.start_datetime,
      event.recurrence_type,
      event.recurrence_end
    );
    const excludedSet = new Set(excludedDates);
    return allDates.filter(date => !excludedSet.has(date)).length;
  },

  // 🗑️ 删除此事件及未来事件（通过设置recurrence_end）
  async deleteThisAndFutureEvents(
    eventId: string,
    cutoffDate: string
  ): Promise<boolean> {
    try {
      // 获取当前事件信息
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('recurrence_end, excluded_dates')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('获取事件失败:', fetchError);
        return false;
      }

      // 🔧 计算新的结束日期（cutoffDate的前一天）
      // 直接使用日期字符串操作避免时区问题
      const cutoffDate_parts = cutoffDate.split('-');
      const year = parseInt(cutoffDate_parts[0]);
      const month = parseInt(cutoffDate_parts[1]);
      const day = parseInt(cutoffDate_parts[2]);
      
      // 创建本地日期对象并减一天
      const cutoffDateObj = new Date(year, month - 1, day); // month-1因为Date构造函数中月份从0开始
      cutoffDateObj.setDate(cutoffDateObj.getDate() - 1);
      
      // 格式化为YYYY-MM-DD字符串，避免时区转换
      const newRecurrenceEnd = cutoffDateObj.getFullYear() + '-' + 
                               String(cutoffDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(cutoffDateObj.getDate()).padStart(2, '0');

      // console.log('🗑️ 删除此事件及未来事件:', { cutoffDate, newRecurrenceEnd });

      // 更新recurrence_end来停止在指定日期之前
      const { error: updateError } = await supabase
        .from('events')
        .update({ recurrence_end: newRecurrenceEnd })
        .eq('id', eventId);

      if (updateError) {
        console.error('更新recurrence_end失败:', updateError);
        return false;
      }

      // console.log('✅ 成功删除此事件及未来事件:', { eventId, cutoffDate, newRecurrenceEnd });
      return true;
    } catch (error) {
      console.error('删除此事件及未来事件失败:', error);
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
