import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

export type AppTheme = 'white';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'white',
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('white');

  const applyThemeToDOM = () => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-dark-blue', 'dark');
    root.classList.add('theme-white', 'light');
    root.setAttribute('data-theme', 'white');
  };

  useEffect(() => {
    localStorage.setItem('eduforge_theme', 'white');
    applyThemeToDOM();
    api.getSettings().then(settings => {
      if (settings && settings.theme !== 'white') {
        api.updateSettings({ ...settings, theme: 'white' }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const setTheme = (newTheme: AppTheme = 'white') => {
    setThemeState('white');
    localStorage.setItem('eduforge_theme', 'white');
    applyThemeToDOM();
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
