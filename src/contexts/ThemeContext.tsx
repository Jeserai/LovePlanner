import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [theme, setThemeState] = useState<ThemeType>('modern');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useSidebarLayout, setUseSidebarLayout] = useState(true);
  const [language, setLanguageState] = useState<LanguageType>('zh');

  // Load theme, dark mode, layout, and language from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedLayout = localStorage.getItem('sidebarLayout');
    const savedLanguage = (localStorage.getItem('language') as LanguageType) || 'zh';
    
    // 强制使用现代主题，隐藏像素主题选项
    setThemeState('modern');
    localStorage.setItem('theme', 'modern');
    
    setIsDarkMode(savedDarkMode);
    
    // 恢复用户的布局选择，如果没有保存过则默认使用侧边栏布局
    if (savedLayout !== null) {
      setUseSidebarLayout(savedLayout === 'true');
    } else {
      setUseSidebarLayout(true);
      localStorage.setItem('sidebarLayout', 'true');
    }
    
    setLanguageState(savedLanguage);
  }, []);

  // Update localStorage and document class when theme, dark mode, or language changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', isDarkMode.toString());
    localStorage.setItem('sidebarLayout', useSidebarLayout.toString());
    localStorage.setItem('language', language);
    
    // 构建类名
    const classes: string[] = [theme, language];
    if (isDarkMode && theme === 'modern') {
      classes.push('dark');
    }
    
    document.documentElement.className = classes.join(' ');
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    // 确保body也有对应的类名
    document.body.className = `${theme}-theme${isDarkMode && theme === 'modern' ? ' dark' : ''} lang-${language}`;
  }, [theme, isDarkMode, useSidebarLayout, language]);

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