"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';


export type Theme = 'leet' | 'heroui';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('heroui');
  const toggleTheme = () => setTheme(prev => (prev === 'leet' ? 'heroui' : 'leet'));
  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.remove('heroui', 'leet');
    document.documentElement.classList.add(theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
