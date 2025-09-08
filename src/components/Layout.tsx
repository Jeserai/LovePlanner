import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getUserDisplayInfo } from '../services/authService';
import { ThemeButton } from './ui/Components';
import { Card } from './ui/card';
import { Sidebar, SidebarHeader, SidebarContent, SidebarNav, SidebarNavItem } from './ui/sidebar';
import DarkModeToggle from './ui/DarkModeToggle';
import LanguageToggle from './ui/LanguageToggle';
import { useTranslation } from '../utils/i18n';
import { 
  CalendarIcon, 
  ListBulletIcon, 
  ShoppingBagIcon, 
  Cog6ToothIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  HeartIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: string;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const { theme, useSidebarLayout, toggleLayout, language } = useTheme();
  const { userProfile, loading } = useUser();
  const t = useTranslation(language);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const tabs = [
    { 
      id: 'calendar', 
      name: t('calendar'), 
      icon: CalendarIcon
    },
    { 
      id: 'tasks', 
      name: t('tasks'), 
      icon: ListBulletIcon
    },
    { 
      id: 'shop', 
      name: t('shop'), 
      icon: ShoppingBagIcon
    },
    { 
      id: 'settings', 
      name: t('settings'), 
      icon: Cog6ToothIcon
    },
  ];



  // 获取用户显示信息
  const getUserDisplayName = () => {
    if (!userProfile) return 'Guest';
    return userProfile.display_name || userProfile.username || 'User';
  };

  const displayName = getUserDisplayName();

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
                <HeartIcon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Love Planner</span>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
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
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Right side: User info and controls */}
            <div className="flex items-center gap-3">
              {/* 功能按钮组 */}
              <div className="flex items-center gap-2">
                <LanguageToggle />
                
                <DarkModeToggle />
                
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleLayout}
                  className="gap-2"
                >
                  <Bars3Icon className="h-4 w-4" />
                  {t('sidebar')}
                </ThemeButton>
              </div>
              
              {/* 用户信息和退出按钮组 */}
              <div className="flex items-center gap-2">
                {/* User Display */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium border rounded-md border-border bg-card text-card-foreground">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {loading ? t('loading') : displayName}
                  </span>
                </div>
                
                {onLogout && (
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    {t('logout')}
                  </ThemeButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex-1 overflow-hidden">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );

  // 侧边栏布局
  const renderSidebarLayout = () => (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <Sidebar className={`fixed left-0 top-0 z-40 h-full transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <HeartIcon className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">Love Planner</span>
              </div>
            )}
            <ThemeButton
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              {sidebarCollapsed ? 
                <ChevronRightIcon className="h-4 w-4" /> : 
                <ChevronLeftIcon className="h-4 w-4" />
              }
            </ThemeButton>
          </div>
        </SidebarHeader>
        
        {/* Top User Info in Sidebar */}
        <div className="p-3 border-b">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {loading ? t('loading') : displayName}
                  </p>
                </div>
              )}
            </div>
            
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 mt-3">
                <DarkModeToggle />
                
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleLayout}
                  className="gap-2 text-xs"
                >
                  <Bars3Icon className="h-3 w-3" />
                  顶栏
                </ThemeButton>
                
                {onLogout && (
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive text-xs"
                  >
                    <ArrowLeftOnRectangleIcon className="h-3 w-3" />
                    退出
                  </ThemeButton>
                )}
              </div>
            )}
          </Card>
        </div>
        
        <SidebarContent>
          <SidebarNav>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <SidebarNavItem
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={sidebarCollapsed ? 'justify-center px-2' : ''}
                  title={sidebarCollapsed ? tab.name : undefined}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{tab.name}</span>}
                </SidebarNavItem>
              );
            })}
          </SidebarNav>
        </SidebarContent>
      </Sidebar>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="mx-auto max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  return useSidebarLayout ? renderSidebarLayout() : renderTopNavLayout();
};

export default Layout; 