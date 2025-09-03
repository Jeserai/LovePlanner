import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { ThemeButton, ThemeDialog } from './Components';

// AlertDialog 组件接口
export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title = "确认操作",
  description = "此操作无法撤销，请确认是否继续？",
  variant = 'default',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  children
}) => {
  const { theme } = useTheme();

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const getConfirmText = () => {
    if (confirmText) return confirmText;
    
    if (variant === 'destructive') {
      return theme === 'pixel' ? 'DELETE' : theme === 'modern' ? 'Delete' : '删除';
    }
    
    return theme === 'pixel' ? 'CONFIRM' : theme === 'modern' ? 'Confirm' : '确认';
  };

  const getCancelText = () => {
    if (cancelText) return cancelText;
    return theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消';
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <ThemeDialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{getIcon()}</span>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' :
              false ? '' :
              theme === 'modern' ? 'text-foreground' :
              'text-gray-900'
            }`}>
              {theme === 'pixel' ? title.toUpperCase() : title}
            </h3>
            
            <p className={`text-sm mt-2 ${
              theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
              false ? '' :
              theme === 'modern' ? 'text-muted-foreground' :
              'text-gray-600'
            }`}>
              {theme === 'pixel' ? description.toUpperCase() : description}
            </p>
          </div>
        </div>

        {/* Custom Content */}
        {children && (
          <div className={`${
            theme === 'pixel' ? 'border-t-2 border-pixel-border pt-4' :
            false ? 'border-t  pt-4' :
            theme === 'modern' ? 'border-t border-border pt-4' :
            'border-t border-gray-200 pt-4'
          }`}>
            {children}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 justify-end">
          <ThemeButton 
            variant="secondary" 
            onClick={handleCancel}
          >
            {getCancelText()}
          </ThemeButton>
          
          <ThemeButton 
            variant={variant === 'destructive' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {getConfirmText()}
          </ThemeButton>
        </div>
      </div>
    </ThemeDialog>
  );
};

// 便捷的 alert 函数接口
export interface AlertOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
}

// 这些函数需要在有 AlertDialog 状态管理的组件中使用
export const createAlert = () => {
  return {
    confirm: (options: AlertOptions = {}) => {
      return new Promise<boolean>((resolve) => {
        // 这里需要实际的状态管理逻辑
        // 暂时返回 true，实际使用时需要配合状态管理
        resolve(true);
      });
    },
    
    delete: (itemName?: string) => {
      return new Promise<boolean>((resolve) => {
        // 删除确认对话框
        resolve(true);
      });
    }
  };
};
