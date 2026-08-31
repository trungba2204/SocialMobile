import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'light' | 'dark' | 'system';
export type Toast = { id: number; message: string; tone: 'neutral' | 'success' | 'error' };

export const THEME_STORAGE_KEY = 'orbit.theme';

interface UiState {
  themePreference: ThemePref;
  toast: Toast | null;
  unreadNotifications: number;
  hydrateUi(): Promise<void>;
  setThemePreference(p: ThemePref): void;
  showToast(t: Omit<Toast, 'id'>): void;
  hideToast(): void;
  setUnreadNotifications(n: number): void;
}

export const useUiStore = create<UiState>((set) => ({
  themePreference: 'system',
  toast: null,
  unreadNotifications: 0,
  hydrateUi: async () => {
    const pref = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemePref | null;
    if (pref === 'light' || pref === 'dark' || pref === 'system') {
      set({ themePreference: pref });
    }
  },
  setThemePreference: (p) => {
    set({ themePreference: p });
    void AsyncStorage.setItem(THEME_STORAGE_KEY, p);
  },
  showToast: (t) => set({ toast: { ...t, id: Date.now() } }),
  hideToast: () => set({ toast: null }),
  setUnreadNotifications: (n) => set({ unreadNotifications: n }),
}));
