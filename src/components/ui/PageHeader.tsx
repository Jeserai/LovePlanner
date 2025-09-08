import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeButton } from './Components';
import Icon from './Icon';

interface PageHeaderProps {
  title: string;
  // 视图切换器配置
  viewSwitcher?: {
    views: Array<{
      id: string;
      name: string;
      icon?: string;
      count?: number;
    }>;
    currentView: string;
    onViewChange: (viewId: string) => void;
  };
  // 右侧操作按钮
  actions?: Array<{
    label: string;
    variant?: 'primary' | 'secondary';
    icon?: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  }>;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  viewSwitcher,
  actions = [],
  className = ''
}) => {
  const { theme } = useTheme();

  // 获取主题化标题样式
  const getTitleStyles = () => {
    switch (theme) {
      case 'pixel':
        return 'font-retro text-pixel-text uppercase tracking-wider';
      case 'modern':
        return 'text-foreground font-semibold';
      default:
        return 'font-display text-gray-700';
    }
  };

  // 获取视图切换器样式
  const getViewSwitcherStyles = () => {
    switch (theme) {
      case 'pixel':
        return 'border-4 border-pixel-border bg-pixel-card shadow-pixel';
      case 'modern':
        return 'bg-muted/50 border border-border rounded-lg';
      default:
        return 'border border-gray-200 rounded-lg';
    }
  };

  // 获取视图按钮样式
  const getViewButtonStyles = (viewId: string, isActive: boolean) => {
    const baseStyles = 'flex items-center justify-center px-3 py-2 text-sm font-medium transition-all duration-200';
    
    switch (theme) {
      case 'pixel':
        return `${baseStyles} font-mono uppercase ${
          isActive 
            ? 'bg-pixel-accent text-black border-2 border-black' 
            : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent border-2 border-transparent'
        }`;
      case 'modern':
        return `${baseStyles} ${
          isActive 
            ? 'bg-background text-foreground shadow-sm border border-border' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
        }`;
      default:
        return `${baseStyles} ${
          isActive 
            ? 'bg-primary-500 text-white' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700'
        }`;
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      {/* 左侧：标题和视图切换器 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-4">
        {/* 页面标题 */}
        <h2 className={`text-2xl sm:text-3xl font-bold ${getTitleStyles()}`}>
          {title}
        </h2>
        
        {/* 视图切换器 */}
        {viewSwitcher && (
          <div className={`flex overflow-hidden w-full sm:w-auto ${getViewSwitcherStyles()}`}>
            {viewSwitcher.views.map((view, index) => (
              <button
                key={view.id}
                onClick={() => viewSwitcher.onViewChange(view.id)}
                className={`${getViewButtonStyles(view.id, viewSwitcher.currentView === view.id)} ${
                  index === 0 
                    ? theme === 'modern' ? 'rounded-l-md' : 'rounded-l-lg' 
                    : index === viewSwitcher.views.length - 1 
                    ? theme === 'modern' ? 'rounded-r-md' : 'rounded-r-lg' 
                    : ''
                }`}
              >
                {view.icon && (
                  <Icon 
                    name={view.icon as any} 
                    className={`w-4 h-4 ${view.name ? 'mr-2' : ''}`} 
                  />
                )}
                <span>{view.name}</span>
                {view.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    theme === 'pixel' 
                      ? 'bg-pixel-border text-pixel-text' 
                      : false
                      ? ' '
                      : theme === 'modern'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：操作按钮 */}
      {actions.length > 0 && (
        <div className="flex space-x-3">
          {actions.map((action, index) => (
            <ThemeButton
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'primary'}
              size="md"
              disabled={action.loading || action.disabled}
            >
              {action.label}
            </ThemeButton>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
