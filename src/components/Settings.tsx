import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
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
          {theme === 'pixel' ? 'SETTINGS' : '设置'}
        </h2>
      </div>

      {/* Theme Selection */}
      <div className="card-cutesy p-6">
        <h3 className={`text-xl font-bold mb-4 ${theme === 'pixel' ? 'text-pixel-text font-retro' : 'text-gray-800'}`}>
          {theme === 'pixel' ? '>{'>'} SELECT THEME' : '选择主题风格'}
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
                  ? 'bg-pixel-card border-4 border-pixel-accent shadow-pixel-lg'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <themeOption.icon className={`w-6 h-6 ${themeOption.color}`} />
                <h3 className="font-bold font-retro text-pixel-text">
                  {themeOption.name}
                </h3>
              </div>
              <p className="text-sm text-pixel-textMuted font-mono">
                {themeOption.description}
              </p>
              <div className={`mt-3 h-24 rounded-lg ${themeOption.preview}`}></div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Preview */}
      <div className="p-6 rounded-xl bg-pixel-panel border-4 border-pixel-border shadow-pixel-lg">
        <h3 className="text-xl font-bold mb-4 font-retro text-pixel-text uppercase tracking-wider">
          THEME_PREVIEW
        </h3>
        
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
      </div>

      {/* Theme Description */}
      <div className="card-cutesy p-6">
        <h3 className="text-lg font-bold mb-3 text-pixel-text font-retro">
          {'>>> CURRENT THEME INFO'}
        </h3>
        
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
      </div>

      {/* Quick Theme Toggle */}
      <div className="card-cutesy p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-pixel-text font-retro">
              QUICK SWITCH
            </h4>
            <p className="text-sm text-pixel-textMuted font-mono">
              TOGGLE BETWEEN THEMES
            </p>
          </div>
          
          <button
            onClick={() => setTheme('pixel')}
            className="px-4 py-2 font-bold transition-all duration-300 bg-pixel-warning text-black rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:translate-y-[-2px] border-2 border-black font-mono uppercase"
          >
            SWITCH!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 