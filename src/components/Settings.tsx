import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PaintBrushIcon, HeartIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import UserProfile from './UserProfile';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

const Settings: React.FC = () => {
  const { theme, setTheme, useSidebarLayout } = useTheme();

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

      {/* 主题选择 */}
      {renderThemeSelection()}
    </div>
  );
};

export default Settings;