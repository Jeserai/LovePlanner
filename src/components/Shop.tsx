import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ShoppingBagIcon, GiftIcon, HeartIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/outline';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'decoration' | 'theme' | 'reward';
  icon: string;
}

const Shop: React.FC = () => {
  const { theme } = useTheme();
  
  const [userPoints] = useState(320); // 用户积分
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  const shopItems: ShopItem[] = [
    {
      id: '1',
      name: theme === 'pixel' ? 'LOVE_FRAME.PNG' : '爱心相框',
      description: theme === 'pixel' ? 'RARE DECORATION ITEM FOR YOUR PROFILE' : '为你们的头像添加浪漫边框',
      price: 100,
      category: 'decoration',
      icon: '💖'
    },
    {
      id: '2',
      name: theme === 'pixel' ? 'RAINBOW_THEME.EXE' : '彩虹主题',
      description: theme === 'pixel' ? 'UNLOCK SPECIAL RAINBOW COLOR PALETTE' : '解锁特殊的彩虹配色方案',
      price: 200,
      category: 'theme',
      icon: '🌈'
    },
    {
      id: '3',
      name: theme === 'pixel' ? 'SPECIAL_DATE.DAT' : '浪漫约会券',
      description: theme === 'pixel' ? 'REDEEM FOR A SPECIAL ROMANTIC DATE' : '兑换一次特别的浪漫约会',
      price: 500,
      category: 'reward',
      icon: '🎫'
    },
    {
      id: '4',
      name: theme === 'pixel' ? 'STAR_BADGE.ICO' : '闪耀徽章',
      description: theme === 'pixel' ? 'SHOW OFF YOUR ACHIEVEMENT LEVEL' : '展示你们的恋爱成就等级',
      price: 80,
      category: 'decoration',
      icon: '⭐'
    },
    {
      id: '5',
      name: theme === 'pixel' ? 'MUSIC_BOX.WAV' : '音乐盒',
      description: theme === 'pixel' ? 'PLAY ROMANTIC MELODIES IN APP' : '在应用中播放浪漫旋律',
      price: 150,
      category: 'decoration',
      icon: '🎵'
    },
    {
      id: '6',
      name: theme === 'pixel' ? 'PREMIUM_TASKS.EXE' : '高级任务包',
      description: theme === 'pixel' ? 'UNLOCK EXCLUSIVE ROMANTIC CHALLENGES' : '解锁独家浪漫挑战任务',
      price: 300,
      category: 'reward',
      icon: '🎯'
    }
  ];

  const handlePurchase = (item: ShopItem) => {
    if (userPoints >= item.price && !purchasedItems.includes(item.id)) {
      setPurchasedItems([...purchasedItems, item.id]);
      // 这里应该扣除积分，但为了演示简化处理
    }
  };

  const getCategoryColor = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'decoration': return 'bg-pixel-purple text-white';
        case 'theme': return 'bg-pixel-info text-black';
        case 'reward': return 'bg-pixel-accent text-black';
        default: return 'bg-pixel-textMuted text-white';
      }
    }
    
    switch (category) {
      case 'decoration': return 'bg-primary-400 text-white';
      case 'theme': return 'bg-blue-400 text-white';
      case 'reward': return 'bg-secondary-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getCategoryName = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'decoration': return 'DECOR';
        case 'theme': return 'THEME';
        case 'reward': return 'REWARD';
        default: return 'OTHER';
      }
    }
    
    switch (category) {
      case 'decoration': return '装饰';
      case 'theme': return '主题';
      case 'reward': return '奖励';
      default: return '其他';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'LOVE_SHOP.EXE' : '个人商店'}
          </h2>
          <div className={`flex items-center space-x-2 px-4 py-2 ${
            theme === 'pixel' 
              ? 'bg-pixel-card border-4 border-black rounded-pixel shadow-pixel' 
              : 'bg-gradient-to-r from-secondary-400 to-secondary-500 text-white rounded-xl shadow-dream'
          }`}>
            <GiftIcon className={`w-5 h-5 ${theme === 'pixel' ? 'text-pixel-accent' : ''}`} />
            <span className={`font-bold ${
              theme === 'pixel' 
                ? 'text-pixel-text font-mono'
                : ''
            }`}>
              {theme === 'pixel' ? 'COINS:' : '积分:'} {userPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map(item => {
          const isPurchased = purchasedItems.includes(item.id);
          const canAfford = userPoints >= item.price;
          
          return (
            <div
              key={item.id}
              className={`p-6 transition-all duration-300 ${
                theme === 'pixel' 
                  ? `bg-pixel-panel border-4 border-pixel-border rounded-pixel hover:shadow-pixel ${isPurchased ? 'border-pixel-success' : ''}`
                  : `card-cutesy hover:scale-105 ${isPurchased ? 'border-2 border-secondary-400' : ''}`
              }`}
            >
              {/* Item Icon & Category */}
              <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl p-3 ${
                  theme === 'pixel' 
                    ? 'bg-pixel-card border-2 border-black rounded-pixel'
                    : 'bg-white/40 rounded-2xl'
                }`}>
                  {item.icon}
                </div>
                <div className={`px-3 py-1 text-xs font-bold ${
                  theme === 'pixel' 
                    ? `${getCategoryColor(item.category)} rounded-pixel border border-black font-mono uppercase`
                    : `${getCategoryColor(item.category)} rounded-xl`
                }`}>
                  {getCategoryName(item.category)}
                </div>
              </div>

              {/* Item Details */}
              <div className="mb-4">
                <h3 className={`text-lg font-bold mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-text font-mono uppercase'
                    : 'text-gray-800'
                }`}>
                  {item.name}
                </h3>
                <p className={`text-sm ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono'
                    : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
              </div>

              {/* Price & Purchase */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-warning font-mono font-bold'
                    : 'text-orange-600 font-medium'
                }`}>
                  <StarIcon className="w-4 h-4" />
                  <span>{item.price}</span>
                </div>
                
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isPurchased || !canAfford}
                  className={`px-4 py-2 font-bold transition-all duration-300 ${
                    theme === 'pixel' 
                      ? `rounded-pixel border-2 font-mono uppercase text-sm ${
                          isPurchased 
                            ? 'bg-pixel-success text-black border-black cursor-default'
                            : canAfford
                            ? 'bg-pixel-accent text-black border-black hover:shadow-pixel hover:translate-y-[-1px]'
                            : 'bg-pixel-border text-pixel-textMuted border-pixel-border cursor-not-allowed'
                        }`
                      : `rounded-xl ${
                          isPurchased 
                            ? 'bg-secondary-400 text-white cursor-default'
                            : canAfford
                            ? 'bg-primary-400 text-white hover:bg-primary-500 hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`
                  }`}
                >
                  {isPurchased 
                    ? (theme === 'pixel' ? 'OWNED' : '已拥有')
                    : canAfford 
                    ? (theme === 'pixel' ? 'BUY' : '购买')
                    : (theme === 'pixel' ? 'NO_FUNDS' : '积分不足')
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Information Panel */}
      <div className={`p-6 ${
        theme === 'pixel' 
          ? 'bg-pixel-card border-4 border-pixel-border rounded-pixel'
          : 'card-cutesy'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <SparklesIcon className={`w-6 h-6 ${
            theme === 'pixel' ? 'text-pixel-accent' : 'text-secondary-600'
          }`} />
          <h3 className={`text-lg font-bold ${
            theme === 'pixel' 
              ? 'text-pixel-text font-retro uppercase'
              : 'text-gray-800 font-display'
          }`}>
            {theme === 'pixel' ? 'SHOP_INFO' : '商店说明'}
          </h3>
        </div>
        <p className={`text-sm leading-relaxed ${
          theme === 'pixel' 
            ? 'text-pixel-textMuted font-mono'
            : 'text-gray-600'
        }`}>
          {theme === 'pixel' 
            ? 'COMPLETE TASKS TO EARN COINS! USE COINS TO BUY EXCLUSIVE ITEMS AND UNLOCK SPECIAL FEATURES FOR YOUR LOVE ADVENTURE!'
            : '通过完成任务获得积分！使用积分购买独家物品，解锁专属功能，让你们的爱情之旅更加精彩！'
          }
        </p>
        
        {purchasedItems.length > 0 && (
          <div className="mt-4">
            <h4 className={`font-bold mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-success font-mono uppercase'
                : 'text-secondary-600'
            }`}>
              {theme === 'pixel' ? 'INVENTORY:' : '已购买物品:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {purchasedItems.map(itemId => {
                const item = shopItems.find(i => i.id === itemId);
                return (
                  <div
                    key={itemId}
                    className={`flex items-center space-x-2 px-3 py-1 ${
                      theme === 'pixel' 
                        ? 'bg-pixel-success text-black rounded-pixel border border-black font-mono'
                        : 'bg-secondary-100 text-secondary-700 rounded-xl'
                    }`}
                  >
                    <span>{item?.icon}</span>
                    <span className="text-sm font-medium">
                      {theme === 'pixel' ? item?.name.toUpperCase() : item?.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop; 