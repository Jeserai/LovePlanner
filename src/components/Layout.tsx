import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getUserDisplayInfo } from '../services/authService';
import { HeartIcon, CalendarDaysIcon, ListBulletIcon, ShoppingBagIcon, Cog6ToothIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { ThemeButton } from './ui/Components';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: string;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const { theme } = useTheme();
  const { userProfile, loading } = useUser();
  
  const tabs = [
    { 
      id: 'calendar', 
      name: theme === 'pixel' ? 'CALENDAR' : theme === 'modern' ? 'Calendar' : 'CALENDAR', 
      icon: CalendarDaysIcon 
    },
    { 
      id: 'tasks', 
      name: theme === 'pixel' ? 'TASKS' : theme === 'modern' ? 'Tasks' : 'TASKS', 
      icon: ListBulletIcon 
    },
    { 
      id: 'shop', 
      name: theme === 'pixel' ? 'SHOP' : theme === 'modern' ? 'Shop' : 'SHOP', 
      icon: ShoppingBagIcon 
    },
    { 
      id: 'settings', 
      name: theme === 'pixel' ? 'SETTINGS' : theme === 'modern' ? 'Settings' : 'SETTINGS', 
      icon: Cog6ToothIcon 
    },
  ];



  // 根据真实用户信息和主题获取显示信息
  const getUserInfo = () => {
    if (!userProfile) {
      return { 
        icon: 'user',
        name: 'Guest', 
        color: 'gray',
        emoji: '👤'
      };
    }

    const displayName = userProfile.display_name || userProfile.username || 'User';
    const userDisplayInfo = getUserDisplayInfo(userProfile);
    const uiTheme = userDisplayInfo?.uiTheme;

    if (uiTheme === 'cat') {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? displayName.toUpperCase() : displayName, 
        color: theme === 'fresh' ? 'cat' : theme === 'modern' ? 'purple' : 'primary',
        emoji: theme === 'modern' ? '' : '🐱'
      };
    } else if (uiTheme === 'cow') {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? displayName.toUpperCase() : displayName, 
        color: theme === 'fresh' ? 'cow' : theme === 'modern' ? 'blue' : 'blue',
        emoji: theme === 'modern' ? '' : '🐮'
      };
    } else {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? displayName.toUpperCase() : displayName, 
        color: 'gray',
        emoji: '👤'
      };
    }
  };

  const userInfo = getUserInfo();

  return (
    <div className={`min-h-screen ${
      theme === 'pixel' ? 'bg-pixel-bg' : 
      theme === 'fresh' ? 'bg-fresh-bg' :
      theme === 'modern' ? 'bg-background' :
      'bg-fresh-bg'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${
        theme === 'pixel' 
          ? 'bg-pixel-panel border-b-2 border-pixel-border' 
          : theme === 'fresh'
          ? 'bg-fresh-panel border-b border-fresh-border shadow-fresh-sm backdrop-blur-sm'
          : theme === 'modern'
          ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border'
          : 'bg-pixel-panel border-b-2 border-pixel-border'
      }`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${
          theme === 'modern' ? 'max-w-7xl' : 'max-w-8xl'
        }`}>
          <div className={`flex items-center justify-between ${
            theme === 'modern' ? 'h-16' : 'py-4'
          }`}>
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              {theme === 'pixel' ? (
                <PixelIcon name="heart" className="text-pixel-accent" size="lg" glow />
              ) : theme === 'fresh' ? (
                <span className="text-3xl animate-fresh-breathe">💚</span>
              ) : theme === 'modern' ? (
                <div className="flex items-center space-x-2">
                  <HeartIcon className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-lg text-foreground">Love Planner</span>
                </div>
              ) : (
                <HeartIcon className="w-8 h-8 text-secondary-500" />
              )}
              {theme !== 'modern' && (
                <h1 className={`text-2xl font-bold ${
                  theme === 'pixel' 
                    ? 'font-retro text-pixel-text tracking-wider' 
                    : theme === 'fresh'
                    ? 'font-display text-fresh-text fresh-gradient-text'
                    : 'font-display bg-water-lily bg-clip-text text-transparent'
                }`}>
                  {theme === 'pixel' ? 'LOVE_PLANNER.EXE' : theme === 'fresh' ? 'Love Planner' : '爱情规划师'}
                </h1>
              )}
            </div>
            
            {/* Navigation */}
            <nav className={`flex items-center space-x-1 ${
              theme === 'pixel' 
                ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel p-1' 
                : theme === 'fresh'
                ? 'bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh backdrop-blur-sm p-1'
                : theme === 'modern'
                ? 'bg-muted/50 rounded-lg p-1'
                : 'bg-white/40 backdrop-blur-md rounded-2xl shadow-dream p-1'
            }`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 transition-all duration-200 ${
                      theme === 'pixel' 
                        ? `rounded-pixel font-mono text-sm uppercase px-4 py-2 ${
                            activeTab === tab.id
                              ? 'bg-pixel-accent text-black font-bold shadow-pixel border border-black'
                              : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                          }`
                        : theme === 'fresh'
                        ? `rounded-fresh font-medium text-sm px-4 py-2 ${
                            activeTab === tab.id
                              ? 'bg-fresh-accent text-white shadow-fresh-sm'
                              : 'text-fresh-text hover:bg-fresh-primary hover:text-fresh-accent'
                          }`
                        : theme === 'modern'
                        ? `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                            activeTab === tab.id
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`
                        : `rounded-xl px-4 py-2 ${
                            activeTab === tab.id
                              ? 'bg-water-lily text-white shadow-dream'
                              : 'text-secondary-600 hover:bg-white/50 hover:text-secondary-700'
                          }`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            {(userInfo || loading) && (
              <div className="flex items-center space-x-3">
                {/* User Display */}
                <div className={`flex items-center space-x-2 px-3 py-2 ${
                  theme === 'pixel' 
                    ? `rounded-pixel border-2 ${
                        userInfo?.color === 'blue' 
                          ? 'border-pixel-info bg-pixel-panel' 
                          : userInfo?.color === 'primary'
                          ? 'border-pixel-warning bg-pixel-panel'
                          : 'border-pixel-border bg-pixel-panel'
                      }`
                    : theme === 'fresh'
                    ? `rounded-fresh-lg border shadow-fresh-sm ${
                        userInfo?.color === 'cat'
                          ? 'border-purple-400 bg-purple-50'
                          : userInfo?.color === 'cow'
                          ? 'border-cyan-400 bg-cyan-50'
                          : 'border-fresh-border bg-fresh-card'
                      }`
                    : theme === 'modern'
                    ? `inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm font-medium shadow-sm ${
                        userInfo?.color === 'purple'
                          ? 'border-purple-200 bg-purple-50 text-purple-700'
                          : userInfo?.color === 'blue'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-border bg-background text-foreground'
                      }`
                    : `rounded-xl backdrop-blur-md ${
                        userInfo?.color === 'blue' 
                          ? 'bg-blue-100/50 border border-blue-200/40' 
                          : userInfo?.color === 'primary'
                          ? 'bg-primary-100/50 border border-primary-200/40'
                          : 'bg-sage-100/50 border border-sage-200/40'
                      }`
                }`}>
                  {theme === 'pixel' ? (
                    <PixelIcon 
                      name="user" 
                      className={`${
                        userInfo?.color === 'blue' ? 'text-pixel-info' :
                        userInfo?.color === 'primary' ? 'text-pixel-warning' :
                        'text-pixel-text'
                      }`}
                      size="sm"
                    />
                  ) : theme === 'fresh' ? (
                    <div 
                      className="w-6 h-6 rounded-fresh-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: userInfo?.color === 'cat' ? '#8b5cf620' : userInfo?.color === 'cow' ? '#06b6d420' : '#e2e8f0',
                        color: userInfo?.color === 'cat' ? '#8b5cf6' : userInfo?.color === 'cow' ? '#06b6d4' : '#64748b',
                        border: `1px solid ${userInfo?.color === 'cat' ? '#8b5cf6' : userInfo?.color === 'cow' ? '#06b6d4' : '#e2e8f0'}`
                      }}
                    >
                      {userInfo?.emoji || '👤'}
                    </div>
                  ) : theme === 'modern' ? (
                    <UserIcon className={`w-4 h-4 ${
                      userInfo?.color === 'purple' ? 'text-purple-600' :
                      userInfo?.color === 'blue' ? 'text-blue-600' :
                      'text-muted-foreground'
                    }`} />
                  ) : (
                    <UserIcon className={`w-4 h-4 ${
                      userInfo?.color === 'blue' ? 'text-blue-600' :
                      userInfo?.color === 'primary' ? 'text-primary-600' :
                      'text-gray-600'
                    }`} />
                  )}
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' 
                      ? 'text-pixel-text font-mono'
                      : theme === 'fresh'
                      ? 'text-fresh-text'
                      : theme === 'modern'
                      ? 'text-foreground'
                      : userInfo?.color === 'blue' 
                        ? 'text-blue-700' 
                        : userInfo?.color === 'primary'
                        ? 'text-primary-700'
                        : 'text-sage-700'
                  }`}>
                    {loading ? (theme === 'pixel' ? 'LOADING...' : '加载中...') : userInfo?.name || 'Guest'}
                  </span>
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className={`flex items-center space-x-1 px-3 py-2 transition-all duration-300 ${
                      theme === 'pixel' 
                        ? 'text-pixel-textMuted hover:text-pixel-warning hover:bg-pixel-panel rounded-pixel border border-pixel-border font-mono text-sm'
                        : theme === 'fresh'
                        ? 'text-fresh-textMuted hover:text-fresh-error hover:bg-fresh-primary rounded-fresh-lg border border-fresh-border'
                        : 'text-sage-500 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl backdrop-blur-md'
                    }`}
                    title={theme === 'pixel' ? 'LOGOUT' : '退出登录'}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {theme === 'pixel' ? 'EXIT' : '退出'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 ${
        theme === 'modern' 
          ? 'max-w-7xl py-6 sm:py-8' 
          : 'max-w-8xl px-6 py-8'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 