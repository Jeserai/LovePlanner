import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface DetailFieldProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
  valueClassName?: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ 
  label, 
  value, 
  className = '',
  valueClassName = '' 
}) => {
  const { theme } = useTheme();

  return (
    <div className={`${className}`}>
      <label className={`block text-sm font-medium mb-1 ${
        theme === 'pixel'
          ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text'
          : theme === 'modern'
          ? 'text-muted-foreground font-medium'
          : 'text-gray-700'
      }`}>
        {label}
      </label>
      <div className={`${
        theme === 'pixel'
          ? 'text-pixel-text font-mono'
          : theme === 'modern'
          ? 'text-foreground'
          : 'text-gray-900'
      } ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
};

export default DetailField;
