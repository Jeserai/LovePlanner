import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Spinner } from './spinner';
import { useTranslation } from '../../utils/i18n';

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
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  
  // 默认加载文本
  const defaultTitle = title || (theme === 'pixel' ? 'LOADING...' : t('loading'));
  const defaultSubtitle = subtitle || (theme === 'pixel' ? 'PLEASE WAIT...' : t('please_wait'));

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
        {theme === 'modern' ? (
          <div className="flex justify-center">
            <Spinner 
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
              className="text-primary"
            />
          </div>
        ) : (
          <div className={`mx-auto ${sizeClasses[size]} ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border border-t-pixel-accent animate-spin' 
              : false
              ? 'border-4  border-t-fresh-primary animate-spin'
              : 'border-4 border-gray-200 border-t-primary-600 animate-spin'
          } rounded-full`}></div>
        )}
        
        {/* 主要文字 */}
        {(title || !title) && (
          <div className={`${textSizeClasses[size]} font-medium ${
            theme === 'pixel' 
              ? 'text-pixel-text font-mono uppercase' 
              : theme === 'modern'
              ? 'text-foreground'
              : 'text-gray-700'
          }`}>
            {defaultTitle}
          </div>
        )}
        
        {/* 副标题 */}
        {(subtitle || !subtitle) && (
          <div className={`text-sm ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono opacity-75' 
              : theme === 'modern'
              ? 'text-muted-foreground'
              : 'text-gray-500 opacity-75'
          }`}>
            {defaultSubtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
