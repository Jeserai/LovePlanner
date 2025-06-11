import React from 'react';

// 像素风格图标组件
interface PixelIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

const PixelIcon: React.FC<PixelIconProps> = ({ 
  name, 
  size = 'md', 
  className = '', 
  glow = false 
}) => {
  const sizeClasses = {
    'sm': 'w-4 h-4 text-sm',
    'md': 'w-5 h-5 text-base',
    'lg': 'w-6 h-6 text-lg',
    'xl': 'w-8 h-8 text-xl'
  };

  // 像素风格图标映射
  const pixelIcons: Record<string, string> = {
    // 基础图标
    'plus': '■+■',
    'check': '■✓■',
    'x': '■✕■',
    'edit': '■✎■',
    'delete': '■✖■',
    'trash': '■🗑■',
    'save': '■💾■',
    'folder': '■📁■',
    'file': '■📄■',
    'image': '■🖼■',
    
    // 界面图标
    'home': '■🏠■',
    'user': '■👤■',
    'users': '■👥■',
    'settings': '■⚙■',
    'search': '■🔍■',
    'filter': '■🔻■',
    'sort': '■↕■',
    'menu': '■☰■',
    'close': '■✕■',
    'minimize': '■━■',
    'maximize': '■□■',
    
    // 导航图标
    'arrow-left': '■◀■',
    'arrow-right': '■▶■',
    'arrow-up': '■▲■',
    'arrow-down': '■▼■',
    'chevron-left': '■‹■',
    'chevron-right': '■›■',
    'chevron-up': '■^■',
    'chevron-down': '■v■',
    
    // 功能图标
    'heart': '■♥■',
    'star': '■★■',
    'gift': '■🎁■',
    'calendar': '■📅■',
    'clock': '■⏰■',
    'bell': '■🔔■',
    'mail': '■✉■',
    'phone': '■📞■',
    'camera': '■📷■',
    'video': '■🎥■',
    'music': '■♪■',
    'volume': '■🔊■',
    
    // 工具图标
    'download': '■⬇■',
    'upload': '■⬆■',
    'link': '■🔗■',
    'share': '■📤■',
    'copy': '■📋■',
    'refresh': '■↻■',
    'sync': '■⚡■',
    'power': '■⚡■',
    
    // 状态图标
    'info': '■ℹ■',
    'warning': '■⚠■',
    'error': '■❌■',
    'success': '■✅■',
    'question': '■❓■',
    'exclamation': '■❗■',
    'loading': '■⟳■',
    
    // 特殊图标
    'shopping-bag': '■🛍■',
    'sparkles': '■✨■',
    'fire': '■🔥■',
    'zap': '■⚡■',
    'eye': '■👁■',
    'eye-slash': '■🙈■',
    'lock': '■🔒■',
    'unlock': '■🔓■',
    'key': '■🔑■',
    'shield': '■🛡■',
    
    // 游戏/像素风格专用
    'pixel-heart': '♥',
    'pixel-star': '★',
    'pixel-diamond': '◆',
    'pixel-circle': '●',
    'pixel-square': '■',
    'pixel-triangle': '▲',
    'pixel-arrow': '►',
    'pixel-cross': '✕',
    'pixel-gear': '⚙',
    'pixel-crown': '♔',
    'pixel-sword': '⚔',
    'pixel-shield': '🛡',
    'pixel-gem': '💎',
    'pixel-coin': '🪙',
    'pixel-key': '🗝',
    'pixel-door': '🚪',
    'pixel-chest': '📦',
    'pixel-scroll': '📜',
    'pixel-wand': '🪄',
    'pixel-potion': '🧪',
  };

  const iconSymbol = pixelIcons[name] || '■?■';
  
  // 去掉边框符号，只保留中间的图标
  const cleanSymbol = iconSymbol.replace(/■/g, '');

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${className}
        inline-flex items-center justify-center
        font-mono font-bold
        select-none
        ${glow ? 'animate-neon-glow' : ''}
        transition-all duration-200
      `}
      style={{
        fontFamily: '"Courier New", monospace',
        textShadow: glow ? '0 0 10px currentColor' : undefined,
        filter: 'contrast(1.2)',
      }}
    >
      {cleanSymbol}
    </span>
  );
};

export default PixelIcon; 