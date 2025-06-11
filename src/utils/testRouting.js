// 路由测试工具
// 用于测试登录/登出流程和页面路由

export const testRouting = () => {
  console.log('🔍 开始测试路由逻辑...');
  
  // 检查当前登录状态
  const currentUser = localStorage.getItem('currentUser');
  console.log(`当前用户: ${currentUser || '未登录'}`);
  
  if (currentUser) {
    console.log('✅ 用户已登录，应该显示主应用（日历视图）');
    
    // 测试日历默认视图
    if (currentUser.toLowerCase().includes('cow')) {
      console.log('🐄 Cow用户登录，默认应该显示Cow的个人日历');
    } else if (currentUser.toLowerCase().includes('cat')) {
      console.log('🐱 Cat用户登录，默认应该显示Cat的个人日历');
    }
  } else {
    console.log('📝 用户未登录，应该显示登录页面');
  }
};

export const testCowCalendar = () => {
  console.log('🐄 测试Cow用户日历默认视图...');
  simulateLogin('cow');
};

export const testCatCalendar = () => {
  console.log('🐱 测试Cat用户日历默认视图...');
  simulateLogin('whimsical cat');
};

export const simulateLogin = (username = 'whimsical cat') => {
  console.log(`🎭 模拟用户登录: ${username}`);
  localStorage.setItem('currentUser', username);
  
  // 预测默认日历视图
  if (username.toLowerCase().includes('cow')) {
    console.log('✅ 登录完成，页面应该跳转到Cow的个人日历视图');
  } else if (username.toLowerCase().includes('cat')) {
    console.log('✅ 登录完成，页面应该跳转到Cat的个人日历视图');
  } else {
    console.log('✅ 登录完成，页面应该跳转到共同日历视图');
  }
  
  window.location.reload();
};

export const simulateLogout = () => {
  console.log('👋 模拟用户登出');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('hasLoggedInBefore'); // 可选：重置首次登录标记
  console.log('✅ 登出完成，页面应该跳转到登录页面');
  window.location.reload();
};

export const clearAllData = () => {
  console.log('🧹 清除所有本地数据');
  localStorage.clear();
  console.log('✅ 数据清除完成，页面将重置到初始状态');
  window.location.reload();
};

// 在浏览器控制台中可用的全局函数
if (typeof window !== 'undefined') {
  window.testRouting = testRouting;
  window.testCowCalendar = testCowCalendar;
  window.testCatCalendar = testCatCalendar;
  window.simulateLogin = simulateLogin;
  window.simulateLogout = simulateLogout;
  window.clearAllData = clearAllData;
  
  console.log(`
🎮 路由测试工具已加载！
可用命令：
- testRouting() - 检查当前路由状态
- testCowCalendar() - 测试Cow用户默认日历视图
- testCatCalendar() - 测试Cat用户默认日历视图
- simulateLogin('username') - 模拟用户登录
- simulateLogout() - 模拟用户登出
- clearAllData() - 清除所有本地数据

🐄 快速测试：testCowCalendar()
  `);
} 