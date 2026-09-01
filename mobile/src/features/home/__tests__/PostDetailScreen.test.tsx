import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PostDetailScreen } from '@/features/home/PostDetailScreen';
import * as postsApi from '@/api/posts';
import * as commentsApi from '@/api/comments';
import type { CommentDto, Page, PostDto } from '@/api/types';

jest.mock('@/api/posts');
jest.mock('@/api/comments');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { postId: 1 } }),
}));

const get = postsApi.get as jest.MockedFunction<typeof postsApi.get>;
const likeFn = postsApi.like as jest.MockedFunction<typeof postsApi.like>;
const list = commentsApi.list as jest.MockedFunction<typeof commentsApi.list>;
const create = commentsApi.create as jest.MockedFunction<typeof commentsApi.create>;

const AUTHOR = { id: 9, username: 'maya', displayName: 'Maya Okafor', avatarUrl: null, bio: null };

const POST: PostDto = {
  id: 1,
  author: AUTHOR,
  content: 'Watching the rings align tonight.',
  privacy: 'PUBLIC',
  feeling: null,
  location: null,
  media: [],
  createdAt: new Date().toISOString(),
  likeCount: 2,
  commentCount: 1,
  shareCount: 0,
  likedByMe: false,
};

const COMMENT: CommentDto = {
  id: 5,
  postId: 1,
  author: { id: 3, username: 'leo', displayName: 'Leo Park', avatarUrl: null, bio: null },
  content: 'Beautiful shot.',
  parentId: null,
  createdAt: new Date().toISOString(),
};

function commentsPage(content: CommentDto[]): Page<CommentDto> {
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
        <PostDetailScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('PostDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    get.mockResolvedValue(POST);
    list.mockResolvedValue(commentsPage([COMMENT]));
  });

  it('renders the post content and an existing comment', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Watching the rings align tonight.')).toBeTruthy());
    expect(getByText('Beautiful shot.')).toBeTruthy();
  });

  it('reverts the displayed like state when the like request fails', async () => {
    likeFn.mockRejectedValue(new Error('nope'));
    const { getByText, getByLabelText } = await renderScreen();
    await waitFor(() => expect(getByText('Watching the rings align tonight.')).toBeTruthy());
    expect(getByText('2')).toBeTruthy();

    fireEvent.press(getByLabelText('Like'));

    await waitFor(() => expect(likeFn).toHaveBeenCalledWith(1));
    await waitFor(() => expect(getByLabelText('Like')).toBeTruthy());
    expect(getByText('2')).toBeTruthy();
  });

  it('submits a new comment and shows it in the list', async () => {
    create.mockResolvedValue({ ...COMMENT, id: 6, content: 'So peaceful.' });
    const { getByText, getByPlaceholderText, getByLabelText } = await renderScreen();
    await waitFor(() => expect(getByText('Beautiful shot.')).toBeTruthy());

    await fireEvent.changeText(getByPlaceholderText('Add a comment…'), 'So peaceful.');
    await fireEvent.press(getByLabelText('Post comment'));

    await waitFor(() => expect(create).toHaveBeenCalledWith(1, 'So peaceful.'));
    await waitFor(() => expect(getByText('So peaceful.')).toBeTruthy());
  });
});
