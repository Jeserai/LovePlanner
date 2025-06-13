// 主题初始化工具
// 用于重置主题为新的默认像素风格

export const resetToDefaultTheme = () => {
  // 清除旧的主题设置
  localStorage.removeItem('theme');
  
  // 设置新的默认主题
  localStorage.setItem('theme', 'pixel');
  
  // 立即应用主题样式
  document.documentElement.className = 'pixel';
  document.body.className = 'pixel-theme';
  
  // 刷新页面以确保完全应用
  window.location.reload();
};

// 在浏览器控制台中可用的全局函数
if (typeof window !== 'undefined') {
  window.resetTheme = resetToDefaultTheme;
} 