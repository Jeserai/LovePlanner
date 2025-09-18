/**
 * 用户感知的存储服务
 * 解决多用户在同一台电脑上使用应用时的数据隔离问题
 */

export interface UserAwareStorageService {
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  clearUserData: () => void;
  getAllUserKeys: () => string[];
}

class UserAwareStorageServiceImpl implements UserAwareStorageService {
  private currentUserId: string | null = null;

  constructor() {
    // 初始化时不设置用户ID，等待主动设置
  }

  /**
   * 设置当前用户ID
   */
  setCurrentUserId(userId: string): void {
    console.log('🔐 用户感知存储：设置当前用户ID:', userId);
    this.currentUserId = userId;
  }

  /**
   * 清除当前用户ID
   */
  clearCurrentUserId(): void {
    console.log('🔐 用户感知存储：清除当前用户ID');
    this.currentUserId = null;
  }

  /**
   * 获取当前用户ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * 生成用户专属的存储key
   */
  private getUserKey(key: string): string {
    if (!this.currentUserId) {
      console.warn('⚠️ 用户感知存储：尚未设置用户ID，使用通用key');
      return `global_${key}`;
    }
    return `user_${this.currentUserId}_${key}`;
  }

  /**
   * 存储数据（自动添加用户前缀）
   */
  setItem(key: string, value: string): void {
    const userKey = this.getUserKey(key);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(userKey, value);
        console.log(`💾 用户感知存储：保存数据 ${userKey}`);
      }
    } catch (error) {
      console.error(`❌ 用户感知存储：保存失败 ${userKey}:`, error);
    }
  }

  /**
   * 获取数据（自动添加用户前缀）
   */
  getItem(key: string): string | null {
    const userKey = this.getUserKey(key);
    try {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem(userKey);
        if (value) {
          console.log(`📖 用户感知存储：读取数据 ${userKey}`);
        }
        return value;
      }
    } catch (error) {
      console.error(`❌ 用户感知存储：读取失败 ${userKey}:`, error);
    }
    return null;
  }

  /**
   * 删除数据（自动添加用户前缀）
   */
  removeItem(key: string): void {
    const userKey = this.getUserKey(key);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(userKey);
        console.log(`🗑️ 用户感知存储：删除数据 ${userKey}`);
      }
    } catch (error) {
      console.error(`❌ 用户感知存储：删除失败 ${userKey}:`, error);
    }
  }

  /**
   * 获取当前用户的所有存储key
   */
  getAllUserKeys(): string[] {
    if (!this.currentUserId || typeof window === 'undefined') {
      return [];
    }

    const userPrefix = `user_${this.currentUserId}_`;
    const allKeys = Object.keys(localStorage);
    return allKeys.filter(key => key.startsWith(userPrefix));
  }

  /**
   * 清除当前用户的所有数据（谨慎使用！）
   * 注意：这会永久删除用户数据，一般只在用户明确要求删除账户时使用
   */
  clearUserData(): void {
    if (!this.currentUserId) {
      console.warn('⚠️ 用户感知存储：无当前用户ID，无法清除数据');
      return;
    }

    const userKeys = this.getAllUserKeys();
    console.log(`🧹 用户感知存储：永久删除用户 ${this.currentUserId} 的 ${userKeys.length} 条数据`);
    
    userKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`❌ 用户感知存储：清除失败 ${key}:`, error);
      }
    });
  }

  /**
   * 清理当前会话（不删除用户数据）
   * 用于用户登出时，保留用户数据以便下次登录时恢复
   */
  clearSession(): void {
    console.log('🔄 用户感知存储：清理会话（保留用户数据）');
    this.clearCurrentUserId();
  }

  /**
   * 迁移旧的全局数据到用户专属存储
   */
  migrateGlobalData(oldKey: string, newKey: string): void {
    if (!this.currentUserId || typeof window === 'undefined') {
      return;
    }

    try {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        console.log(`🔄 用户感知存储：迁移数据 ${oldKey} → ${this.getUserKey(newKey)}`);
        this.setItem(newKey, oldData);
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
      console.error(`❌ 用户感知存储：迁移失败 ${oldKey}:`, error);
    }
  }

  /**
   * 获取所有用户的统计信息（用于调试）
   */
  getStorageStats(): { [userId: string]: number } {
    if (typeof window === 'undefined') {
      return {};
    }

    const stats: { [userId: string]: number } = {};
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (key.startsWith('user_')) {
        const match = key.match(/^user_([^_]+)_/);
        if (match) {
          const userId = match[1];
          stats[userId] = (stats[userId] || 0) + 1;
        }
      }
    });

    return stats;
  }
}

// 创建单例实例
export const userAwareStorage = new UserAwareStorageServiceImpl();

// 导出类型和实例
export default userAwareStorage;
