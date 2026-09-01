import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { EditProfileScreen } from '@/features/profile/EditProfileScreen';
import * as usersApi from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { ApiError } from '@/api/errors';

jest.mock('@/api/users');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

const uploadAvatar = usersApi.uploadAvatar as jest.MockedFunction<typeof usersApi.uploadAvatar>;

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <EditProfileScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 1, username: 'me', displayName: 'Me', avatarUrl: null, bio: null } as any,
  });
  useUiStore.setState({ toast: null });
});

it('avatar upload failure shows a toast and does not patch the user', async () => {
  uploadAvatar.mockRejectedValueOnce(new ApiError('boom', 500));
  const { getByLabelText } = await renderScreen();

  fireEvent.press(getByLabelText('Change profile photo'));

  await waitFor(() => expect(useUiStore.getState().toast?.tone).toBe('error'));
  expect(useUiStore.getState().toast?.message).toBe('Could not upload photo');
  expect(useAuthStore.getState().user?.avatarUrl).toBeNull();
});

it('surfaces the backend 400 message for a non-image file', async () => {
  uploadAvatar.mockRejectedValueOnce(new ApiError('File must be an image', 400));
  const { getByLabelText } = await renderScreen();

  fireEvent.press(getByLabelText('Change profile photo'));

  await waitFor(() =>
    expect(useUiStore.getState().toast?.message).toBe('File must be an image'),
  );
  expect(useAuthStore.getState().user?.avatarUrl).toBeNull();
});

it('on success patches the user with the server-returned url', async () => {
  uploadAvatar.mockResolvedValueOnce({ url: '/api/media/avatars/xyz.png' });
  const { getByLabelText } = await renderScreen();

  fireEvent.press(getByLabelText('Change profile photo'));

  await waitFor(() =>
    expect(useAuthStore.getState().user?.avatarUrl).toBe('/api/media/avatars/xyz.png'),
  );
});
