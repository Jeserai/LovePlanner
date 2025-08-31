import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { UserProvider, useUser } from '../src/contexts/UserContext';
import { useAuth } from '../src/hooks/useAuth';
import { realtimeSyncService } from '../src/services/realtimeSync';
import { userService } from '../src/services/database';
import Layout from '../src/components/Layout';
import Calendar from '../src/components/Calendar';
import TaskBoard from '../src/components/TaskBoard';
import Shop from '../src/components/Shop';
import Settings from '../src/components/Settings';
import AuthForm from '../src/components/AuthForm';
import { Spinner } from '../src/components/ui/spinner';
// 路由测试工具已移除（清理调试信息）

// 加载组件
const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* 背景网格 */}
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        
        <div className="relative text-center space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Love Planner
              </h1>
              <p className="text-muted-foreground">
                Preparing your workspace...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
            正在为你准备甜蜜的工作空间...
          </p>
        </div>
      </div>
    </div>
  );
};

// 主应用组件 - 现在使用全局用户状态
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar'); // 默认显示日历
  const [initializedTabs, setInitializedTabs] = useState<Set<string>>(new Set(['calendar'])); // 跟踪已初始化的标签页
  const [appReady, setAppReady] = useState(false); // 应用就绪状态
  const { user, loading: authLoading, signOut } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  
  // 应用初始化和实时同步
  useEffect(() => {
    let visibilityCleanup: (() => void) | undefined;
    
    const initializeApp = async () => {
      if (user && userProfile && !appReady) {
        try {
          // 获取情侣关系ID
          const coupleData = await userService.getCoupleRelation(user.id);
          if (coupleData) {
            // 初始化实时同步
            realtimeSyncService.initialize(coupleData.id, user.id);
            
            // 初始化页面可见性同步
            visibilityCleanup = realtimeSyncService.initializeVisibilitySync();
            
            console.log('🔔 实时同步服务已启动');
            
            // 给一点时间让数据准备好，然后标记应用就绪
            setTimeout(() => {
              setAppReady(true);
            }, 500);
          } else {
            // 即使没有情侣关系，也标记为就绪
            setAppReady(true);
          }
        } catch (error) {
          console.error('❌ 初始化应用失败:', error);
          // 即使初始化失败，也要让应用继续运行
          setAppReady(true);
        }
      }
    };

    initializeApp();
    
    // 清理函数
    return () => {
      if (visibilityCleanup) {
        visibilityCleanup();
      }
    };
  }, [user, userProfile, appReady]);

  // 当切换标签页时，记录已初始化的标签页
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setInitializedTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(tab);
      return newSet;
    });
  };

  // 处理认证成功
  const handleAuthSuccess = (authUser: any, profile: any) => {
    console.log('🎉 认证成功:', authUser.email);
    setActiveTab('calendar');
    // 重置应用就绪状态，让应用重新初始化
    setAppReady(false);
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      // 清理实时同步
      realtimeSyncService.cleanup();
      
      await signOut();
      setActiveTab('calendar');
      setAppReady(false); // 重置应用状态
      console.log('👋 用户已登出');
    } catch (error) {
      console.error('❌ 登出时出错:', error);
    }
  };

  // 渲染主应用内容 - 只初始化访问过的标签页，保持其状态
  const renderContent = () => {
    const currentUserName = userProfile?.display_name || user?.email || null;
    
    return (
      <>
        {initializedTabs.has('calendar') && (
          <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
            <Calendar currentUser={currentUserName} />
          </div>
        )}
        {initializedTabs.has('tasks') && (
          <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
            {/* 使用集成了新数据结构的原版TaskBoard */}
            <TaskBoard currentUser={currentUserName} />
          </div>
        )}
        {initializedTabs.has('shop') && (
          <div style={{ display: activeTab === 'shop' ? 'block' : 'none' }}>
            <Shop />
          </div>
        )}
        {initializedTabs.has('settings') && (
          <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
            <Settings />
          </div>
        )}
      </>
    );
  };

  // 路由逻辑：
  // 1. 未登录用户 -> 显示认证页面（AuthForm会处理自己的loading状态）
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. 已登录但应用未就绪 -> 显示加载屏幕（包括用户资料、应用初始化等）
  if (authLoading || userLoading || !appReady) {
    return <LoadingScreen />;
  }

  // 3. 已登录用户 -> 显示主应用（默认日历视图）
  const currentUserName = userProfile?.display_name || user?.email || 'User';
  
  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
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
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
} 