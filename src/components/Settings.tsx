import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, CommandLineIcon, UserIcon, PaintBrushIcon, HeartIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import UserProfile from './UserProfile';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    {
      id: 'profile',
      name: theme === 'pixel' ? 'USER_PROFILE' : theme === 'modern' ? 'User Profile' : '用户档案',
      icon: UserIcon,
      pixelIcon: 'user'
    },
    {
      id: 'theme',
      name: theme === 'pixel' ? 'THEME_SETTINGS' : theme === 'modern' ? 'Theme Settings' : '主题设置',
      icon: PaintBrushIcon,
      pixelIcon: 'palette'
    }
  ];

  const themes = [
    {
      id: 'modern' as const,
      name: 'Modern Theme',
      description: '基于shadcn/ui的现代设计系统，简洁优雅的界面风格',
      icon: PaintBrushIcon,
      preview: 'bg-gradient-to-br from-gray-500 to-slate-600',
      color: 'text-gray-600'
    }
    // 隐藏像素主题选项
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return <UserProfile />;
      case 'theme':
        return (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div className={theme === 'pixel' ? 'bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 neon-border pixel-matrix' : 'card-cutesy p-6'}>
              <h3 className={`text-xl font-bold mb-4 ${theme === 'pixel' ? 'text-pixel-text font-retro uppercase tracking-wider' : false ? ' ' : 'text-gray-800'}`}>
                {theme === 'pixel' ? '>>> SELECT THEME' : '选择主题风格'}
              </h3>
              <p className={`text-sm mb-6 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : false ? '' : 'text-sage-600'}`}>
                {theme === 'pixel' ? 'CHOOSE YOUR ADVENTURE STYLE!' : '选择你喜欢的视觉风格，设置会自动保存'}
              </p>

              {/* 主题网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isActive = theme === themeOption.id;
                  
                  return (
                    <div
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id)}
                      className={`p-6 cursor-pointer transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `border-4 rounded-pixel ${isActive ? 'border-pixel-accent bg-pixel-card shadow-pixel-lg scale-105' : 'border-pixel-border bg-pixel-panel hover:border-pixel-accent hover:scale-102'}`
                          : false
                          ? `border  ${isActive ? '  ' : '  hover: hover:'}`
                          : `border-2 rounded-xl ${isActive ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {theme === 'pixel' ? (
                          <PixelIcon name="command" className={isActive ? 'text-pixel-accent' : 'text-pixel-text'} glow={isActive} />
                        ) : (
                          <Icon className={`w-6 h-6 ${isActive ? themeOption.color : false ? '' : 'text-gray-500'}`} />
                        )}
                        <h4 className={`font-bold ${
                          theme === 'pixel' 
                            ? `font-retro uppercase ${isActive ? 'text-pixel-accent' : 'text-pixel-text'}`
                            : false
                            ? `${isActive ? '' : ''}`
                            : `${isActive ? 'text-primary-700' : 'text-gray-700'}`
                        }`}>
                          {themeOption.name}
                        </h4>
                      </div>
                      <p className={`text-sm mb-4 ${
                        theme === 'pixel' 
                          ? 'text-pixel-textMuted font-mono'
                          : false
                          ? ''
                          : 'text-gray-600'
                      }`}>
                        {themeOption.description}
                      </p>
                      <div className={`h-20 rounded-lg ${themeOption.preview} border-2 ${
                        theme === 'pixel' ? 'border-white' : false ? '' : 'border-gray-200'
                      }`}></div>
                      
                      {/* 当前使用标识 */}
                      {isActive && (
                        <div className="mt-3 text-center text-sm font-medium text-primary-600">
                          当前使用
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Theme Preview */}
            {theme === 'pixel' && (
              <div className="bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg p-6 neon-border">
                <h3 className="text-xl font-bold mb-4 font-retro text-pixel-text uppercase tracking-wider">
                  THEME_PREVIEW
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <PixelIcon name="command" className="text-pixel-accent" glow />
                    <span className="text-pixel-text font-retro font-bold">PIXEL HOUSE THEME</span>
                  </div>
                  <p className="text-pixel-textMuted text-sm font-mono leading-relaxed">
                    INSPIRED BY CLASSIC 8-BIT VIDEO GAMES AND RETRO COMPUTING.<br/>
                    FEATURES BOLD COLORS, PIXELATED GRAPHICS, AND NOSTALGIC VIBES.<br/>
                    PERFECT FOR GAMERS AND RETRO ENTHUSIASTS WHO LOVE THAT OLD-SCHOOL AESTHETIC!
                  </p>
                  <div className="flex space-x-2 mt-4">
                    <div className="w-4 h-4 bg-pixel-accent rounded-pixel border border-black"></div>
                    <div className="w-4 h-4 bg-pixel-success rounded-pixel border border-black"></div>
                    <div className="w-4 h-4 bg-pixel-warning rounded-pixel border border-black"></div>
                    <div className="w-4 h-4 bg-pixel-purple rounded-pixel border border-black"></div>
                    <div className="w-4 h-4 bg-pixel-pink rounded-pixel border border-black"></div>
                  </div>
                </div>
              </div>
            )}



            {false && (
              <div className="border p-6">
                <h3 className="text-xl font-bold mb-4  ">
                  主题预览
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <PaintBrushIcon className="w-6 h-6 " />
                    <span className=" font-medium">清新淡雅主题</span>
                  </div>
                  <p className=" text-sm leading-relaxed">
                    追求简约现代的设计理念，采用清新淡雅的绿色系配色。<br/>
                    特色包括轻盈的阴影、简洁的线条和流畅的动画效果。<br/>
                    完美适合喜欢极简风格和自然色调的用户！
                  </p>
                  <div className="flex space-x-3 mt-4">
                    <div className="w-6 h-6   border  "></div>
                    <div className="w-6 h-6   border  "></div>
                    <div className="w-6 h-6   border  "></div>
                    <div className="w-6 h-6   border  "></div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="flex justify-center space-x-2 opacity-50">
                      <div className="w-2 h-2  rounded-full "></div>
                      <div className="w-2 h-2  rounded-full "></div>
                      <div className="w-2 h-2  rounded-full "></div>
                      <div className="w-2 h-2  rounded-full " style={{animationDelay: '1s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        );
      default:
        return <UserProfile />;
    }
  };

  if (theme === 'pixel') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <PixelIcon name="settings" className="text-pixel-text" size="lg" glow />
          <h2 className="text-3xl font-retro font-bold text-pixel-text uppercase tracking-wider">
            SETTINGS.EXE
          </h2>
        </div>

        {/* Section Navigation */}
        <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-4 neon-border">
          <div className="flex space-x-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 p-3 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 ${
                  activeSection === section.id
                    ? 'bg-pixel-accent text-white border-white neon-border shadow-pixel-neon'
                    : 'bg-pixel-card text-pixel-cyan border-pixel-border hover:border-pixel-cyan hover:text-pixel-accent'
                }`}
              >
                <PixelIcon name={section.pixelIcon} className="text-current" glow />
                <span>{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderSectionContent()}
      </div>
    );
  }



  if (false) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="w-8 h-8 " />
          <h2 className="text-3xl font-display font-bold  ">
            设置中心
          </h2>
        </div>

        {/* Section Navigation */}
        <div className="border p-4">
          <div className="grid grid-cols-2 gap-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-3 rounded font-medium transition-all duration-300 flex items-center space-x-3 ${
                    activeSection === section.id
                      ? ' text-white '
                      : '  hover: hover:'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {renderSectionContent()}
      </div>
    );
  }

  // 默认主题
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className="w-8 h-8 text-secondary-600" />
        <h2 className="text-3xl font-display font-bold text-gray-700">
          设置
        </h2>
      </div>

      {/* Section Navigation */}
      <div className="card-cutesy p-4">
        <div className="flex space-x-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 p-3 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeSection === section.id
                  ? 'bg-water-lily text-white shadow-dream'
                  : 'bg-white/40 text-sage-600 hover:bg-white/60 hover:text-sage-700'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span>{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderSectionContent()}
    </div>
  );
};

export default Settings;