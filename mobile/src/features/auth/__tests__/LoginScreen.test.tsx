import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/api/auth';
import { ApiError } from '@/api/errors';

jest.mock('@/api/auth');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const login = authApi.login as jest.MockedFunction<typeof authApi.login>;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <LoginScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ setSession: jest.fn() as never });
  });

  it('blocks empty submit with a validation error and does not call the API', async () => {
    const { getByText } = await renderScreen();
    await act(async () => {
      fireEvent.press(getByText('Log in'));
    });
    await waitFor(() => expect(getByText('Enter your email or username')).toBeTruthy());
    expect(login).not.toHaveBeenCalled();
  });

  it('calls authApi.login then setSession on valid input', async () => {
    const auth = {
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 1, username: 'x', displayName: 'X', avatarUrl: null, bio: null },
    };
    login.mockResolvedValue(auth);
    const setSession = jest.fn();
    useAuthStore.setState({ setSession: setSession as never });

    const { getByPlaceholderText, getByText } = await renderScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com or username'), 'alice@example.com');
      fireEvent.changeText(getByPlaceholderText('Your password'), 'abc12345');
    });
    await act(async () => {
      fireEvent.press(getByText('Log in'));
    });

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        emailOrUsername: 'alice@example.com',
        password: 'abc12345',
      }),
    );
    await waitFor(() => expect(setSession).toHaveBeenCalledWith(auth));
  });

  it('shows a form-level error on 401 without crashing', async () => {
    login.mockRejectedValue(new ApiError('Unauthorized', 401));
    const { getByPlaceholderText, getByText } = await renderScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com or username'), 'alice');
      fireEvent.changeText(getByPlaceholderText('Your password'), 'abc12345');
    });
    await act(async () => {
      fireEvent.press(getByText('Log in'));
    });

    await waitFor(() =>
      expect(getByText('Incorrect email/username or password')).toBeTruthy(),
    );
  });
});
