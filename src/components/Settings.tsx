import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, SparklesIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'monet' as const,
      name: '莫奈梦境',
      description: '清新梦幻的印象派风格',
      icon: SparklesIcon,
      preview: 'bg-gradient-to-br from-primary-100 to-secondary-100',
      color: 'text-primary-600'
    },
    {
      id: 'pixel' as const,
      name: '像素小屋',
      description: '可爱复古的8位游戏风格',
      icon: CommandLineIcon,
      preview: 'bg-gradient-to-br from-pixel-accent to-pixel-purple',
      color: 'text-pixel-accent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className={`w-8 h-8 ${theme === 'pixel' ? 'text-pixel-text' : 'text-secondary-600'}`} />
        <h2 className={`text-3xl font-display font-bold ${theme === 'pixel' ? 'text-pixel-text font-retro' : 'text-gray-700'}`}>
          主题设置
        </h2>
      </div>

      {/* Theme Selection */}
      <div className="card-cutesy p-6">
        <h3 className={`text-xl font-bold mb-4 ${theme === 'pixel' ? 'text-pixel-text font-retro' : 'text-gray-800'}`}>
          {theme === 'pixel' ? '>>> SELECT THEME' : '选择主题风格'}
        </h3>
        <p className={`text-sm mb-6 ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-sage-600'}`}>
          {theme === 'pixel' ? 'CHOOSE YOUR ADVENTURE STYLE!' : '选择你喜欢的视觉风格，设置会自动保存'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.id;
            
            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className={`group relative p-6 border-2 transition-all duration-300 ${
                  theme === 'pixel' 
                    ? `rounded-pixel ${
                        isActive 
                          ? 'border-pixel-accent bg-pixel-panel shadow-pixel-lg' 
                          : 'border-pixel-border bg-pixel-card hover:border-pixel-success hover:shadow-pixel'
                      }`
                    : `rounded-2xl ${
                        isActive 
                          ? 'border-primary-400 bg-primary-50 shadow-monet' 
                          : 'border-gray-200 bg-white hover:border-secondary-300 hover:shadow-soft'
                      }`
                }`}
              >
                {/* Preview Background */}
                <div className={`absolute top-4 right-4 w-12 h-12 ${themeOption.preview} ${
                  theme === 'pixel' ? 'rounded-pixel border border-black' : 'rounded-xl'
                } opacity-70`}></div>

                {/* Theme Info */}
                <div className="text-left">
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className={`w-6 h-6 ${
                      theme === 'pixel' 
                        ? isActive ? 'text-pixel-accent' : 'text-pixel-text'
                        : isActive ? themeOption.color : 'text-gray-600'
                    }`} />
                    <h4 className={`text-lg font-bold ${
                      theme === 'pixel' 
                        ? `font-retro ${isActive ? 'text-pixel-accent' : 'text-pixel-text'}`
                        : isActive ? themeOption.color : 'text-gray-800'
                    }`}>
                      {themeOption.name}
                    </h4>
                  </div>
                  
                  <p className={`text-sm ${
                    theme === 'pixel' 
                      ? 'text-pixel-textMuted font-mono'
                      : isActive ? 'text-gray-700' : 'text-gray-600'
                  }`}>
                    {themeOption.description}
                  </p>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className={`mt-3 flex items-center space-x-2 ${
                      theme === 'pixel' ? 'text-pixel-success' : 'text-primary-600'
                    }`}>
                      <div className={`w-2 h-2 ${
                        theme === 'pixel' ? 'bg-pixel-success rounded-pixel' : 'bg-primary-500 rounded-full'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        theme === 'pixel' ? 'font-mono uppercase' : ''
                      }`}>
                        {theme === 'pixel' ? 'ACTIVE' : '当前使用'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  theme === 'pixel' ? 'rounded-pixel' : 'rounded-2xl'
                }`}></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Description */}
      <div className="card-cutesy p-6">
        <h3 className={`text-lg font-bold mb-3 ${theme === 'pixel' ? 'text-pixel-text font-retro' : 'text-gray-800'}`}>
          {theme === 'pixel' ? '>>> CURRENT THEME INFO' : '当前主题详情'}
        </h3>
        
        {theme === 'monet' ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-primary-500" />
              <span className="text-gray-700 font-medium">莫奈梦境主题</span>
            </div>
            <p className="text-sage-600 text-sm leading-relaxed">
              灵感来源于印象派大师莫奈的画作，采用柔和的水彩色调和梦幻的渐变效果。
              整体风格清新淡雅，营造出如诗如画的浪漫氛围，让你的爱情规划充满艺术气息。
            </p>
            <div className="flex space-x-2 mt-4">
              <div className="w-4 h-4 bg-primary-400 rounded-full"></div>
              <div className="w-4 h-4 bg-secondary-400 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <div className="w-4 h-4 bg-lavender-400 rounded-full"></div>
              <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CommandLineIcon className="w-5 h-5 text-pixel-accent" />
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
        )}
      </div>

      {/* Quick Theme Toggle */}
      <div className="card-cutesy p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-bold ${theme === 'pixel' ? 'text-pixel-text font-retro' : 'text-gray-800'}`}>
              {theme === 'pixel' ? 'QUICK SWITCH' : '快速切换'}
            </h4>
            <p className={`text-sm ${theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-sage-600'}`}>
              {theme === 'pixel' ? 'TOGGLE BETWEEN THEMES' : '在两种主题间快速切换'}
            </p>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'monet' ? 'pixel' : 'monet')}
            className={`px-4 py-2 font-bold transition-all duration-300 ${
              theme === 'pixel' 
                ? 'bg-pixel-warning text-black rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:translate-y-[-2px] border-2 border-black font-mono uppercase'
                : 'bg-secondary-400 text-white rounded-xl shadow-dream hover:shadow-monet hover:scale-105'
            }`}
          >
            {theme === 'pixel' ? 'SWITCH!' : '切换主题'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 