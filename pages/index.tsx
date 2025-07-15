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
  
  if (theme === 'pixel') {
    return (
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center pixel-scanlines crt-screen">
        {/* 像素风背景效果 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 霓虹粒子效果 */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-pixel-accent rounded-pixel animate-pixel-pulse neon-border"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-pixel-success rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-20 w-2 h-2 bg-pixel-warning rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-pixel-purple rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1.5s'}}></div>
          
          {/* 浮动装饰元素 */}
          <div className="absolute top-32 left-32 w-4 h-4 bg-pixel-cyan rounded-pixel border-2 border-white animate-pixel-bounce"></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-pixel-lime rounded-pixel border-2 border-white animate-neon-flicker"></div>
          <div className="absolute bottom-32 left-40 w-3 h-3 bg-pixel-orange rounded-pixel border-2 border-white animate-cyberpunk-slide"></div>
          
          {/* 数据流背景 */}
          <div className="data-stream absolute top-1/4 w-full h-px"></div>
          <div className="data-stream absolute top-2/4 w-full h-px" style={{animationDelay: '2s'}}></div>
          <div className="data-stream absolute top-3/4 w-full h-px" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="text-center relative z-10">
          {/* 像素风加载框 */}
          <div className="bg-pixel-panel border-4 border-white rounded-pixel shadow-pixel-lg p-8 pixel-matrix neon-border">
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pixel-accent via-pixel-cyan to-pixel-lime border-b-4 border-black"></div>
            <div className="absolute top-1 left-1 w-4 h-2 bg-pixel-warning border-2 border-black rounded-pixel animate-neon-flicker"></div>
            <div className="absolute top-1 left-7 w-4 h-2 bg-pixel-success border-2 border-black rounded-pixel animate-neon-flicker" style={{animationDelay: '0.1s'}}></div>
            <div className="absolute top-1 left-13 w-4 h-2 bg-pixel-info border-2 border-black rounded-pixel animate-neon-flicker" style={{animationDelay: '0.2s'}}></div>
            
            {/* 加载图标和文字 */}
            <div className="mt-4 mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-pixel-accent border-4 border-white rounded-pixel flex items-center justify-center neon-border">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-pixel animate-spin"></div>
              </div>
              <h2 className="text-xl font-retro font-bold text-pixel-text mb-2 tracking-wider uppercase neon-text cyber-glitch" data-text="LOADING_SYSTEM">
                LOADING_SYSTEM
              </h2>
              <div className="bg-pixel-card border-2 border-pixel-cyan rounded-pixel p-2 mb-4 neon-border">
                <p className="text-pixel-cyan text-sm font-mono neon-text animate-neon-glow">
                  INITIALIZING LOVE_PLANNER.EXE...
                </p>
              </div>
              
              {/* 像素风进度条 */}
              <div className="w-full max-w-xs mx-auto">
                <div className="pixel-progress h-4 mb-2">
                  <div className="pixel-progress-bar w-3/4"></div>
                </div>
                <p className="text-xs text-pixel-textMuted font-mono uppercase tracking-wide">
                  LOADING ASSETS... 75%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 莫奈主题加载屏幕
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-50 to-blue-50 flex items-center justify-center">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-20 h-20 bg-secondary-200/15 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-32 h-32 bg-primary-200/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-32 left-40 w-24 h-24 bg-blue-200/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-lavender-200/10 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="text-center relative z-10">
        <div className="card-cutesy p-8 backdrop-blur-md bg-white/60 shadow-dream">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-display font-bold bg-water-lily bg-clip-text text-transparent mb-2">
            爱情规划师
          </h2>
          <p className="text-gray-600 text-sm">
            正在为你准备甜蜜的体验...
          </p>
        </div>
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

  // 处理登录
  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
    localStorage.setItem('hasLoggedInBefore', 'true'); // 记录已登录过
    setIsLoading(false);
  };

  // 处理登出 - 登出后清理状态
  const handleLogout = () => {
    const userName = currentUser;
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('calendar'); // 重置到默认标签页
  };

  // 渲染主应用内容
  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <Calendar currentUser={currentUser} />;
      case 'tasks':
        return <TaskBoard currentUser={currentUser} />;
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