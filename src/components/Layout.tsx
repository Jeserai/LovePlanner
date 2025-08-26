import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { HeartIcon, CalendarDaysIcon, ListBulletIcon, ShoppingBagIcon, Cog6ToothIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: string;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const { theme } = useTheme();
  
  const tabs = [
    { id: 'calendar', name: 'CALENDAR', icon: CalendarDaysIcon },
    { id: 'tasks', name: 'TASKS', icon: ListBulletIcon },
    { id: 'shop', name: 'SHOP', icon: ShoppingBagIcon },
    { id: 'settings', name: 'SETTINGS', icon: Cog6ToothIcon },
  ];

  // 根据主题和用户名获取显示信息
  const getUserInfo = (username: string) => {
    if (username.toLowerCase().includes('cat')) {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? 'PLAYER_CAT' : theme === 'romantic' ? '可爱猫咪 🐱' : theme === 'fresh' ? '清新小猫 🐱' : 'Whimsical Cat', 
        color: theme === 'fresh' ? 'cat' : 'primary',
        emoji: '🐱'
      };
    } else if (username.toLowerCase().includes('cow')) {
      return { 
        icon: 'user',
        name: theme === 'pixel' ? 'PLAYER_COW' : theme === 'romantic' ? '温柔奶牛 🐮' : theme === 'fresh' ? '简约小牛 🐮' : 'Whimsical Cow', 
        color: theme === 'fresh' ? 'cow' : 'blue',
        emoji: '🐮'
      };
    } else {
      return { 
        icon: 'user',
        name: username, 
        color: 'gray',
        emoji: '👤'
      };
    }
  };

  const userInfo = currentUser ? getUserInfo(currentUser) : null;

  return (
    <div className={`min-h-screen ${
      theme === 'pixel' ? 'bg-pixel-bg' : 
      theme === 'romantic' ? 'bg-romantic-bg' : 
      theme === 'fresh' ? 'bg-fresh-bg' :
      'bg-pixel-bg'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${
        theme === 'pixel' 
          ? 'bg-pixel-panel border-b-2 border-pixel-border' 
          : theme === 'romantic'
          ? 'bg-romantic-panel border-b-2 border-romantic-border shadow-romantic-sm'
          : theme === 'fresh'
          ? 'bg-fresh-panel border-b border-fresh-border shadow-fresh-sm backdrop-blur-sm'
          : 'bg-pixel-panel border-b-2 border-pixel-border'
      }`}>
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {theme === 'pixel' ? (
                <PixelIcon name="heart" className="text-pixel-accent" size="lg" glow />
              ) : theme === 'romantic' ? (
                <span className="text-3xl animate-romantic-heartbeat">💖</span>
              ) : theme === 'fresh' ? (
                <span className="text-3xl animate-fresh-breathe">💚</span>
              ) : (
                <HeartIcon className="w-8 h-8 text-secondary-500" />
              )}
              <h1 className={`text-2xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text tracking-wider' 
                  : theme === 'romantic'
                  ? 'font-display text-romantic-text romantic-gradient-text'
                  : theme === 'fresh'
                  ? 'font-display text-fresh-text fresh-gradient-text'
                  : 'font-display bg-water-lily bg-clip-text text-transparent'
              }`}>
                {theme === 'pixel' ? 'LOVE_PLANNER.EXE' : theme === 'romantic' ? 'Love Planner' : theme === 'fresh' ? 'Love Planner' : '爱情规划师'}
              </h1>
            </div>
            
            {/* Navigation */}
            <nav className={`flex space-x-1 p-1 ${
              theme === 'pixel' 
                ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel' 
                : theme === 'romantic'
                ? 'bg-romantic-card border-2 border-romantic-border rounded-romantic-lg shadow-romantic'
                : theme === 'fresh'
                ? 'bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh backdrop-blur-sm'
                : 'bg-white/40 backdrop-blur-md rounded-2xl shadow-dream'
            }`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 transition-all duration-300 ${
                      theme === 'pixel' 
                        ? `rounded-pixel font-mono text-sm uppercase ${
                            activeTab === tab.id
                              ? 'bg-pixel-accent text-black font-bold shadow-pixel border border-black'
                              : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                          }`
                        : theme === 'romantic'
                        ? `rounded-romantic font-medium text-sm ${
                            activeTab === tab.id
                              ? 'bg-romantic-accent text-white shadow-romantic-sm scale-105'
                              : 'text-romantic-text hover:bg-romantic-primary hover:text-romantic-accent hover:scale-102'
                          }`
                        : theme === 'fresh'
                        ? `rounded-fresh font-medium text-sm ${
                            activeTab === tab.id
                              ? 'bg-fresh-accent text-white shadow-fresh-sm'
                              : 'text-fresh-text hover:bg-fresh-primary hover:text-fresh-accent'
                          }`
                        : `rounded-xl ${
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
            {userInfo && (
              <div className="flex items-center space-x-3">
                {/* User Display */}
                <div className={`flex items-center space-x-2 px-3 py-2 ${
                  theme === 'pixel' 
                    ? `rounded-pixel border-2 ${
                        userInfo.color === 'blue' 
                          ? 'border-pixel-info bg-pixel-panel' 
                          : userInfo.color === 'primary'
                          ? 'border-pixel-warning bg-pixel-panel'
                          : 'border-pixel-border bg-pixel-panel'
                      }`
                    : theme === 'romantic'
                    ? 'rounded-romantic-lg border-2 border-romantic-border bg-romantic-card shadow-romantic-sm'
                    : theme === 'fresh'
                    ? `rounded-fresh-lg border ${
                        userInfo.color === 'cat'
                          ? 'border-fresh-catColor bg-fresh-catColor/10'
                          : userInfo.color === 'cow'
                          ? 'border-fresh-cowColor bg-fresh-cowColor/10'
                          : 'border-fresh-border bg-fresh-card'
                      } shadow-fresh-sm`
                    : `rounded-xl backdrop-blur-md ${
                        userInfo.color === 'blue' 
                          ? 'bg-blue-100/50 border border-blue-200/40' 
                          : userInfo.color === 'primary'
                          ? 'bg-primary-100/50 border border-primary-200/40'
                          : 'bg-sage-100/50 border border-sage-200/40'
                      }`
                }`}>
                  {theme === 'pixel' ? (
                    <PixelIcon 
                      name="user" 
                      className={`${
                        userInfo.color === 'blue' ? 'text-pixel-info' :
                        userInfo.color === 'primary' ? 'text-pixel-warning' :
                        'text-pixel-text'
                      }`}
                      size="sm"
                    />
                  ) : theme === 'romantic' ? (
                    <span className="text-lg">{userInfo.emoji}</span>
                  ) : theme === 'fresh' ? (
                    <div 
                      className="w-6 h-6 rounded-fresh-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: userInfo.color === 'cat' ? '#06b6d420' : userInfo.color === 'cow' ? '#8b5cf620' : '#e2e8f0',
                        color: userInfo.color === 'cat' ? '#06b6d4' : userInfo.color === 'cow' ? '#8b5cf6' : '#64748b',
                        border: `1px solid ${userInfo.color === 'cat' ? '#06b6d4' : userInfo.color === 'cow' ? '#8b5cf6' : '#e2e8f0'}`
                      }}
                    >
                      {userInfo.emoji}
                    </div>
                  ) : (
                    <UserIcon className={`w-4 h-4 ${
                      userInfo.color === 'blue' ? 'text-blue-600' :
                      userInfo.color === 'primary' ? 'text-primary-600' :
                      'text-gray-600'
                    }`} />
                  )}
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' 
                      ? 'text-pixel-text font-mono'
                      : theme === 'romantic'
                      ? 'text-romantic-text'
                      : theme === 'fresh'
                      ? 'text-fresh-text'
                      : userInfo.color === 'blue' 
                        ? 'text-blue-700' 
                        : userInfo.color === 'primary'
                        ? 'text-primary-700'
                        : 'text-sage-700'
                  }`}>
                    {userInfo.name}
                  </span>
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className={`flex items-center space-x-1 px-3 py-2 transition-all duration-300 ${
                      theme === 'pixel' 
                        ? 'text-pixel-textMuted hover:text-pixel-warning hover:bg-pixel-panel rounded-pixel border border-pixel-border font-mono text-sm'
                        : theme === 'romantic'
                        ? 'text-romantic-textMuted hover:text-romantic-error hover:bg-romantic-primary rounded-romantic-lg border-2 border-romantic-border'
                        : theme === 'fresh'
                        ? 'text-fresh-textMuted hover:text-fresh-error hover:bg-fresh-primary rounded-fresh-lg border border-fresh-border'
                        : 'text-sage-500 hover:text-orange-500 hover:bg-orange-50/50 rounded-xl backdrop-blur-md'
                    }`}
                    title={theme === 'pixel' ? 'LOGOUT' : '退出登录'}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {theme === 'pixel' ? 'EXIT' : theme === 'romantic' ? '退出' : '退出'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 