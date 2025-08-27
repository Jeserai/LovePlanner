import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import PixelIcon from '../PixelIcon';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'navigation';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; // PixelIcon name for pixel theme
  iconComponent?: React.ReactNode; // HeroIcon component for other themes
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconComponent,
  disabled = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel
}) => {
  const { theme } = useTheme();

  // 基础样式
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm space-x-1',
    md: 'px-4 py-2 text-base space-x-2',
    lg: 'px-6 py-3 text-lg space-x-2'
  };

  // 主题样式
  const getThemeStyles = () => {
    if (theme === 'pixel') {
      switch (variant) {
        case 'primary':
          return 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider';
        case 'secondary':
          return 'bg-pixel-card text-pixel-text border-2 border-pixel-border rounded-pixel hover:border-pixel-textMuted font-mono uppercase';
        case 'danger':
          return 'bg-pixel-accent text-black border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:bg-pixel-purple font-mono uppercase';
        case 'navigation':
          return 'text-pixel-text hover:text-pixel-accent transition-colors rounded-pixel border-2 border-pixel-border hover:border-pixel-accent';
        default:
          return 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider';
      }
    } else if (theme === 'fresh') {
      switch (variant) {
        case 'primary':
          return 'bg-gradient-to-r from-fresh-primary to-fresh-accent text-white rounded-fresh-lg shadow-fresh hover:shadow-fresh-lg hover:from-fresh-accent hover:to-fresh-primary focus:ring-fresh-primary';
        case 'secondary':
          return 'bg-fresh-card text-fresh-text border border-fresh-border rounded-fresh-lg hover:bg-fresh-primary hover:text-white focus:ring-fresh-primary';
        case 'danger':
          return 'bg-red-500 text-white rounded-fresh-lg shadow-fresh hover:bg-red-600 focus:ring-red-500';
        case 'navigation':
          return 'text-fresh-text hover:text-fresh-primary transition-colors rounded-fresh-lg border border-fresh-border hover:border-fresh-primary';
        default:
          return 'bg-gradient-to-r from-fresh-primary to-fresh-accent text-white rounded-fresh-lg shadow-fresh hover:shadow-fresh-lg hover:from-fresh-accent hover:to-fresh-primary focus:ring-fresh-primary';
      }
    } else {
      // Default theme
      switch (variant) {
        case 'primary':
          return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500';
        case 'secondary':
          return 'bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:ring-primary-500';
        case 'danger':
          return 'bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 focus:ring-red-500';
        case 'navigation':
          return 'text-gray-600 hover:text-gray-800 transition-colors rounded-xl border border-gray-300 hover:border-gray-400';
        default:
          return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500';
      }
    }
  };

  // 禁用状态样式
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer';

  // 图标渲染
  const renderIcon = () => {
    if (theme === 'pixel' && icon) {
      return <PixelIcon name={icon} size={size} className="text-current" glow={variant === 'primary'} />;
    }
    if (iconComponent) {
      return iconComponent;
    }
    return null;
  };

  // 文字样式
  const getTextStyles = () => {
    if (theme === 'pixel') {
      return 'font-mono uppercase';
    }
    return '';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${getThemeStyles()}
        ${disabledStyles}
        ${className}
      `.trim()}
    >
      {renderIcon()}
      <span className={getTextStyles()}>
        {children}
      </span>
    </button>
  );
};

export default Button;
