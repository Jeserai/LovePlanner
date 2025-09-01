// 🕐 测试时间管理器
// 用于手动控制系统时间，方便测试时间相关功能

class TestTimeManager {
  private static instance: TestTimeManager;
  private mockTime: Date | null = null;
  private isTestMode: boolean = false;

  private constructor() {}

  static getInstance(): TestTimeManager {
    if (!TestTimeManager.instance) {
      TestTimeManager.instance = new TestTimeManager();
    }
    return TestTimeManager.instance;
  }

  // 设置模拟时间
  setMockTime(date: Date | string): void {
    this.mockTime = typeof date === 'string' ? new Date(date) : date;
    this.isTestMode = true;
    console.log('🕐 测试时间已设置为:', this.mockTime.toLocaleString());
  }

  // 获取当前时间（如果在测试模式下，返回模拟时间）
  getCurrentTime(): Date {
    if (this.isTestMode && this.mockTime) {
      return new Date(this.mockTime);
    }
    return new Date();
  }

  // 获取今天的日期字符串 (YYYY-MM-DD)
  getTodayString(): string {
    return this.getCurrentTime().toISOString().split('T')[0];
  }

  // 前进指定天数
  advanceDays(days: number): void {
    if (!this.isTestMode || !this.mockTime) {
      console.warn('⚠️ 请先设置测试时间');
      return;
    }
    
    const newTime = new Date(this.mockTime);
    newTime.setDate(newTime.getDate() + days);
    this.mockTime = newTime;
    console.log(`📅 时间前进 ${days} 天，当前时间:`, this.mockTime.toLocaleString());
  }

  // 后退指定天数
  goBackDays(days: number): void {
    this.advanceDays(-days);
  }

  // 设置为特定日期
  setDate(year: number, month: number, day: number): void {
    const currentTime = this.getCurrentTime();
    const newTime = new Date(year, month - 1, day, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());
    this.setMockTime(newTime);
  }

  // 重置为真实时间
  resetToRealTime(): void {
    this.mockTime = null;
    this.isTestMode = false;
    console.log('🔄 已重置为真实时间:', new Date().toLocaleString());
  }

  // 检查是否在测试模式
  isInTestMode(): boolean {
    return this.isTestMode;
  }

  // 获取模拟时间（如果有）
  getMockTime(): Date | null {
    return this.mockTime;
  }

  // 格式化显示当前时间状态
  getTimeStatus(): string {
    if (this.isTestMode && this.mockTime) {
      return `🧪 测试模式 - 模拟时间: ${this.mockTime.toLocaleString()}`;
    }
    return `⏰ 真实模式 - 当前时间: ${new Date().toLocaleString()}`;
  }

  // 快速设置为昨天
  setToYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.setMockTime(yesterday);
  }

  // 快速设置为明天
  setToTomorrow(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.setMockTime(tomorrow);
  }

  // 快速设置为一周前
  setToLastWeek(): void {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    this.setMockTime(lastWeek);
  }

  // 快速设置为一周后
  setToNextWeek(): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.setMockTime(nextWeek);
  }
}

// 导出单例实例
export const testTimeManager = TestTimeManager.getInstance();

// 便捷函数
export const getCurrentTime = () => testTimeManager.getCurrentTime();
export const getTodayString = () => testTimeManager.getTodayString();
export const setTestTime = (date: Date | string) => testTimeManager.setMockTime(date);
export const advanceTime = (days: number) => testTimeManager.advanceDays(days);
export const resetTime = () => testTimeManager.resetToRealTime();

// 全局暴露到window对象，方便在浏览器控制台中使用
if (typeof window !== 'undefined') {
  (window as any).testTime = {
    set: (date: string) => testTimeManager.setMockTime(date),
    advance: (days: number) => testTimeManager.advanceDays(days),
    goBack: (days: number) => testTimeManager.goBackDays(days),
    reset: () => testTimeManager.resetToRealTime(),
    status: () => console.log(testTimeManager.getTimeStatus()),
    yesterday: () => testTimeManager.setToYesterday(),
    tomorrow: () => testTimeManager.setToTomorrow(),
    lastWeek: () => testTimeManager.setToLastWeek(),
    nextWeek: () => testTimeManager.setToNextWeek()
  };
}
