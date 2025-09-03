import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getUserDisplayInfo } from '../services/authService';
import Icon from './ui/Icon';
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
      iconName: 'calendar' as const
    },
    { 
      id: 'fullcalendar', 
      name: theme === 'pixel' ? 'FULLCAL' : theme === 'modern' ? 'FullCalendar' : 'FULLCAL', 
      iconName: 'calendar' as const
    },
    { 
      id: 'tasks', 
      name: theme === 'pixel' ? 'TASKS' : theme === 'modern' ? 'Tasks' : 'TASKS', 
      iconName: 'list' as const
    },
    { 
      id: 'shop', 
      name: theme === 'pixel' ? 'SHOP' : theme === 'modern' ? 'Shop' : 'SHOP', 
      iconName: 'shopping-bag' as const
    },
    { 
      id: 'settings', 
      name: theme === 'pixel' ? 'SETTINGS' : theme === 'modern' ? 'Settings' : 'SETTINGS', 
      iconName: 'settings' as const
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
        color: false ? 'cat' : theme === 'modern' ? 'purple' : 'primary',
        emoji: theme === 'modern' ? '' : '🐱'
      };
    } else if (uiTheme === 'cow') {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? displayName.toUpperCase() : displayName, 
        color: false ? 'cow' : theme === 'modern' ? 'blue' : 'blue',
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
      false ? '' :
      theme === 'modern' ? 'bg-background' :
      ''
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${
        theme === 'pixel' 
          ? 'bg-pixel-panel border-b-2 border-pixel-border' 
          : false
          ? ' border-b   backdrop-blur-sm'
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
              ) : false ? (
                <span className="text-3xl animate-fresh-breathe">💚</span>
              ) : theme === 'modern' ? (
                <div className="flex items-center space-x-2">
                  <Icon name="heart" size="lg" className="text-primary" />
                  <span className="font-semibold text-lg text-foreground">Love Planner</span>
                </div>
              ) : (
                <Icon name="heart" size="xl" className="text-secondary-500" />
              )}
              {theme !== 'modern' && (
                <h1 className={`text-2xl font-bold ${
                  theme === 'pixel' 
                    ? 'font-retro text-pixel-text tracking-wider' 
                    : false
                    ? 'font-display  '
                    : 'font-display bg-water-lily bg-clip-text text-transparent'
                }`}>
                  {theme === 'pixel' ? 'LOVE_PLANNER.EXE' : false ? 'Love Planner' : '爱情规划师'}
                </h1>
              )}
            </div>
            
            {/* Navigation */}
            <nav className={`flex items-center ${
              theme === 'pixel' 
                ? 'space-x-2' 
                : false
                ? 'space-x-2'
                : theme === 'modern'
                ? 'space-x-1'
                : 'space-x-2'
            }`}>
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 transition-all duration-200 ${
                      theme === 'pixel' 
                        ? `rounded-pixel font-mono text-sm uppercase px-3 py-2 ${
                            activeTab === tab.id
                              ? 'bg-pixel-accent text-black font-bold shadow-pixel border-2 border-black'
                              : 'text-pixel-text hover:text-pixel-accent hover:bg-pixel-panel/50 border-2 border-transparent'
                          }`
                        : false
                        ? `rounded-lg font-medium text-sm px-3 py-2 ${
                            activeTab === tab.id
                              ? ' text-white'
                              : ' hover: hover:/10'
                          }`
                        : theme === 'modern'
                        ? `inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
                            activeTab === tab.id
                              ? 'text-foreground bg-accent/20 font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                          }`
                        : `rounded-lg px-3 py-2 ${
                            activeTab === tab.id
                              ? 'bg-primary-500 text-white'
                              : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
                          }`
                    }`}
                  >
                    <Icon name={tab.iconName} className="text-current" />
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
                    : false
                    ? ` border  ${
                        userInfo?.color === 'cat'
                          ? 'border-purple-400 bg-purple-50'
                          : userInfo?.color === 'cow'
                          ? 'border-cyan-400 bg-cyan-50'
                          : ' '
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
                  ) : false ? (
                    <div 
                      className="w-6 h-6  flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: userInfo?.color === 'cat' ? '#8b5cf620' : userInfo?.color === 'cow' ? '#06b6d420' : '#e2e8f0',
                        color: userInfo?.color === 'cat' ? '#8b5cf6' : userInfo?.color === 'cow' ? '#06b6d4' : '#64748b',
                        border: `1px solid ${userInfo?.color === 'cat' ? '#8b5cf6' : userInfo?.color === 'cow' ? '#06b6d4' : '#e2e8f0'}`
                      }}
                    >
                      {userInfo?.emoji || '👤'}
                    </div>
                  ) : theme === 'modern' ? (
                    <Icon name="user" size="sm" className={
                      userInfo?.color === 'purple' ? 'text-purple-600' :
                      userInfo?.color === 'blue' ? 'text-blue-600' :
                      'text-muted-foreground'
                    } />
                  ) : (
                    <Icon name="user" size="sm" className={
                      userInfo?.color === 'blue' ? 'text-blue-600' :
                      userInfo?.color === 'primary' ? 'text-primary-600' :
                      'text-gray-600'
                    } />
                  )}
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' 
                      ? 'text-pixel-text font-mono'
                      : false
                      ? ''
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
                    className={`flex items-center space-x-1 px-3 py-2 transition-all duration-200 ${
                      theme === 'pixel' 
                        ? 'text-pixel-textMuted hover:text-pixel-warning hover:bg-pixel-panel rounded-pixel border border-pixel-border font-mono text-sm'
                        : false
                        ? ' hover: hover:  border '
                        : theme === 'modern'
                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md border border-border hover:border-destructive/20'
                        : 'text-sage-500 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl backdrop-blur-md'
                    }`}
                    title={theme === 'pixel' ? 'LOGOUT' : '退出登录'}
                  >
                    <Icon name="logout" />
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