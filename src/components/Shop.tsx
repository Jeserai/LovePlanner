import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ShoppingBagIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

const Shop: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : theme === 'fresh'
              ? 'font-display text-fresh-text fresh-gradient-text'
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'SHOP.EXE' : theme === 'modern' ? 'Personal Shop' : '个人商店'}
          </h2>
        </div>
      </div>

      {/* Under Development Notice */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`max-w-md w-full p-8 text-center ${
          theme === 'pixel' 
            ? 'bg-pixel-card border-4 border-pixel-border rounded-pixel shadow-pixel'
            : theme === 'fresh'
            ? 'bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh'
            : 'bg-white rounded-xl shadow-soft border border-gray-200'
        }`}>
          {/* Icon */}
          <div className="mb-6">
            {theme === 'pixel' ? (
              <PixelIcon 
                name="warning" 
                size="lg" 
                className="text-pixel-warning mx-auto"
              />
            ) : (
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                theme === 'fresh' 
                  ? 'bg-fresh-primary border border-fresh-border'
                  : 'bg-orange-100'
              }`}>
                <ClockIcon className={`w-8 h-8 ${
                  theme === 'fresh' ? 'text-fresh-accent' : 'text-orange-500'
                }`} />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold mb-4 ${
            theme === 'pixel' 
              ? 'text-pixel-text font-mono uppercase'
              : theme === 'fresh'
              ? 'text-fresh-text'
              : 'text-gray-800'
          }`}>
            {theme === 'pixel' ? 'UNDER_DEVELOPMENT' : theme === 'modern' ? 'Under Development' : '开发中'}
          </h3>

          {/* Message */}
          <p className={`text-base leading-relaxed mb-6 ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono'
              : theme === 'fresh'
              ? 'text-fresh-textMuted'
              : 'text-gray-600'
          }`}>
            {theme === 'pixel' 
              ? 'THIS MODULE IS CURRENTLY UNDER DEVELOPMENT.\nCOMING SOON!'
              : theme === 'modern' 
              ? 'This feature module is under development.\nCurrently unavailable, stay tuned!'
              : '该功能模块正在开发中，\n暂时不可用，敬请期待！'
            }
          </p>

          {/* Shop Icon */}
          <div className={`inline-flex items-center justify-center w-12 h-12 ${
            theme === 'pixel'
              ? 'bg-pixel-panel border-2 border-pixel-border rounded-pixel'
              : theme === 'fresh'
              ? 'bg-fresh-primary rounded-fresh-full'
              : 'bg-gray-100 rounded-full'
          }`}>
            {theme === 'pixel' ? (
              <PixelIcon name="shop" size="md" className="text-pixel-textMuted" />
            ) : (
              <ShoppingBagIcon className={`w-6 h-6 ${
                theme === 'fresh' ? 'text-fresh-accent' : 'text-gray-400'
              }`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop; 