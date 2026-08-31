import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CreatePostScreen } from '@/features/post/CreatePostScreen';
import * as postsApi from '@/api/posts';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';

jest.mock('@/api/posts');

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

const create = postsApi.create as jest.MockedFunction<typeof postsApi.create>;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <CreatePostScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('CreatePostScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 1, username: 'alice', displayName: 'Alice', avatarUrl: null, bio: null },
    });
    useUiStore.setState({ toast: null });
    create.mockResolvedValue({ id: 9 } as never);
  });

  it('disables Publish with no content and no media, enables it after typing', async () => {
    const { getByLabelText } = await renderScreen();

    expect(getByLabelText('Publish').props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByLabelText('Post content'), 'Hello orbit');

    await waitFor(() =>
      expect(getByLabelText('Publish').props.accessibilityState.disabled).toBe(false),
    );
  });

  it('publishes and navigates back with a toast on success', async () => {
    const { getByLabelText } = await renderScreen();

    await fireEvent.changeText(getByLabelText('Post content'), 'Hello orbit');
    await fireEvent.press(getByLabelText('Publish'));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello orbit', privacy: 'PUBLIC', media: [] }),
      ),
    );
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    expect(useUiStore.getState().toast?.message).toBe('Posted');
  });
});
