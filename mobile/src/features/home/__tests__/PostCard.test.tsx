import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PostCard } from '@/features/home/components/PostCard';
import { compactCount } from '@/lib/format';
import type { PostDto } from '@/api/types';

const post: PostDto = {
  id: 1,
  author: { id: 9, username: 'maya', displayName: 'Maya Okafor', avatarUrl: null, bio: null },
  content: 'Watching the rings align tonight.',
  privacy: 'PUBLIC',
  feeling: null,
  location: null,
  media: [],
  createdAt: new Date().toISOString(),
  likeCount: 1240,
  commentCount: 3,
  shareCount: 0,
  likedByMe: false,
};

async function renderCard(overrides: Partial<Parameters<typeof PostCard>[0]> = {}) {
  const props = {
    post,
    onPressPost: jest.fn(),
    onPressAuthor: jest.fn(),
    onToggleLike: jest.fn(),
    onPressComments: jest.fn(),
    onShare: jest.fn(),
    ...overrides,
  };
  const utils = await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <PostCard {...props} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { ...utils, props };
}

describe('PostCard', () => {
  it('renders author, content and the compact like count', async () => {
    const { getByText } = await renderCard();
    expect(getByText('Maya Okafor')).toBeTruthy();
    expect(getByText('Watching the rings align tonight.')).toBeTruthy();
    expect(getByText(compactCount(1240))).toBeTruthy();
  });

  it('toggles like optimistically and reports the next state', async () => {
    const onToggleLike = jest.fn();
    const { getByLabelText, getByText } = await renderCard({ onToggleLike });

    await fireEvent.press(getByLabelText('Like'));
    expect(onToggleLike).toHaveBeenCalledWith(true);
    await waitFor(() => expect(getByText(compactCount(1241))).toBeTruthy());

    await fireEvent.press(getByLabelText('Unlike'));
    expect(onToggleLike).toHaveBeenCalledWith(false);
    await waitFor(() => expect(getByText(compactCount(1240))).toBeTruthy());
  });
});
