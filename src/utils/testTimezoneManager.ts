// 测试时区管理器 - 用于测试不同用户的时区显示

type TimezoneData = {
  name: string;
  offset: number; // UTC偏移分钟数，正数表示UTC+，负数表示UTC-
  description: string;
};

// 常见时区定义
const TIMEZONES: Record<string, TimezoneData> = {
  'Asia/Shanghai': {
    name: 'Asia/Shanghai',
    offset: -480, // UTC+8 (不使用夏令时)
    description: '北京时间 (UTC+8)'
  },
  'America/New_York': {
    name: 'America/New_York', 
    offset: 240, // UTC-4 (EDT, 夏令时)，9月仍在夏令时期间
    description: '纽约时间 (UTC-4, 夏令时)'
  },
  'Europe/London': {
    name: 'Europe/London',
    offset: -60, // UTC+1 (BST, 夏令时)，9月仍在夏令时期间
    description: '伦敦时间 (UTC+1, 夏令时)'
  },
  'Asia/Tokyo': {
    name: 'Asia/Tokyo',
    offset: -540, // UTC+9 (不使用夏令时)
    description: '东京时间 (UTC+9)'
  },
  'America/Los_Angeles': {
    name: 'America/Los_Angeles',
    offset: 420, // UTC-7 (PDT, 夏令时)，9月仍在夏令时期间
    description: '洛杉矶时间 (UTC-7, 夏令时)'
  }
};

class TestTimezoneManager {
  private mockTimezones: Map<string, string> = new Map(); // userId -> timezoneKey
  private isTestMode: boolean = false;

  // 启用测试模式
  enableTestMode() {
    this.isTestMode = true;
    console.log('🌍 时区测试模式已启用');
  }

  // 禁用测试模式
  disableTestMode() {
    this.isTestMode = false;
    this.mockTimezones.clear();
    console.log('🌍 时区测试模式已禁用，恢复真实时区');
  }

  // 设置用户的模拟时区
  setUserTimezone(userId: string, timezoneKey: string) {
    if (!TIMEZONES[timezoneKey]) {
      console.warn('未知的时区:', timezoneKey);
      return;
    }
    
    this.mockTimezones.set(userId, timezoneKey);
    console.log(`🌍 已设置用户 ${userId} 的时区为:`, TIMEZONES[timezoneKey].description);
  }

  // 获取用户的时区偏移（分钟）
  getTimezoneOffset(userId?: string): number {
    if (!this.isTestMode || !userId) {
      // 使用真实时区
      return new Date().getTimezoneOffset();
    }

    const timezoneKey = this.mockTimezones.get(userId);
    if (timezoneKey && TIMEZONES[timezoneKey]) {
      return TIMEZONES[timezoneKey].offset;
    }

    // 没有设置时区，使用真实时区
    return new Date().getTimezoneOffset();
  }

  // 获取用户的时区名称
  getTimezoneName(userId?: string): string {
    if (!this.isTestMode || !userId) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    const timezoneKey = this.mockTimezones.get(userId);
    if (timezoneKey && TIMEZONES[timezoneKey]) {
      return TIMEZONES[timezoneKey].name;
    }

    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // 获取用户的时区描述
  getTimezoneDescription(userId?: string): string {
    if (!this.isTestMode || !userId) {
      const offset = new Date().getTimezoneOffset();
      const hours = Math.abs(offset) / 60;
      const sign = offset <= 0 ? '+' : '-';
      return `当前时区 (UTC${sign}${hours})`;
    }

    const timezoneKey = this.mockTimezones.get(userId);
    if (timezoneKey && TIMEZONES[timezoneKey]) {
      return TIMEZONES[timezoneKey].description;
    }

    return '未设置测试时区';
  }

  // 获取所有可用时区
  getAvailableTimezones(): TimezoneData[] {
    return Object.values(TIMEZONES);
  }

  // 获取当前状态
  getStatus(userId?: string) {
    return {
      isTestMode: this.isTestMode,
      currentOffset: this.getTimezoneOffset(userId),
      currentTimezone: this.getTimezoneName(userId),
      currentDescription: this.getTimezoneDescription(userId),
      hasUserTimezone: userId ? this.mockTimezones.has(userId) : false
    };
  }

  // 将时间从一个时区转换到另一个时区
  convertTime(dateTime: Date | string, fromUserId?: string, toUserId?: string): Date {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    if (!this.isTestMode) {
      return date;
    }

    const fromOffset = this.getTimezoneOffset(fromUserId);
    const toOffset = this.getTimezoneOffset(toUserId);
    
    // 计算时区差异并调整时间
    const offsetDiff = toOffset - fromOffset;
    return new Date(date.getTime() + offsetDiff * 60 * 1000);
  }
}

// 全局实例
export const testTimezoneManager = new TestTimezoneManager();

// 类型导出
export type { TimezoneData };
export { TIMEZONES };
