import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ShoppingBagIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

const Shop: React.FC = () => {
  const { theme, useSidebarLayout } = useTheme();

  return (
    <div 
      className="space-y-6"
      style={{ 
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        padding: '0',
        height: useSidebarLayout 
          ? 'calc(100vh - 6rem)' // 侧边栏布局：减去TopBar(4rem) + padding(2rem)
          : 'calc(100vh - 5rem)', // 顶部导航布局：减去header + padding
        minHeight: '600px' // 确保最小高度
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : false
              ? 'font-display  '
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'SHOP.EXE' : theme === 'modern' ? 'Personal Shop' : '个人商店'}
          </h2>
        </div>
      </div>

      {/* Under Development Notice */}
      <div className="flex items-center justify-center flex-1">
        <div className={`max-w-md w-full p-8 text-center ${
          theme === 'pixel' 
            ? 'bg-pixel-card border-4 border-pixel-border rounded-pixel shadow-pixel'
            : false
            ? ' border   shadow-fresh'
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
                false 
                  ? ' border '
                  : 'bg-orange-100'
              }`}>
                <ClockIcon className={`w-8 h-8 ${
                  false ? '' : 'text-orange-500'
                }`} />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold mb-4 ${
            theme === 'pixel' 
              ? 'text-pixel-text font-mono uppercase'
              : false
              ? ''
              : 'text-gray-800'
          }`}>
            {theme === 'pixel' ? 'UNDER_DEVELOPMENT' : theme === 'modern' ? 'Under Development' : '开发中'}
          </h3>

          {/* Message */}
          <p className={`text-base leading-relaxed mb-6 ${
            theme === 'pixel' 
              ? 'text-pixel-textMuted font-mono'
              : false
              ? ''
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
              : false
              ? ' '
              : 'bg-gray-100 rounded-full'
          }`}>
            {theme === 'pixel' ? (
              <PixelIcon name="shop" size="md" className="text-pixel-textMuted" />
            ) : (
              <ShoppingBagIcon className={`w-6 h-6 ${
                false ? '' : 'text-gray-400'
              }`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop; 