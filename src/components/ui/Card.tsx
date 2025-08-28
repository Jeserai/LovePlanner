import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'interactive' | 'event';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
  hover = true
}) => {
  const { theme } = useTheme();

  // 基础样式
  const baseStyles = 'transition-all duration-300';

  // 尺寸样式
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  // 主题样式
  const getThemeStyles = () => {
    if (theme === 'pixel') {
      return `bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel ${
        hover && onClick ? 'hover:shadow-pixel-lg hover:border-pixel-accent cursor-pointer' : ''
      }`;
    } else if (theme === 'fresh') {
      return `bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh ${
        hover && onClick ? 'hover:shadow-fresh-lg hover:border-fresh-accent cursor-pointer' : ''
      }`;
    } else {
      return `bg-white border border-gray-200 rounded-xl shadow-soft ${
        hover && onClick ? 'hover:shadow-lg hover:border-primary-300 cursor-pointer' : ''
      }`;
    }
  };

  // 变体样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'interactive':
        return onClick ? 'cursor-pointer' : '';
      case 'event':
        return 'text-white text-xs px-1.5 py-0.5 truncate relative';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${getThemeStyles()}
        ${getVariantStyles()}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

export default Card;
