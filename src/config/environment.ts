/**
 * 环境配置文件
 * 用于区分开发/测试环境和生产环境的功能
 */

// 环境类型
export type Environment = 'development' | 'production' | 'test';

// 获取当前环境
export const getCurrentEnvironment = (): Environment => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_APP_ENV) {
    return process.env.NEXT_PUBLIC_APP_ENV as Environment;
  }
  
  // 根据 NODE_ENV 判断
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
};

// 环境配置
export const environmentConfig = {
  // 当前环境
  current: getCurrentEnvironment(),
  
  // 是否为生产环境
  isProduction: getCurrentEnvironment() === 'production',
  
  // 是否为开发环境
  isDevelopment: getCurrentEnvironment() === 'development',
  
  // 是否启用预设用户快速登录（仅非生产环境）
  enablePresetQuickLogin: getCurrentEnvironment() !== 'production',
  
  // 是否启用调试功能
  enableDebugFeatures: 
    process.env.NEXT_PUBLIC_ENABLE_DEBUG_FEATURES === 'true' || 
    getCurrentEnvironment() !== 'production',
  
  // 应用版本信息
  version: process.env.npm_package_version || '1.0.0',
  
  // 构建时间
  buildTime: new Date().toISOString(),
};

// 导出便捷函数
export const { 
  current: currentEnvironment,
  isProduction,
  isDevelopment,
  enablePresetQuickLogin,
  enableDebugFeatures 
} = environmentConfig;

// 环境检查函数
export const isFeatureEnabled = (feature: 'debugFeatures') => {
  switch (feature) {
    case 'debugFeatures':
      return enableDebugFeatures;
    default:
      return false;
  }
};

// 控制台输出环境信息（仅开发环境）
if (!isProduction && typeof window !== 'undefined') {
  console.log('🌍 Environment Config:', environmentConfig);
}
