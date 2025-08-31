import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

// Toast 类型定义
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

// Toast Context
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // 自动移除
    const duration = toast.duration || 3000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// Toast Item
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { theme } = useTheme();

  const getVariantClasses = () => {
    const baseClasses = theme === 'pixel'
      ? 'border-2 rounded-pixel font-mono shadow-pixel-lg'
      : theme === 'fresh'
      ? 'border rounded-fresh-lg shadow-fresh-lg'
      : theme === 'modern'
      ? 'border rounded-lg shadow-lg'
      : 'border rounded-lg shadow-lg';

    switch (toast.variant) {
      case 'success':
        return theme === 'pixel'
          ? `${baseClasses} bg-green-900 border-green-400 text-green-100`
          : theme === 'fresh'
          ? `${baseClasses} bg-green-50 border-green-200 text-green-800`
          : theme === 'modern'
          ? `${baseClasses} bg-green-50 border-green-200 text-green-800`
          : `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      
      case 'error':
        return theme === 'pixel'
          ? `${baseClasses} bg-red-900 border-red-400 text-red-100`
          : theme === 'fresh'
          ? `${baseClasses} bg-red-50 border-red-200 text-red-800`
          : theme === 'modern'
          ? `${baseClasses} bg-red-50 border-red-200 text-red-800`
          : `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      
      case 'warning':
        return theme === 'pixel'
          ? `${baseClasses} bg-yellow-900 border-yellow-400 text-yellow-100`
          : theme === 'fresh'
          ? `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`
          : theme === 'modern'
          ? `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`
          : `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      
      default:
        return theme === 'pixel'
          ? `${baseClasses} bg-pixel-card border-pixel-border text-pixel-text`
          : theme === 'fresh'
          ? `${baseClasses} bg-fresh-card border-fresh-border text-fresh-text`
          : theme === 'modern'
          ? `${baseClasses} bg-background border-border text-foreground`
          : `${baseClasses} bg-white border-gray-200 text-gray-900`;
    }
  };

  const getIcon = () => {
    switch (toast.variant) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={cn(
      'p-4 min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full duration-300',
      getVariantClasses()
    )}>
      <div className="flex items-start space-x-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          {toast.title && (
            <div className={`font-semibold ${
              theme === 'pixel' ? 'font-mono uppercase text-sm' : 'text-sm'
            }`}>
              {theme === 'pixel' ? toast.title.toUpperCase() : toast.title}
            </div>
          )}
          {toast.description && (
            <div className={`text-sm ${
              theme === 'pixel' ? 'font-mono mt-1' : 'mt-1'
            } opacity-90`}>
              {theme === 'pixel' ? toast.description.toUpperCase() : toast.description}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className={`text-lg leading-none ${
            theme === 'pixel' ? 'hover:text-pixel-accent' : 'hover:opacity-70'
          } transition-colors`}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// 便捷的 toast 函数
export const toast = {
  success: (message: string, title?: string) => {
    // 这个需要在组件内部使用 useToast hook
    console.log('Success toast:', { title, message });
  },
  error: (message: string, title?: string) => {
    console.log('Error toast:', { title, message });
  },
  warning: (message: string, title?: string) => {
    console.log('Warning toast:', { title, message });
  },
  info: (message: string, title?: string) => {
    console.log('Info toast:', { title, message });
  }
};
