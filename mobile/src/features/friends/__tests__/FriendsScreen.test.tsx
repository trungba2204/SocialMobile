import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { FriendsScreen } from '@/features/friends/FriendsScreen';
import * as friendsApi from '@/api/friends';
import type { FriendRequestDto, Page, UserDto } from '@/api/types';

jest.mock('@/api/friends');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const list = friendsApi.list as jest.MockedFunction<typeof friendsApi.list>;
const requests = friendsApi.requests as jest.MockedFunction<typeof friendsApi.requests>;
const suggestions = friendsApi.suggestions as jest.MockedFunction<typeof friendsApi.suggestions>;
const accept = friendsApi.accept as jest.MockedFunction<typeof friendsApi.accept>;

const USER: UserDto = { id: 5, username: 'kai', displayName: 'Kai Mercer', avatarUrl: null, bio: null };
const REQUEST: FriendRequestDto = {
  id: 11,
  requester: { id: 8, username: 'nova', displayName: 'Nova Reyes', avatarUrl: null, bio: null },
  status: 'PENDING',
  createdAt: new Date().toISOString(),
};

function page<T>(content: T[]): Page<T> {
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
        <FriendsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    list.mockResolvedValue(page([USER]));
    requests.mockResolvedValue(page([REQUEST]));
    suggestions.mockResolvedValue([]);
    accept.mockResolvedValue(undefined);
  });

  it('loads friends.list on the default tab', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(list).toHaveBeenCalledWith(0));
    await waitFor(() => expect(getByText('Kai Mercer')).toBeTruthy());
  });

  it('loads friends.requests when switching to the Requests tab', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Kai Mercer')).toBeTruthy());

    fireEvent.press(getByText('Requests'));
    await waitFor(() => expect(requests).toHaveBeenCalledWith(0));
    await waitFor(() => expect(getByText('Nova Reyes')).toBeTruthy());
  });

  it('accepts a request: calls friends.accept and removes the row', async () => {
    const { getByText, queryByText } = await renderScreen();
    await waitFor(() => expect(getByText('Kai Mercer')).toBeTruthy());

    fireEvent.press(getByText('Requests'));
    await waitFor(() => expect(getByText('Nova Reyes')).toBeTruthy());

    fireEvent.press(getByText('Accept'));
    await waitFor(() => expect(accept).toHaveBeenCalledWith(11));
    await waitFor(() => expect(queryByText('Nova Reyes')).toBeNull());
  });
});
