// 全局事件服务 - 用于跨组件数据同步
class GlobalEventService {
  private eventListeners: { [eventType: string]: Array<() => void> } = {};

  // 订阅事件
  subscribe(eventType: string, callback: () => void) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(callback);

    // 返回取消订阅的函数
    return () => {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(
        cb => cb !== callback
      );
    };
  }

  // 发布事件
  emit(eventType: string) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
    console.log(`📡 全局事件发布: ${eventType}`);
  }

  // 清理所有事件监听器
  cleanup() {
    this.eventListeners = {};
  }
}

// 导出单例实例
export const globalEventService = new GlobalEventService();

// 预定义事件类型
export const GlobalEvents = {
  TASKS_UPDATED: 'tasks_updated',
  EVENTS_UPDATED: 'events_updated',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  COUPLE_DATA_UPDATED: 'couple_data_updated'
} as const;
