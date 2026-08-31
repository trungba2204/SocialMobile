import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { FeedScreen } from '@/features/home/FeedScreen';
import * as postsApi from '@/api/posts';
import * as notificationsApi from '@/api/notifications';
import { ApiError } from '@/api/errors';
import type { NotificationDto, Page, PostDto } from '@/api/types';

jest.mock('@/api/posts');
jest.mock('@/api/notifications');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

const feed = postsApi.feed as jest.MockedFunction<typeof postsApi.feed>;
const list = notificationsApi.list as jest.MockedFunction<typeof notificationsApi.list>;

const POST: PostDto = {
  id: 1,
  author: { id: 9, username: 'maya', displayName: 'Maya Okafor', avatarUrl: null, bio: null },
  content: 'Watching the rings align tonight.',
  privacy: 'PUBLIC',
  feeling: null,
  location: null,
  media: [],
  createdAt: new Date().toISOString(),
  likeCount: 2,
  commentCount: 0,
  shareCount: 0,
  likedByMe: false,
};

function page(content: PostDto[]): Page<PostDto> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, last: true };
}

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <FeedScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('FeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    list.mockResolvedValue({
      page: { content: [] as NotificationDto[], page: 0, size: 20, totalElements: 0, totalPages: 1, last: true },
      unread: 0,
    });
  });

  it('shows a skeleton then renders the loaded post', async () => {
    let resolve!: (v: Page<PostDto>) => void;
    feed.mockReturnValue(new Promise<Page<PostDto>>((r) => { resolve = r; }));

    const { getByText, queryByText, getByTestId } = await renderScreen();
    expect(getByTestId('feed-skeleton')).toBeTruthy();
    expect(queryByText('Watching the rings align tonight.')).toBeNull();

    resolve(page([POST]));
    await waitFor(() => expect(getByText('Watching the rings align tonight.')).toBeTruthy());
  });

  it('shows an ErrorState on failure and retries', async () => {
    feed.mockRejectedValueOnce(new ApiError('No connection', 0));
    feed.mockResolvedValueOnce(page([POST]));

    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('No connection')).toBeTruthy());

    await fireEvent.press(getByText('Try again'));
    await waitFor(() => expect(getByText('Watching the rings align tonight.')).toBeTruthy());
    expect(feed).toHaveBeenCalledTimes(2);
  });
});
