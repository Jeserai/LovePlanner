import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

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

  // 使用与日历导航按钮一致的样式
  const getButtonStyles = () => {
    if (theme === 'pixel') {
      return `
        inline-flex items-center justify-center
        h-8 w-8 p-0
        text-pixel-text hover:text-pixel-accent
        bg-pixel-bg hover:bg-pixel-bgSecondary
        border-2 border-pixel-border hover:border-pixel-accent
        rounded-pixel
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-pixel-accent
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `.trim();
    } else {
      return `
        inline-flex items-center justify-center
        h-8 w-8 p-0
        text-secondary-foreground
        bg-secondary hover:bg-secondary/80
        border border-input
        rounded-md
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${disabled ? '' : 'hover:bg-secondary/80'}
      `.trim();
    }
  };

  // 图标渲染 - 与日历导航按钮一致
  const renderIcon = () => {
    if (theme === 'pixel') {
      return direction === 'left' ? '<' : '>';
    }
    
    return direction === 'left' ? '←' : '→';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || `${direction === 'left' ? '上一页' : '下一页'}`}
      className={`${getButtonStyles()} ${className}`}
    >
      {renderIcon()}
    </button>
  );
};

export default NavigationButton;
