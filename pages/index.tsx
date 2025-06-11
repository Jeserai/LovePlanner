import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import Layout from '../src/components/Layout';
import Calendar from '../src/components/Calendar';
import TaskBoard from '../src/components/TaskBoard';
import Shop from '../src/components/Shop';
import Settings from '../src/components/Settings';
import Login from '../src/components/Login';
// 导入路由测试工具（开发环境）
import '../src/utils/testRouting.js';

// 加载组件
const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'pixel' 
        ? 'bg-pixel-bg pixel-scanlines' 
        : 'bg-gradient-to-br from-primary-100 via-secondary-50 to-blue-50'
    }`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${
          theme === 'pixel'
            ? 'border-pixel-border border-t-pixel-accent'
            : 'border-primary-200 border-t-primary-500'
        }`}></div>
        <p className={`${
          theme === 'pixel' 
            ? 'text-pixel-text font-mono uppercase tracking-wide' 
            : 'text-gray-600'
        }`}>
          {theme === 'pixel' ? 'LOADING_SYSTEM...' : '加载中...'}
        </p>
      </div>
    </div>
  );
};

// 主应用组件
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar'); // 默认显示日历
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 在组件挂载时检查本地存储的登录状态
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setCurrentUser(savedUser);
          // 已登录用户默认显示日历视图
          setActiveTab('calendar');
          console.log(`✅ 用户已登录: ${savedUser}, 默认显示日历视图`);
        } else {
          console.log('📝 用户未登录，将显示登录页面');
        }
      } catch (error) {
        console.error('❌ 检查登录状态时出错:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 稍微延迟以确保主题正确加载
    const timer = setTimeout(checkAuthStatus, 100);
    return () => clearTimeout(timer);
  }, []);

  // 处理登录 - 登录成功后直接跳转到日历
  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
    setActiveTab('calendar'); // 确保登录后显示日历
    
    // 检查是否是首次登录
    const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
    if (isFirstLogin) {
      localStorage.setItem('hasLoggedInBefore', 'true');
      console.log(`🌟 欢迎首次使用爱情规划师: ${username}! 默认显示日历视图`);
      
      // 可以在这里添加首次登录引导逻辑
      setTimeout(() => {
        console.log('💡 提示: 你可以通过顶部导航栏切换到任务看板、个人商店等功能');
      }, 2000);
    } else {
      console.log(`🎉 欢迎回来: ${username}, 跳转到日历视图`);
    }
  };

  // 处理登出 - 登出后清理状态
  const handleLogout = () => {
    const userName = currentUser;
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('calendar'); // 重置到默认标签页
    console.log(`👋 用户 ${userName} 已登出，返回登录页面`);
  };

  // 渲染主应用内容
  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <Calendar currentUser={currentUser} />;
      case 'tasks':
        return <TaskBoard />;
      case 'shop':
        return <Shop />;
      case 'settings':
        return <Settings />;
      default:
        return <Calendar currentUser={currentUser} />;
    }
  };

  // 加载状态 - 检查登录状态时显示
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 路由逻辑：
  // 1. 未登录用户 -> 显示登录页面
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. 已登录用户 -> 显示主应用（默认日历视图）
  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
} 