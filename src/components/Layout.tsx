import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getUserDisplayInfo } from '../services/authService';
import { ThemeButton } from './ui/Components';
import { Card } from './ui/card';
import { Sidebar, SidebarContent, SidebarNav, SidebarNavItem } from './ui/sidebar';
import DarkModeToggle from './ui/DarkModeToggle';
import TopBar from './TopBar';
import { useTranslation } from '../utils/i18n';
import Icon from './ui/Icon';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: string;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const { theme, useSidebarLayout, toggleLayout, language, setLanguage } = useTheme();
  const { userProfile, loading } = useUser();
  const t = useTranslation(language);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const tabs = [
    { 
      id: 'calendar', 
      name: t('calendar'), 
      icon: 'calendar' as const
    },
    { 
      id: 'tasks', 
      name: t('tasks'), 
      icon: 'list' as const
    },
    { 
      id: 'shop', 
      name: t('shop'), 
      icon: 'shopping-bag' as const
    },
    { 
      id: 'settings', 
      name: t('settings'), 
      icon: 'settings' as const
    },
  ];



  // 获取用户显示信息
  const getUserDisplayName = () => {
    if (!userProfile) return 'Guest';
    return userProfile.display_name || userProfile.username || 'User';
  };

  const displayName = getUserDisplayName();

  // 更新用户积分
  useEffect(() => {
    if (userProfile?.points !== undefined) {
      setUserPoints(userProfile.points);
    }
  }, [userProfile?.points]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 原来的上下布局
  const renderTopNavLayout = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with User Info and Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Combined User Info and Navigation Bar */}
          <div className="flex items-center justify-between h-16">
            {/* Left side: App name and Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Icon name="heart" size="md" className="text-primary" />
                <span className="text-base font-semibold text-foreground">LovePlanner</span>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-1">
                {tabs.map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
                        activeTab === tab.id
                          ? 'text-foreground bg-accent/20 font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                      }`}
                    >
                      <Icon name={tab.icon} size="sm" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Right side: User info and controls - 与TopBar保持完全一致的顺序和间距 */}
            <div className="flex items-center gap-2">
              {/* 通知按钮 */}
              <ThemeButton
                variant="ghost"
                size="sm"
                className="p-2 relative text-muted-foreground hover:text-foreground"
                title="通知"
              >
                <Icon name="bell" size="sm" />
                {/* 可以添加红点提示 */}
                {/* <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div> */}
              </ThemeButton>

              {/* 深色模式切换 */}
              <DarkModeToggle />

              {/* 布局切换 */}
              <ThemeButton
                variant="ghost"
                size="sm"
                onClick={toggleLayout}
                className="p-2 text-muted-foreground hover:text-foreground"
                title="切换到侧边栏布局"
              >
                <Icon name="menu" size="sm" />
              </ThemeButton>

              {/* 语言切换菜单 */}
              <div className="relative" ref={langMenuRef}>
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2 gap-1 text-muted-foreground hover:text-foreground"
                  title="切换语言"
                >
                  <Icon name="globe" size="sm" />
                  <span className="text-xs uppercase">{language}</span>
                  <Icon name="chevron-down" size="sm" />
                </ThemeButton>
                
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                    <button
                      className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setLanguage('zh');
                        setLangMenuOpen(false);
                      }}
                    >
                      中文
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setLanguage('en');
                        setLangMenuOpen(false);
                      }}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              {/* 积分显示 */}
              <div className="flex items-center gap-1">
                <Icon name="gift" size="sm" className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{userPoints}</span>
              </div>

              {/* 用户菜单 */}
              <div className="relative" ref={userMenuRef}>
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name="user" size="md" className="p-1 bg-muted rounded-full" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      {loading ? t('loading') : displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{loading ? '...' : (userProfile?.username || 'user')}
                    </div>
                  </div>
                  <Icon name="chevron-down" size="sm" />
                </ThemeButton>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-sm text-muted-foreground">@{userProfile?.username || 'user'}</div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          onTabChange('settings');
                          setUserMenuOpen(false);
                        }}
                      >
                        个人资料
                      </button>
                      <button
                        className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          onTabChange('settings');
                          setUserMenuOpen(false);
                        }}
                      >
                        账号设置
                      </button>
                    </div>
                    
                    <hr className="my-1 border-border" />
                    
                    {onLogout && (
                      <button
                        className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-destructive-foreground hover:bg-destructive/10 text-destructive flex items-center gap-2"
                        onClick={() => {
                          onLogout();
                          setUserMenuOpen(false);
                        }}
                      >
                        <Icon name="logout" size="sm" />
                        退出登录
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex-1 overflow-hidden pt-4" style={{ width: '100%', maxWidth: '1280px' }}>
        <div className="h-full w-full" style={{ width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );

  // 侧边栏布局
  const renderSidebarLayout = () => (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <TopBar 
        onLogout={onLogout} 
        onNavigateToSettings={() => onTabChange('settings')}
      />
      
      <div className="flex">
        {/* Left Sidebar - 简化版，专注导航 */}
        <Sidebar className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <SidebarContent className="flex flex-col p-0">
            <div className="flex-1 p-4">
            <SidebarNav>
              {tabs.map((tab) => {
                return (
                  <SidebarNavItem
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={sidebarCollapsed ? 'justify-center px-2' : ''}
                    title={sidebarCollapsed ? tab.name : undefined}
                  >
                    <Icon name={tab.icon} className="flex-shrink-0" />
                    {!sidebarCollapsed && <span>{tab.name}</span>}
                  </SidebarNavItem>
                );
              })}
              </SidebarNav>
            </div>
            
            {/* 收缩按钮 - Ant Design Pro风格，侧边栏中间右侧 */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-30">
              <ThemeButton
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`h-6 w-6 rounded-full p-0 flex items-center justify-center bg-background border border-border shadow-md hover:bg-accent hover:border-primary/50 transition-all duration-200`}
                title={sidebarCollapsed ? "展开侧边栏" : "收缩侧边栏"}
              >
                <Icon 
                  name={sidebarCollapsed ? "chevron-right" : "chevron-left"} 
                  size="sm" 
                  className="h-3 w-3"
                />
              </ThemeButton>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Main Content */}
          <main className="pt-4 px-4 pb-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return useSidebarLayout ? renderSidebarLayout() : renderTopNavLayout();
};

export default Layout; 