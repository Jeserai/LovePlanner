import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  title, 
  subtitle,
  className = ''
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const paddingClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-16'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={`text-center ${paddingClasses[size]} ${className}`}>
      <div className="space-y-4">
        {/* 加载动画 */}
        <div className={`mx-auto ${sizeClasses[size]} ${
          theme === 'pixel' 
            ? 'border-4 border-pixel-border border-t-pixel-accent animate-spin' 
            : theme === 'fresh'
            ? 'border-4 border-fresh-border border-t-fresh-primary animate-spin'
            : 'border-4 border-gray-200 border-t-primary-600 animate-spin'
        } rounded-full`}></div>
        
        {/* 主要文字 */}
        {title && (
          <div className={`${textSizeClasses[size]} font-medium ${
            theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-700'
          }`}>
            {title}
          </div>
        )}
        
        {/* 副标题 */}
        {subtitle && (
          <div className={`text-sm opacity-75 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
          }`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
