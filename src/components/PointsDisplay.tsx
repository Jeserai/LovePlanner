import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GiftIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

interface PointsDisplayProps {
  points: number;
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ points, className = "" }) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${
      theme === 'pixel' 
        ? 'bg-pixel-card pixel-card rounded-pixel shadow-pixel neon-border' 
        : 'bg-white/60 backdrop-blur-md rounded-xl border border-secondary-200/30'
    } ${className}`}>
      {theme === 'pixel' ? (
        <PixelIcon name="gift" className="text-pixel-accent" size="sm" glow />
      ) : (
        <GiftIcon className="w-5 h-5 text-secondary-600" />
      )}
      <span className={`font-bold ${
        theme === 'pixel' 
          ? 'text-pixel-text font-mono uppercase tracking-wide'
          : 'text-gray-700'
      }`}>
        {theme === 'pixel' ? 'POINTS:' : '积分:'} {points}
      </span>
    </div>
  );
};

export default PointsDisplay; 