import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useTheme();

  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-1">
      <button
        onClick={() => language !== 'zh' && toggleLanguage()}
        className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
          language === 'zh'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        title={language === 'zh' ? '当前语言：中文' : 'Switch to Chinese'}
      >
        中
      </button>
      <button
        onClick={() => language !== 'en' && toggleLanguage()}
        className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
          language === 'en'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        title={language === 'en' ? 'Current language: English' : '切换到英文'}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
