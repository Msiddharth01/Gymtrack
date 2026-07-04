import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = {
  dark: {
    background: '#0B0B0B',
    card: '#1A1A1A',
    text: '#FFFFFF',
    subtext: '#A1A1AA',
    primary: '#FF3B3B',
    border: '#222',
    divider: '#222222',
    selectedText: '#ffffff',
    unselectedText: '#A1A1AA',
    unselectedBg: '#1a1a1a'
  },
  light: {
    background: '#FFFFFF',
    card: '#F3F4F6',
    text: '#111827',
    subtext: '#6B7280',
    primary: '#FF3B3B',
    border: '#E0E0E0',
    divider: '#F0F0F0',
    selectedText: '#ffffff',
    unselectedText: '#6B7280',
    unselectedBg: '#eaeaea'
  }
};

type ThemeType = typeof THEMES.dark;

interface ThemeContextType {
  theme: ThemeType;
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('appTheme');
      if (saved === 'light' || saved === 'dark') {
        setMode(saved as 'light' | 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    await AsyncStorage.setItem('appTheme', newMode);
  };

  const theme = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
