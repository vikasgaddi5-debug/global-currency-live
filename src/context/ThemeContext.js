import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';
import { useCurrency } from './CurrencyContext';

const ThemeContext = createContext(lightTheme);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const { settings } = useCurrency();

  const theme = useMemo(() => {
    const preference = settings?.theme || 'system';
    const resolved = preference === 'system' ? systemScheme : preference;
    return resolved === 'dark' ? darkTheme : lightTheme;
  }, [settings?.theme, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
