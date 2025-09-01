// 统一时区处理服务
// 核心原则：数据库存储UTC，前端按用户时区显示

/**
 * 获取用户当前时区
 * 优先级：测试时区 > 浏览器时区
 */
export function getUserTimezone(): string {
  // 开发环境下，优先使用测试时区
  if (process.env.NODE_ENV === 'development') {
    const testTimezone = getTestTimezone();
    if (testTimezone) {
      return testTimezone;
    }
  }
  
  // 生产环境或无测试时区时，使用浏览器时区
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * 获取用户时区偏移量（分钟）
 * 返回值：正数表示东时区，负数表示西时区
 */
export function getUserTimezoneOffset(): number {
  // 开发环境下的测试时区偏移
  if (process.env.NODE_ENV === 'development') {
    const testOffset = getTestTimezoneOffset();
    if (testOffset !== null) {
      return testOffset;
    }
  }
  
  // 获取浏览器时区偏移（注意：getTimezoneOffset返回的是相反的值）
  return -new Date().getTimezoneOffset();
}

/**
 * 从testTimezoneManager获取测试时区（开发环境）
 */
function getTestTimezone(): string | null {
  try {
    // 动态导入testTimezoneManager，避免生产环境错误
    const { testTimezoneManager } = require('./testTimezoneManager');
    return testTimezoneManager.getCurrentTimezone();
  } catch {
    return null;
  }
}

/**
 * 从testTimezoneManager获取测试时区偏移（开发环境）
 */
function getTestTimezoneOffset(): number | null {
  try {
    // 动态导入testTimezoneManager
    const { testTimezoneManager } = require('./testTimezoneManager');
    return testTimezoneManager.getCurrentOffset();
  } catch {
    return null;
  }
}

/**
 * 将UTC时间转换为用户本地时间字符串
 * @param utcTimeString UTC时间字符串，如"14:30:00"或"2025-09-02T14:30:00.000Z"
 * @param userTimezone 用户时区，如"Asia/Shanghai"
 * @returns 本地时间字符串
 */
export function convertUTCToUserTime(utcTimeString: string, userTimezone?: string): string {
  if (!utcTimeString) return '';
  
  const timezone = userTimezone || getUserTimezone();
  
  try {
    let utcDate: Date;
    
    // 处理两种格式：纯时间"HH:MM:SS" 和 完整ISO时间
    if (utcTimeString.includes('T')) {
      // 完整ISO格式：2025-09-02T14:30:00.000Z
      utcDate = new Date(utcTimeString);
    } else if (utcTimeString.includes(':')) {
      // 纯时间格式：14:30:00，需要组合当前日期
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      utcDate = new Date(`${today}T${utcTimeString}Z`);
    } else {
      throw new Error(`不支持的时间格式: ${utcTimeString}`);
    }
    
    // 使用Intl.DateTimeFormat进行时区转换
    return utcDate.toLocaleString('zh-CN', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('时区转换失败:', error, 'UTC时间:', utcTimeString);
    return utcTimeString; // 转换失败时返回原值
  }
}

/**
 * 将UTC时间转换为用户本地时间（仅时间部分）
 * @param utcTimeString UTC时间字符串，如"14:30:00"
 * @param eventDate 事件日期，如"2025-09-02"
 * @param userTimezone 用户时区
 * @returns 本地时间字符串，如"22:30:00"
 */
export function convertUTCTimeToUserTime(utcTimeString: string, eventDate: string, userTimezone?: string): string {
  if (!utcTimeString || !eventDate) return utcTimeString;
  
  const timezone = userTimezone || getUserTimezone();
  
  try {
    // 组合完整的UTC日期时间
    const utcDateTime = `${eventDate}T${utcTimeString}Z`;
    const utcDate = new Date(utcDateTime);
    
    // 转换到用户时区，只返回时间部分
    return utcDate.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('时间转换失败:', error);
    return utcTimeString;
  }
}

/**
 * 将用户本地时间转换为UTC时间存储到数据库
 * @param localDateTime 用户本地时间，如"2025-09-02T22:30"（datetime-local格式）
 * @param userTimezone 用户时区
 * @returns UTC时间字符串，如"2025-09-02T14:30:00.000Z"
 */
export function convertUserTimeToUTC(localDateTime: string, userTimezone?: string): string {
  if (!localDateTime) return '';
  
  const timezone = userTimezone || getUserTimezone();
  
  try {
    // 创建在用户时区的日期对象
    const localDate = new Date(localDateTime);
    
    // 获取用户时区偏移量
    const offsetMinutes = getUserTimezoneOffset();
    
    // 转换为UTC
    const utcDate = new Date(localDate.getTime() - (offsetMinutes * 60 * 1000));
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('本地时间转UTC失败:', error);
    return localDateTime;
  }
}

/**
 * 将用户本地时间转换为UTC时间部分（仅时间）
 * @param localDateTime 用户本地时间，如"2025-09-02T22:30"
 * @param userTimezone 用户时区
 * @returns UTC时间部分，如"14:30:00"
 */
export function convertUserTimeToUTCTime(localDateTime: string, userTimezone?: string): string {
  const utcISO = convertUserTimeToUTC(localDateTime, userTimezone);
  if (!utcISO) return '';
  
  try {
    // 从ISO字符串中提取时间部分
    return utcISO.split('T')[1].split('.')[0]; // "14:30:00"
  } catch (error) {
    console.error('提取UTC时间部分失败:', error);
    return '';
  }
}

/**
 * 将UTC时间转换为用户本地的datetime-local格式
 * 用于表单输入框的默认值
 * @param utcISO UTC时间，如"2025-09-02T14:30:00.000Z"
 * @param userTimezone 用户时区
 * @returns datetime-local格式，如"2025-09-02T22:30"
 */
export function convertUTCToUserDateTimeLocal(utcISO: string, userTimezone?: string): string {
  if (!utcISO) return '';
  
  const timezone = userTimezone || getUserTimezone();
  
  try {
    const utcDate = new Date(utcISO);
    
    // 转换到用户时区
    const offsetMinutes = getUserTimezoneOffset();
    const localDate = new Date(utcDate.getTime() + (offsetMinutes * 60 * 1000));
    
    // 格式化为datetime-local格式（不包含秒）
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('UTC转datetime-local失败:', error);
    return '';
  }
}

/**
 * 调试函数：显示时区转换信息
 */
export function debugTimezone(label: string, timeString: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🕐 [${label}]`, {
      原始时间: timeString,
      用户时区: getUserTimezone(),
      时区偏移: getUserTimezoneOffset(),
      转换结果: convertUTCToUserTime(timeString)
    });
  }
}
