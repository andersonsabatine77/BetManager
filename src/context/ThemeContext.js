import React, { createContext, useContext, useState } from 'react';

const DARK = {
  background: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  primary: '#7c3aed',
  secondary: '#0ea5e9',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  isDark: true,
};

const LIGHT = {
  background: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  primary: '#7c3aed',
  secondary: '#0ea5e9',
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
  text: '#0f172a',
  textSecondary: '#475569',
  isDark: false,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? DARK : LIGHT;
  return (
    <ThemeContext.Provider value={{ colors, isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
