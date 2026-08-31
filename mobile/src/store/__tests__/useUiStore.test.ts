import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUiStore } from '@/store/useUiStore';

beforeEach(() => {
  useUiStore.setState({ themePreference: 'system', toast: null, unreadNotifications: 0 });
  jest.clearAllMocks();
});

it('showToast sets a toast with an id, hideToast clears it', () => {
  useUiStore.getState().showToast({ message: 'hi', tone: 'success' });
  const toast = useUiStore.getState().toast;
  expect(toast).toMatchObject({ message: 'hi', tone: 'success' });
  expect(typeof toast?.id).toBe('number');

  useUiStore.getState().hideToast();
  expect(useUiStore.getState().toast).toBeNull();
});

it('setThemePreference updates state and persists to AsyncStorage', () => {
  useUiStore.getState().setThemePreference('dark');
  expect(useUiStore.getState().themePreference).toBe('dark');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('orbit.theme', 'dark');
});

it('hydrateUi loads a persisted preference', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light');
  await useUiStore.getState().hydrateUi();
  expect(useUiStore.getState().themePreference).toBe('light');
});

it('setUnreadNotifications updates the count', () => {
  useUiStore.getState().setUnreadNotifications(5);
  expect(useUiStore.getState().unreadNotifications).toBe(5);
});
