import { useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { useUiStore } from '@/store/useUiStore';
import { fontsToLoad } from './typography';
import { buildTheme } from './useTheme';
import { ThemeContext } from './useTheme';
import type { Scheme } from './tokens';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const systemScheme = useColorScheme();
  const themePreference = useUiStore((s) => s.themePreference);

  useEffect(() => {
    void useUiStore.getState().hydrateUi();
  }, []);

  const scheme: Scheme =
    themePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;

  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  if (!fontsLoaded) return null;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
