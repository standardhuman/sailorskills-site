import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', or 'system'
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Update isDark when theme mode or system preference changes
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  async function loadThemePreference() {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) {
        setThemeMode(saved);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  }

  async function setTheme(mode) {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  const theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? Colors.dark : Colors,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeContext;
