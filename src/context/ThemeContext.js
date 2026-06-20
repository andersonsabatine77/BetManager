import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@betmanager_theme';

const lightColors = {
  background: '#f0f2f5',
  card: '#ffffff',
  primary: '#6c63ff',
  secondary: '#ff6584',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  win: '#10b981',
  loss: '#ef4444',
  live: '#ef4444',
};

const darkColors = {
  background: '#0f0f1a',
  card: '#1a1a2e',
  primary: '#7c73ff',
  secondary: '#ff7594',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#2d2d4e',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  win: '#34d399',
  loss: '#f87171',
  live: '#f87171',
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((val) => {
        if (val === 'dark') setIsDark(true);
      })
      .finally(() => setLoaded(true));
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const colors = isDark ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
