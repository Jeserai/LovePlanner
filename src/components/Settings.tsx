import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, CommandLineIcon, UserIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import UserProfile from './UserProfile';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    {
      id: 'profile',
      name: (theme === 'pixel' || theme === 'lightPixel') ? 'USER_PROFILE' : '用户档案',
      icon: UserIcon,
      pixelIcon: 'user'
    },
    {
      id: 'theme',
      name: (theme === 'pixel' || theme === 'lightPixel') ? 'THEME_SETTINGS' : '主题设置',
      icon: PaintBrushIcon,
      pixelIcon: 'palette'
    }
  ];

  const themes = [
    {
      id: 'pixel' as const,
      name: '深色像素风',
      description: '赛博朋克霓虹风格，神秘的深色8位游戏体验',
      icon: CommandLineIcon,
      preview: 'bg-gradient-to-br from-pixel-accent to-pixel-purple',
      color: 'text-pixel-accent'
    },
    {
      id: 'lightPixel' as const,
      name: '浅色像素风',
      description: '明亮清新的8位游戏风格，阳光般的复古体验',
      icon: CommandLineIcon,
      preview: 'bg-gradient-to-br from-lightPixel-accent to-lightPixel-info',
      color: 'text-lightPixel-accent'
    }
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
              <h3 className={`text-xl font-bold mb-4 ${theme === 'pixel' ? 'text-pixel-text font-retro uppercase tracking-wider' : 'text-gray-800'}`}>
                {theme === 'pixel' ? '>>> SELECT THEME' : '选择主题风格'}
              </h3>
              <p className={`text-sm mb-6 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-sage-600'}`}>
                {theme === 'pixel' ? 'CHOOSE YOUR ADVENTURE STYLE!' : '选择你喜欢的视觉风格，设置会自动保存'}
              </p>

              <div className="grid grid-cols-1 gap-4">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      theme === themeOption.id
                        ? theme === 'pixel' 
                          ? 'bg-pixel-card border-4 border-pixel-accent shadow-pixel-lg neon-border'
                          : 'bg-primary-100/50 border-2 border-primary-300 shadow-dream'
                        : 'bg-white/40 hover:bg-white/60 border-2 border-sage-200/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {theme === 'pixel' ? (
                        <PixelIcon name="command" className="text-pixel-accent" glow />
                      ) : (
                        <themeOption.icon className={`w-6 h-6 ${themeOption.color}`} />
                      )}
                      <h3 className={theme === 'pixel' ? 'font-bold font-retro text-pixel-text uppercase' : 'font-bold text-gray-800'}>
                        {themeOption.name}
                      </h3>
                    </div>
                    <p className={`text-sm ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-sage-600'}`}>
                      {themeOption.description}
                    </p>
                    <div className={`mt-3 h-24 rounded-lg ${themeOption.preview} ${theme === 'pixel' ? 'border-2 border-white' : ''}`}></div>
                  </button>
                ))}
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

            {/* Quick Theme Toggle */}
            <div className={theme === 'pixel' ? 'bg-pixel-card border-4 border-pixel-border rounded-pixel p-4 neon-border' : 'card-cutesy p-4'}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-bold ${theme === 'pixel' ? 'text-pixel-text font-retro uppercase' : 'text-gray-800'}`}>
                    {theme === 'pixel' ? 'QUICK SWITCH' : '快速切换'}
                  </h4>
                  <p className={`text-sm ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-sage-600'}`}>
                    {theme === 'pixel' ? 'TOGGLE BETWEEN THEMES' : '在主题之间快速切换'}
                  </p>
                </div>
                
                <button
                  onClick={() => setTheme('pixel')}
                  className={theme === 'pixel' 
                    ? 'px-4 py-2 font-bold transition-all duration-300 bg-pixel-warning text-black rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:translate-y-[-2px] border-2 border-black font-mono uppercase'
                    : 'px-4 py-2 font-medium transition-all duration-300 bg-water-lily text-white rounded-xl hover:scale-[1.02] shadow-dream'
                  }
                >
                  {theme === 'pixel' ? 'SWITCH!' : '切换'}
                </button>
              </div>
            </div>
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

  // Cute 主题
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