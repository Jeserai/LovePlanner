/**
 * 最后登录邮箱服务
 * 仅存储最后一次登录的邮箱地址，提升用户体验
 */

const LAST_EMAIL_KEY = 'love_planner_last_email';

export const lastEmailService = {
  /**
   * 保存最后登录的邮箱
   */
  saveLastEmail(email: string): void {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email);
    } catch (error) {
      console.error('保存邮箱失败:', error);
    }
  },

  /**
   * 获取最后登录的邮箱
   */
  getLastEmail(): string {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) || '';
    } catch (error) {
      console.error('获取邮箱失败:', error);
      return '';
    }
  },

  /**
   * 清除保存的邮箱
   */
  clearLastEmail(): void {
    try {
      localStorage.removeItem(LAST_EMAIL_KEY);
    } catch (error) {
      console.error('清除邮箱失败:', error);
    }
  }
};

