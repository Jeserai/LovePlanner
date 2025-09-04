import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();

  // 像素风主题不显示深色模式切换
  if (theme === 'pixel') {
    return null;
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        inline-flex items-center justify-center rounded-md p-2 
        transition-all duration-200 focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-ring 
        disabled:pointer-events-none disabled:opacity-50
        ${isDarkMode 
          ? 'text-foreground hover:bg-accent hover:text-accent-foreground' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }
        ${className}
      `}
      title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      <Icon 
        name={isDarkMode ? 'sun' : 'moon'} 
        size="sm" 
        className="transition-all duration-200" 
      />
      <span className="sr-only">
        {isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
