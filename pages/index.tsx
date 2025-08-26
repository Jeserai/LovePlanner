import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/hooks/useAuth';
import { userService } from '../src/services/database';
import Layout from '../src/components/Layout';
import Calendar from '../src/components/Calendar';
import TaskBoard from '../src/components/TaskBoard';
import Shop from '../src/components/Shop';
import Settings from '../src/components/Settings';
import AuthForm from '../src/components/AuthForm';
import { getUserDisplayInfo } from '../src/services/authService';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { user, loading: authLoading, signOut } = useAuth();

  // 当认证状态变化时，获取或创建用户档案
  useEffect(() => {
    const initializeUser = async () => {
      if (user && !authLoading) {
        try {
          // 尝试获取用户档案
          let profile = await userService.getProfile(user.id);
          
          if (!profile) {
            // 如果没有档案，可能是新用户，等待触发器创建
            // 稍等一下再重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            profile = await userService.getProfile(user.id);
          }

          if (profile) {
            setUserProfile(profile);
            const userInfo = getUserDisplayInfo(profile);
            console.log(`✅ 用户档案加载成功: ${profile.display_name} (${userInfo?.uiTheme})`);
          } else {
            console.warn('⚠️ 未找到用户档案，可能需要完善信息');
            // 可以在这里引导用户完善档案
          }
        } catch (error) {
          console.error('❌ 初始化用户档案时出错:', error);
        }
      } else if (!user && !authLoading) {
        // 用户未登录
        setUserProfile(null);
        console.log('📝 用户未登录');
      }
      
      setIsInitializing(false);
    };

    initializeUser();
  }, [user, authLoading]);

  // 处理认证成功
  const handleAuthSuccess = (authUser: any, profile: any) => {
    console.log('🎉 认证成功:', authUser.email);
    console.log('📝 用户对象:', authUser);
    console.log('👤 用户档案:', profile);
    
    if (profile) {
      setUserProfile(profile);
    }
    
    // 强制更新初始化状态，确保页面重新渲染
    setIsInitializing(false);
    setActiveTab('calendar');
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await signOut();
      setUserProfile(null);
      setActiveTab('calendar');
      console.log('👋 用户已登出');
    } catch (error) {
      console.error('❌ 登出时出错:', error);
    }
  };

  // 渲染主应用内容
  const renderContent = () => {
    const currentUserName = userProfile?.display_name || user?.email || null;
    
    switch (activeTab) {
      case 'calendar':
        return <Calendar currentUser={currentUserName} />;
      case 'tasks':
        return <TaskBoard currentUser={currentUserName} />;
      case 'shop':
        return <Shop />;
      case 'settings':
        return <Settings />;
      default:
        return <Calendar currentUser={currentUserName} />;
    }
  };

  // 加载状态 - 认证状态检查中或用户初始化中
  if (authLoading || isInitializing) {
    return <LoadingScreen />;
  }

  // 路由逻辑：
  // 1. 未登录用户 -> 显示认证页面
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. 已登录用户 -> 显示主应用（默认日历视图）
  const currentUserName = userProfile?.display_name || user?.email || 'User';
  
  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      currentUser={currentUserName}
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