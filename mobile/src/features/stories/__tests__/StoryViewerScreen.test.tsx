import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { StoryViewerScreen } from '@/features/stories/StoryViewerScreen';
import * as storiesApi from '@/api/stories';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import type { StoryReelDto } from '@/api/types';

jest.mock('@/api/stories');

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: { authorId: 7 } }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const reels = storiesApi.reels as jest.MockedFunction<typeof storiesApi.reels>;
const markViewed = storiesApi.markViewed as jest.MockedFunction<typeof storiesApi.markViewed>;
const remove = storiesApi.remove as jest.MockedFunction<typeof storiesApi.remove>;

function user(id: number) {
  return { id, username: `u${id}`, displayName: `User ${id}`, avatarUrl: null, bio: null };
}

function story(id: number) {
  return {
    id,
    author: user(7),
    mediaUrl: `/api/media/story-${id}.jpg`,
    caption: null,
    createdAt: '2026-09-02T00:00:00Z',
    expiresAt: '2026-09-03T00:00:00Z',
    viewedByMe: false,
    viewerCount: 3,
  };
}

const REEL: StoryReelDto = {
  author: user(7),
  stories: [story(1), story(2), story(3)],
  hasUnseen: true,
};

async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <StoryViewerScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('StoryViewerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reels.mockResolvedValue([REEL]);
    markViewed.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    useAuthStore.setState({ user: user(99) as any });
    useUiStore.setState({ toast: null });
  });

  it('renders the first story image and advances through the reel then goes back', async () => {
    const view = await renderScreen();
    await waitFor(() =>
      expect(view.getByTestId('story-image').props.source).toEqual({
        uri: 'http://localhost:8080/api/media/story-1.jpg',
      }),
    );
    expect(view.getByText('1/3')).toBeTruthy();

    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    expect(view.getByText('2/3')).toBeTruthy();
    expect(view.getByTestId('story-image').props.source).toEqual({
      uri: 'http://localhost:8080/api/media/story-2.jpg',
    });

    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    expect(view.getByText('3/3')).toBeTruthy();

    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('auto-advances to the next story once the duration elapses', async () => {
    jest.useFakeTimers();
    try {
      const view = await renderScreen();
      await waitFor(() => expect(view.getByText('1/3')).toBeTruthy());
      await act(async () => {
        jest.advanceTimersByTime(5200);
      });
      expect(view.getByText('2/3')).toBeTruthy();
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('calls markViewed once per story shown', async () => {
    const view = await renderScreen();
    await waitFor(() => expect(markViewed).toHaveBeenCalledWith(1));
    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    expect(markViewed).toHaveBeenCalledWith(2);
    expect(markViewed).toHaveBeenCalledTimes(2);
  });

  it('own reel shows a Delete affordance that calls stories.remove', async () => {
    useAuthStore.setState({ user: user(7) as any });
    const view = await renderScreen();
    await waitFor(() => expect(view.getByLabelText('Delete story')).toBeTruthy());

    await act(async () => {
      fireEvent.press(view.getByLabelText('Delete story'));
    });
    await act(async () => {
      fireEvent.press(view.getByText('Delete'));
    });
    expect(remove).toHaveBeenCalledWith(1);
  });

  it('close button calls navigation.goBack', async () => {
    const view = await renderScreen();
    await waitFor(() => expect(view.getByLabelText('Close story')).toBeTruthy());
    await act(async () => {
      fireEvent.press(view.getByLabelText('Close story'));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('goes back when no reel matches the author', async () => {
    reels.mockResolvedValue([]);
    await renderScreen();
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });
});
