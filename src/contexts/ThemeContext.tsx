import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLayoutStorage } from '../hooks/useLocalStorage';

export type ThemeType = 'pixel' | 'modern';
export type LanguageType = 'zh' | 'en';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  useSidebarLayout: boolean;
  setSidebarLayout: (useSidebar: boolean) => void;
  toggleLayout: () => void;
  language: LanguageType;
  setLanguage: (language: LanguageType) => void;
  toggleLanguage: () => void;
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
  // 使用新的安全localStorage hook
  const {
    theme,
    setTheme: setThemeState,
    isDarkMode,
    setDarkMode: setIsDarkMode,
    useSidebarLayout,
    setUseSidebarLayout,
    language,
    setLanguage: setLanguageState
  } = useLayoutStorage();

  // 应用主题和类名到DOM
  useEffect(() => {
    // 确保在客户端环境
    if (typeof window === 'undefined') return;
    
    // 强制使用现代主题
    if (theme !== 'modern') {
      setThemeState('modern');
      return;
    }
    
    // 构建类名
    const classes: string[] = [theme, language];
    if (isDarkMode && theme === 'modern') {
      classes.push('dark');
    }
    
    document.documentElement.className = classes.join(' ');
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    // 确保body也有对应的类名
    document.body.className = `${theme}-theme${isDarkMode && theme === 'modern' ? ' dark' : ''} lang-${language}`;
  }, [theme, isDarkMode, language, setThemeState]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    // 在两个主题之间循环切换
    if (theme === 'pixel') {
      setThemeState('modern');
    } else {
      setThemeState('pixel');
    }
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setSidebarLayout = (useSidebar: boolean) => {
    setUseSidebarLayout(useSidebar);
  };

  const toggleLayout = () => {
    setUseSidebarLayout(!useSidebarLayout);
  };

  const setLanguage = (newLanguage: LanguageType) => {
    setLanguageState(newLanguage);
  };

  const toggleLanguage = () => {
    setLanguageState(language === 'zh' ? 'en' : 'zh');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode,
    setDarkMode,
    toggleDarkMode,
    useSidebarLayout,
    setSidebarLayout,
    toggleLayout,
    language,
    setLanguage,
    toggleLanguage
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 