import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import * as usersApi from '@/api/users';
import * as friendsApi from '@/api/friends';
import { useAuthStore } from '@/store/useAuthStore';
import type { Page, PostDto, UserProfileDto } from '@/api/types';

jest.mock('@/api/users');
jest.mock('@/api/friends');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { userId: 7 } }),
}));

const getProfile = usersApi.getProfile as jest.MockedFunction<typeof usersApi.getProfile>;
const posts = usersApi.posts as jest.MockedFunction<typeof usersApi.posts>;
const sendRequest = friendsApi.sendRequest as jest.MockedFunction<typeof friendsApi.sendRequest>;

const PROFILE: UserProfileDto = {
  id: 7,
  username: 'ben',
  displayName: 'Ben Carter',
  avatarUrl: null,
  bio: 'Explorer of small things',
  coverUrl: null,
  friendCount: 12,
  postCount: 3,
  friendStatus: 'NONE',
};

const POST: PostDto = {
  id: 99,
  author: { id: 7, username: 'ben', displayName: 'Ben Carter', avatarUrl: null, bio: null },
  content: 'Hello from the profile feed',
  privacy: 'PUBLIC',
  feeling: null,
  location: null,
  media: [],
  createdAt: new Date().toISOString(),
  likeCount: 0,
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
        <ProfileScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('ProfileScreen (other user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 1, username: 'me', displayName: 'Me', avatarUrl: null, bio: null },
    });
    getProfile.mockResolvedValue(PROFILE);
    posts.mockResolvedValue(page([POST]));
    sendRequest.mockResolvedValue({
      id: 5,
      requester: { id: 1, username: 'me', displayName: 'Me', avatarUrl: null, bio: null },
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  });

  it('renders name, bio, counts and a post', async () => {
    const { getAllByText, getByText } = await renderScreen();
    await waitFor(() => expect(getProfile).toHaveBeenCalledWith(7));
    await waitFor(() => expect(getAllByText('Ben Carter').length).toBeGreaterThan(0));
    expect(getByText('Explorer of small things')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    await waitFor(() => expect(getByText('Hello from the profile feed')).toBeTruthy());
  });

  it('pressing "Add friend" sends the request and flips to "Requested"', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Add friend')).toBeTruthy());

    fireEvent.press(getByText('Add friend'));

    await waitFor(() => expect(sendRequest).toHaveBeenCalledWith(7));
    await waitFor(() => expect(getByText('Requested')).toBeTruthy());
  });
});
