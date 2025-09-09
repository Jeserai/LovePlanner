import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from '../utils/i18n';
import { ThemeButton } from './ui/Components';
import DarkModeToggle from './ui/DarkModeToggle';
import Icon from './ui/Icon';

interface TopBarProps {
  onLogout?: () => void;
  onNavigateToSettings?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onLogout, onNavigateToSettings }) => {
  const { theme, toggleLayout, language, setLanguage } = useTheme();
  const { userProfile, loading } = useUser();
  const t = useTranslation(language);
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 获取用户显示名称
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
      {/* 左侧：品牌标识 */}
      <div className="flex items-center gap-2">
        <Icon name="heart" size="md" className="text-primary" />
        <span className="text-base font-semibold text-foreground">LovePlanner</span>
      </div>

      {/* 右侧：全局操作 */}
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
          title="切换到顶栏布局"
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
                    onNavigateToSettings?.();
                    setUserMenuOpen(false);
                  }}
                >
                  个人资料
                </button>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onNavigateToSettings?.();
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
  );
};

export default TopBar;
