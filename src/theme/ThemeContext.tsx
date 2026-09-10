import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { SettingsRepository } from '../db/repository';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
];

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  currency: CurrencyOption;
  setCurrency: (currency: CurrencyOption) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [currency, setCurrencyState] = useState<CurrencyOption>(CURRENCIES[0]);

  useEffect(() => {
    try {
      const savedTheme = SettingsRepository.getSetting('theme_mode', 'dark') as ThemeMode;
      setThemeModeState(savedTheme);

      const savedCurrCode = SettingsRepository.getSetting('currency', 'INR');
      const found = CURRENCIES.find((c) => c.code === savedCurrCode);
      if (found) {
        setCurrencyState(found);
      }
    } catch (e) {}
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      SettingsRepository.setSetting('theme_mode', mode);
    } catch (e) {}
  };

  const setCurrency = (curr: CurrencyOption) => {
    setCurrencyState(curr);
    try {
      SettingsRepository.setSetting('currency', curr.code);
      SettingsRepository.setSetting('currency_symbol', curr.symbol);
    } catch (e) {}
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        setThemeMode,
        currency,
        setCurrency,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
