import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  FluentProvider, 
  webLightTheme, 
  webDarkTheme,
  Theme
} from '@fluentui/react-components';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  fluentTheme: Theme;
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
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // 从 localStorage 读取保存的主题，默认为浅色
    const savedTheme = localStorage.getItem('i18n-theme') as ThemeMode;
    return savedTheme || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('i18n-theme', newTheme);
      return newTheme;
    });
  };

  const fluentTheme = theme === 'light' ? webLightTheme : webDarkTheme;

  useEffect(() => {
    // 保存主题到 localStorage
    localStorage.setItem('i18n-theme', theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    fluentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      <FluentProvider theme={fluentTheme} style={{ height: '100%', width: '100%' }}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
};