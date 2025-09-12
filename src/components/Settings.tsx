import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PaintBrushIcon, HeartIcon, KeyIcon, TrashIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import UserProfile from './UserProfile';
import ChangePasswordForm from './ChangePasswordForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { ThemeButton, ThemeDialog } from './ui/Components';
import { useTranslation } from '../utils/i18n';
import { lastEmailService } from '../services/lastEmailService';

const Settings: React.FC = () => {
  const { theme, setTheme, useSidebarLayout, language } = useTheme();
  const t = useTranslation(language);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [hasLastEmail, setHasLastEmail] = useState(false);

  // 检查是否有保存的邮箱
  useEffect(() => {
    const lastEmail = lastEmailService.getLastEmail();
    setHasLastEmail(!!lastEmail);
  }, []);

  // 清除保存的邮箱
  const handleClearLastEmail = () => {
    if (confirm('确定要清除保存的邮箱地址吗？')) {
      lastEmailService.clearLastEmail();
      setHasLastEmail(false);
      alert('已清除保存的邮箱地址');
    }
  };

  const modernThemes = [
    {
      id: 'modern' as const,
      name: '现代主题',
      icon: PaintBrushIcon
    }
  ];

  const pixelThemes = [
    {
      id: 'pixel' as const,
      name: 'PIXEL THEME',
      description: '像素风格界面，充满复古游戏感觉',
      icon: HeartIcon,
      preview: 'bg-gradient-to-br from-purple-500 to-pink-600',
      color: 'text-pixel-accent'
    }
  ];

  const renderThemeSelection = () => {
    if (theme === 'pixel') {
      return (
        <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 neon-border pixel-matrix">
          <h3 className="text-xl font-bold mb-4 text-pixel-text font-retro uppercase tracking-wider">
            {'>>> SELECT THEME'}
          </h3>
          <p className="text-sm mb-6 text-pixel-textMuted font-mono">
            CHOOSE YOUR ADVENTURE STYLE!
          </p>

          {/* 主题网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pixelThemes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.id;
              
              return (
                <div
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`p-6 cursor-pointer transition-all duration-300 border-4 rounded-pixel ${
                    isActive ? 'border-pixel-accent bg-pixel-card shadow-pixel-lg scale-105' : 'border-pixel-border bg-pixel-panel hover:border-pixel-accent hover:scale-102'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <PixelIcon name="command" className={isActive ? 'text-pixel-accent' : 'text-pixel-text'} glow={isActive} />
                    <h4 className={`font-bold font-retro uppercase ${isActive ? 'text-pixel-accent' : 'text-pixel-text'}`}>
                      {themeOption.name}
                    </h4>
                  </div>
                  <p className="text-sm mb-4 text-pixel-textMuted font-mono">
                    {themeOption.description}
                  </p>
                  <div className={`h-20 rounded-lg ${themeOption.preview} border-2 border-white`}></div>
                  
                  {/* 当前使用标识 */}
                  {isActive && (
                    <div className="mt-3 text-center text-sm font-medium text-pixel-accent">
                      当前使用
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 现代主题使用shadcn/ui Card组件
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">主题设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {modernThemes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.id;
              
              return (
                <Card
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <span className={`font-medium ${
                        isActive ? 'text-primary' : 'text-foreground'
                      }`}>
                        {themeOption.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (theme === 'pixel') {
    return (
      <div className="space-y-8">
        {/* 用户档案 */}
        <UserProfile />

        {/* 主题选择 */}
        {renderThemeSelection()}
      </div>
    );
  }


  // 默认主题
  return (
    <div className="space-y-6">
      {/* 用户档案 */}
      <UserProfile />

      {/* 密码和安全 */}
      {(theme as any) === 'pixel' ? (
        <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 neon-border pixel-matrix">
          <h3 className="text-xl font-bold mb-4 text-pixel-text font-retro uppercase tracking-wider">
            {'>>> SECURITY SETTINGS'}
          </h3>
          <p className="text-sm mb-6 text-pixel-textMuted font-mono">
            PROTECT YOUR ACCOUNT!
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full p-4 bg-pixel-accent text-pixel-bg font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-pixel-accentLight transition-colors duration-200 shadow-pixel flex items-center justify-center space-x-2"
            >
              <PixelIcon name="key" className="w-5 h-5" />
              <span>CHANGE PASSWORD</span>
            </button>
            {hasLastEmail && (
              <button
                onClick={handleClearLastEmail}
                className="w-full p-4 bg-red-600 text-white font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-red-700 transition-colors duration-200 shadow-pixel flex items-center justify-center space-x-2"
              >
                <PixelIcon name="trash" className="w-5 h-5" />
                <span>CLEAR SAVED EMAIL</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <KeyIcon className="w-5 h-5" />
              <span>{t('security_settings')}</span>
            </CardTitle>
            <CardDescription>
              {t('security_settings_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ThemeButton
                onClick={() => setShowChangePassword(true)}
                variant="secondary"
                className="w-full"
              >
                <div className="flex items-center justify-center space-x-2">
                  <KeyIcon className="w-4 h-4" />
                  <span>{t('change_password')}</span>
                </div>
              </ThemeButton>
              {hasLastEmail && (
                <ThemeButton
                  onClick={handleClearLastEmail}
                  variant="danger"
                  className="w-full"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <TrashIcon className="w-4 h-4" />
                    <span>清除保存的邮箱</span>
                  </div>
                </ThemeButton>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主题选择 */}
      {renderThemeSelection()}

      {/* 修改密码弹窗 */}
      {showChangePassword && (
        <ThemeDialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <ChangePasswordForm
            onSuccess={() => {
              setShowChangePassword(false);
            }}
            onCancel={() => {
              setShowChangePassword(false);
            }}
          />
        </ThemeDialog>
      )}
    </div>
  );
};

export default Settings;