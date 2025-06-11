import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { HeartIcon, CalendarIcon, ClipboardDocumentListIcon, ShoppingBagIcon, Cog6ToothIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

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
    { id: 'calendar', name: theme === 'pixel' ? 'CALENDAR' : '日历', icon: CalendarIcon },
    { id: 'tasks', name: theme === 'pixel' ? 'TASKS' : '任务看板', icon: ClipboardDocumentListIcon },
    { id: 'shop', name: theme === 'pixel' ? 'SHOP' : '个人商店', icon: ShoppingBagIcon },
    { id: 'settings', name: theme === 'pixel' ? 'SETTINGS' : '设置', icon: Cog6ToothIcon },
  ];

  // 获取用户显示信息
  const getUserDisplayInfo = (username: string) => {
    if (username.toLowerCase().includes('cat')) {
      return { emoji: '🐱', name: theme === 'pixel' ? 'PLAYER_CAT' : 'Whimsical Cat', color: 'blue' };
    } else if (username.toLowerCase().includes('cow')) {
      return { emoji: '🐄', name: theme === 'pixel' ? 'PLAYER_COW' : 'Whimsical Cow', color: 'primary' };
    }
    return { emoji: '👤', name: username, color: 'gray' };
  };

  const userInfo = currentUser ? getUserDisplayInfo(currentUser) : null;

  return (
    <div className={`min-h-screen ${theme === 'pixel' ? 'bg-pixel-bg' : 'bg-monet-gradient'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${
        theme === 'pixel' 
          ? 'bg-pixel-panel border-b-2 border-pixel-border' 
          : 'bg-white/50 backdrop-blur-md border-b border-secondary-200/30'
      }`}>
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HeartIcon className={`w-8 h-8 ${theme === 'pixel' ? 'text-pixel-accent' : 'text-secondary-500'}`} />
              <h1 className={`text-2xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text tracking-wider' 
                  : 'font-display bg-water-lily bg-clip-text text-transparent'
              }`}>
                {theme === 'pixel' ? 'LOVE_PLANNER.EXE' : '爱情规划师'}
              </h1>
            </div>
            
            {/* Navigation */}
            <nav className={`flex space-x-1 p-1 ${
              theme === 'pixel' 
                ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel' 
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
                          ? 'border-pixel-purple bg-pixel-panel'
                          : 'border-pixel-border bg-pixel-panel'
                      }`
                    : `rounded-xl backdrop-blur-md ${
                        userInfo.color === 'blue' 
                          ? 'bg-blue-100/50 border border-blue-200/40' 
                          : userInfo.color === 'primary'
                          ? 'bg-primary-100/50 border border-primary-200/40'
                          : 'bg-sage-100/50 border border-sage-200/40'
                      }`
                }`}>
                  <span className="text-lg">{userInfo.emoji}</span>
                  <span className={`text-sm font-medium ${
                    theme === 'pixel' 
                      ? 'text-pixel-text font-mono'
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
      <main className="max-w-8xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 