import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ setSession: jest.fn() as never });
  });

  it('blocks a bad username client-side before any network call', async () => {
    const { getByPlaceholderText, getByText } = await renderScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@example.com');
      fireEvent.changeText(getByPlaceholderText('your_handle'), 'AB');
      fireEvent.changeText(getByPlaceholderText('How your name appears'), 'Alice');
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'abc12345');
    });
    await act(async () => {
      fireEvent.press(getByText('Create account'));
    });

    await waitFor(() => expect(getByText(/lowercase/i)).toBeTruthy());
    expect(register).not.toHaveBeenCalled();
  });

  it('surfaces a 409 message on the username field', async () => {
    register.mockRejectedValue(new ApiError('Username is already taken', 409));
    const { getByPlaceholderText, getByText } = await renderScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@example.com');
      fireEvent.changeText(getByPlaceholderText('your_handle'), 'alice_1');
      fireEvent.changeText(getByPlaceholderText('How your name appears'), 'Alice');
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'abc12345');
    });
    await act(async () => {
      fireEvent.press(getByText('Create account'));
    });

    await waitFor(() => expect(register).toHaveBeenCalled());
    await waitFor(() => expect(getByText('Username is already taken')).toBeTruthy());
  });
});
