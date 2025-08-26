import React, { createContext, useContext, useState, useEffect } from 'react';
// 导入主题初始化工具
import '../utils/themeInit.js';

export type ThemeType = 'pixel' | 'fresh';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('fresh');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme && (savedTheme === 'pixel' || savedTheme === 'fresh')) {
      setThemeState(savedTheme);
    } else {
      // 默认使用清新主题
      setThemeState('fresh');
      localStorage.setItem('theme', 'fresh');
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
    // 确保body也有对应的类名
    document.body.className = `${theme}-theme`;
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    // 在两个主题之间切换
    if (theme === 'pixel') {
      setThemeState('fresh');
    } else {
      setThemeState('pixel');
    }
  };

  const value = {
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 