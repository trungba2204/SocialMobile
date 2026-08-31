import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RegisterScreen } from '@/features/auth/RegisterScreen';
import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/api/auth';
import { ApiError } from '@/api/errors';

jest.mock('@/api/auth');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const register = authApi.register as jest.MockedFunction<typeof authApi.register>;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <RegisterScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('RegisterScreen', () => {
  const setSession = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    setSession.mockResolvedValue(undefined);
    useAuthStore.setState({ setSession: setSession as never });
  });

  async function fillValidExcept(
    getByPlaceholderText: Awaited<ReturnType<typeof renderScreen>>['getByPlaceholderText'],
    username: string,
  ) {
    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@example.com');
    await fireEvent.changeText(getByPlaceholderText('your_handle'), username);
    await fireEvent.changeText(getByPlaceholderText('How your name appears'), 'Alice');
    await fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'abc12345');
  }

  it('blocks a bad username client-side before any network call', async () => {
    const { getByPlaceholderText, getByText } = await renderScreen();
    await fillValidExcept(getByPlaceholderText, 'AB');
    await fireEvent.press(getByText('Create account'));

    await waitFor(() => expect(getByText(/lowercase/i)).toBeTruthy());
    expect(register).not.toHaveBeenCalled();
  });

  it('surfaces a 409 message on the username field', async () => {
    register.mockRejectedValue(new ApiError('Username is already taken', 409));

    const { getByPlaceholderText, getByText } = await renderScreen();
    await fillValidExcept(getByPlaceholderText, 'alice_1');
    await fireEvent.press(getByText('Create account'));

    await waitFor(() => expect(register).toHaveBeenCalled());
    await waitFor(() => expect(getByText('Username is already taken')).toBeTruthy());
  });
});
