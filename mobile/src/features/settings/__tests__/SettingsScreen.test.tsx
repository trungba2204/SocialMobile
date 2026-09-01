import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import * as authApi from '@/api/auth';
import * as tokenStore from '@/api/tokenStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';

jest.mock('@/api/auth');
jest.mock('@/api/tokenStore');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const logout = authApi.logout as jest.MockedFunction<typeof authApi.logout>;
const getRefreshToken = tokenStore.getRefreshToken as jest.MockedFunction<
  typeof tokenStore.getRefreshToken
>;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logout.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue('refresh-123');
    useUiStore.setState({ themePreference: 'system' });
    useAuthStore.setState({ status: 'signedIn', user: null, accessToken: 'a' });
  });

  it('tapping Appearance → Dark calls setThemePreference("dark")', async () => {
    const spy = jest.spyOn(useUiStore.getState(), 'setThemePreference');
    const { getByLabelText } = await renderScreen();

    fireEvent.press(getByLabelText('Dark'));

    expect(spy).toHaveBeenCalledWith('dark');
    expect(useUiStore.getState().themePreference).toBe('dark');
  });

  it('Log out → confirm → calls authApi.logout then signs out', async () => {
    const { getByLabelText, getByText, getAllByText } = await renderScreen();

    fireEvent.press(getByLabelText('Log out'));
    // Confirm modal open — no logout yet.
    await waitFor(() => expect(getByText('Log out?')).toBeTruthy());
    expect(logout).not.toHaveBeenCalled();

    // The modal's confirm button is the last "Log out" text in the tree.
    const matches = getAllByText('Log out');
    fireEvent.press(matches[matches.length - 1]);

    await waitFor(() => expect(logout).toHaveBeenCalledWith('refresh-123'));
    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedOut'));
  });
});
