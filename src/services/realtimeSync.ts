import { supabase } from '../lib/supabase';
import { globalEventService, GlobalEvents } from './globalEventService';

// 实时同步服务
class RealtimeSyncService {
  private channels: { [channelName: string]: any } = {};
  private isInitialized = false;

  // 初始化实时订阅
  initialize(coupleId: string, userId: string) {
    if (this.isInitialized) {
      return;
    }

    console.log('🔔 初始化实时同步服务', { coupleId, userId });

    // 订阅任务表变化
    this.subscribeToTasks(coupleId, userId);
    
    // 订阅事件表变化
    this.subscribeToEvents(coupleId, userId);
    
    // 订阅用户资料变化
    this.subscribeToUserProfiles(coupleId, userId);

    this.isInitialized = true;
  }

  // 订阅任务表变化
  private subscribeToTasks(coupleId: string, userId: string) {
    const channel = supabase
      .channel(`tasks-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有变化（INSERT, UPDATE, DELETE）
          schema: 'public',
          table: 'tasks',
          filter: `couple_id=eq.${coupleId}` // 只监听当前情侣的任务
        },
        (payload) => {
          console.log('📋 收到任务变化通知:', payload);
          
          // 检查是否是其他用户的操作
          const isOtherUser = (payload.new as any)?.creator_id !== userId || 
                             (payload.old as any)?.creator_id !== userId;
          
          if (isOtherUser) {
            console.log('👥 其他用户更新了任务，发布同步事件');
            globalEventService.emit(GlobalEvents.TASKS_UPDATED);
          }
        }
      )
      .subscribe();

    this.channels[`tasks-${coupleId}`] = channel;
  }

  // 订阅事件表变化
  private subscribeToEvents(coupleId: string, userId: string) {
    const channel = supabase
      .channel(`events-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'events',
          filter: `couple_id=eq.${coupleId}` // 只监听当前情侣的事件
        },
        (payload) => {
          console.log('📅 收到事件变化通知:', payload);
          
          // 检查是否是其他用户的操作
          const isOtherUser = (payload.new as any)?.created_by !== userId || 
                             (payload.old as any)?.created_by !== userId;
          
          if (isOtherUser) {
            console.log('👥 其他用户更新了事件，发布同步事件');
            globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
          }
        }
      )
      .subscribe();

    this.channels[`events-${coupleId}`] = channel;
  }

  // 订阅用户资料变化
  private subscribeToUserProfiles(coupleId: string, userId: string) {
    // 获取情侣中的所有用户ID
    this.getCoupleUserIds(coupleId).then(userIds => {
      userIds.forEach(profileUserId => {
        const channel = supabase
          .channel(`profile-${profileUserId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_profiles', 
              filter: `id=eq.${profileUserId}`
            },
            (payload) => {
              console.log('👤 收到用户资料变化通知:', payload);
              
              // 如果是其他用户的资料更新
              if (profileUserId !== userId) {
                console.log('👥 其他用户更新了资料，发布同步事件');
                globalEventService.emit(GlobalEvents.USER_PROFILE_UPDATED);
              }
            }
          )
          .subscribe();

        this.channels[`profile-${profileUserId}`] = channel;
      });
    });
  }

  // 获取情侣中的用户ID列表
  private async getCoupleUserIds(coupleId: string): Promise<string[]> {
    try {
      const { data: couple, error } = await supabase
        .from('couples')
        .select('user1_id, user2_id')
        .eq('id', coupleId)
        .single();

      if (error || !couple) {
        console.error('获取情侣用户ID失败:', error);
        return [];
      }

      return [couple.user1_id, couple.user2_id].filter(Boolean);
    } catch (error) {
      console.error('获取情侣用户ID时出错:', error);
      return [];
    }
  }

  // 页面可见性变化时刷新数据
  initializeVisibilitySync() {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 页面重新可见，发布刷新事件');
        // 页面重新可见时，刷新所有数据以确保同步
        globalEventService.emit(GlobalEvents.TASKS_UPDATED);
        globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
        globalEventService.emit(GlobalEvents.USER_PROFILE_UPDATED);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 返回清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // 清理所有订阅
  cleanup() {
    console.log('🧹 清理实时同步订阅');
    
    Object.values(this.channels).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    
    this.channels = {};
    this.isInitialized = false;
  }

  // 强制刷新所有数据（用于错误恢复）
  forceRefreshAll() {
    console.log('🔄 强制刷新所有数据');
    globalEventService.emit(GlobalEvents.TASKS_UPDATED);
    globalEventService.emit(GlobalEvents.EVENTS_UPDATED);
    globalEventService.emit(GlobalEvents.USER_PROFILE_UPDATED);
  }
}

// 导出单例实例
export const realtimeSyncService = new RealtimeSyncService();
