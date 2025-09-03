import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PixelIcon from '../PixelIcon';

interface NavigationButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  direction,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  className = ''
}) => {
  const { theme } = useTheme();

  // 基础样式
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // 主题样式
  const getThemeStyles = () => {
    if (theme === 'pixel') {
      return 'text-pixel-text hover:text-pixel-accent rounded-pixel border-2 border-pixel-border hover:border-pixel-accent p-2 focus:ring-pixel-accent';
    } else if (false) {
      return ' hover:  border  hover: p-2 focus:ring-fresh-primary';
    } else {
      // Default theme
      return 'text-gray-600 hover:text-gray-800 rounded-xl border border-gray-300 hover:border-gray-400 p-2 focus:ring-primary-500';
    }
  };

  // 禁用状态样式
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer hover:bg-opacity-10 hover:bg-current';

  // 图标渲染
  const renderIcon = () => {
    if (theme === 'pixel') {
      return <PixelIcon name={direction === 'left' ? 'arrow-left' : 'arrow-right'} size="sm" className="text-current" />;
    }
    
    const IconComponent = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || `${direction === 'left' ? '上一页' : '下一页'}`}
      className={`
        ${baseStyles}
        ${getThemeStyles()}
        ${disabledStyles}
        ${className}
      `.trim()}
    >
      {renderIcon()}
    </button>
  );
};

export default NavigationButton;
