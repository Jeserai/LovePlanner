import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const getTypeIcon = () => {
    if (theme === 'pixel') {
      switch (type) {
        case 'danger':
          return <PixelIcon name="x" className="text-pixel-accent" size="lg" />;
        case 'warning':
          return <PixelIcon name="warning" className="text-pixel-warning" size="lg" />;
        case 'info':
          return <PixelIcon name="info" className="text-pixel-info" size="lg" />;
        default:
          return <PixelIcon name="warning" className="text-pixel-warning" size="lg" />;
      }
    } else {
      return <ExclamationTriangleIcon className={`w-8 h-8 ${
        type === 'danger' ? 'text-red-500' : 
        type === 'warning' ? 'text-yellow-500' : 
        'text-blue-500'
      }`} />;
    }
  };

  const getTypeColor = () => {
    if (theme === 'pixel') {
      switch (type) {
        case 'danger':
          return 'border-pixel-accent';
        case 'warning':
          return 'border-pixel-warning';
        case 'info':
          return 'border-pixel-info';
        default:
          return 'border-pixel-warning';
      }
    } else {
      switch (type) {
        case 'danger':
          return 'border-red-200';
        case 'warning':
          return 'border-yellow-200';
        case 'info':
          return 'border-blue-200';
        default:
          return 'border-yellow-200';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`p-6 w-full max-w-md mx-4 ${
        theme === 'pixel' 
          ? `bg-pixel-panel border-4 ${getTypeColor()} rounded-pixel shadow-pixel-lg neon-border pixel-container` 
          : `card-cutesy border-2 ${getTypeColor()}`
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getTypeIcon()}
            <h3 className={`text-xl font-bold ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                : 'font-display text-gray-800'
            }`}>
              {title || (theme === 'pixel' ? 'CONFIRMATION' : '确认操作')}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 transition-colors ${
              theme === 'pixel'
                ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {theme === 'pixel' ? (
              <PixelIcon name="x" size="sm" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="mb-6">
          <p className={`${
            theme === 'pixel' 
              ? 'text-pixel-text font-mono leading-relaxed'
              : 'text-gray-700 leading-relaxed'
          }`}>
            {message}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 px-4 border-2 transition-all duration-300 ${
              theme === 'pixel'
                ? 'border-pixel-border text-pixel-text rounded-pixel hover:bg-pixel-card font-mono uppercase'
                : 'border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50'
            }`}
          >
            {cancelText || (theme === 'pixel' ? 'CANCEL' : '取消')}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
              theme === 'pixel'
                ? `rounded-pixel font-mono uppercase ${
                    type === 'danger' 
                      ? 'bg-pixel-accent text-white border-4 border-white pixel-btn-neon' 
                      : 'bg-pixel-warning text-black border-4 border-black'
                  }`
                : `rounded-xl ${
                    type === 'danger' 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'btn-primary'
                  }`
            }`}
          >
            {confirmText || (theme === 'pixel' ? 'CONFIRM' : '确认')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 