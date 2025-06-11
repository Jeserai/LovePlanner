import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ViewOption<T = string> {
  key: T;
  emoji: string;
  label: string;
  pixelLabel: string;
}

interface ViewSwitcherProps<T = string> {
  currentView: T;
  onViewChange: (view: T) => void;
  options: ViewOption<T>[];
  className?: string;
}

const ViewSwitcher = <T extends string = string>({ 
  currentView, 
  onViewChange, 
  options, 
  className = "" 
}: ViewSwitcherProps<T>) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center space-x-2 p-1 ${
      theme === 'pixel' 
        ? 'bg-pixel-card pixel-container rounded-pixel shadow-pixel neon-border' 
        : 'bg-white/40 backdrop-blur-md rounded-2xl border border-secondary-200/30'
    } ${className}`}>
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onViewChange(option.key)}
          className={`flex items-center space-x-2 px-4 py-2 transition-all duration-300 ${
            theme === 'pixel' 
              ? `rounded-pixel font-mono text-sm uppercase font-bold ${
                  currentView === option.key
                    ? 'bg-pixel-info text-black shadow-pixel pixel-border-info neon-border'
                    : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-info'
                }`
              : `rounded-xl ${
                  currentView === option.key
                    ? 'bg-blue-400 text-white shadow-dream'
                    : 'text-sage-600 hover:bg-blue-50/60'
                }`
          }`}
        >
          <span className="text-lg">{option.emoji}</span>
          <span className="font-medium">
            {theme === 'pixel' ? option.pixelLabel : option.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher; 