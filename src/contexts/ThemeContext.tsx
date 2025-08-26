import React, { createContext, useContext, useState, useEffect } from 'react';
// 导入主题初始化工具
import '../utils/themeInit.js';

export type ThemeType = 'pixel' | 'romantic' | 'fresh';

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
  const [theme, setThemeState] = useState<ThemeType>('pixel');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme && (savedTheme === 'pixel' || savedTheme === 'romantic' || savedTheme === 'fresh')) {
      setThemeState(savedTheme);
    } else {
      // 默认使用像素风主题
      setThemeState('pixel');
      localStorage.setItem('theme', 'pixel');
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
    // 在三个主题之间循环切换
    if (theme === 'pixel') {
      setThemeState('romantic');
    } else if (theme === 'romantic') {
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