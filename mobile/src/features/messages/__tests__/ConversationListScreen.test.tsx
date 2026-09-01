import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ConversationListScreen } from '@/features/messages/ConversationListScreen';
import * as conversationsApi from '@/api/conversations';
import { ApiError } from '@/api/errors';
import type { ConversationDto, Page } from '@/api/types';

jest.mock('@/api/conversations');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

const list = conversationsApi.list as jest.MockedFunction<typeof conversationsApi.list>;

const PEER = { id: 2, username: 'maya', displayName: 'Maya Okafor', avatarUrl: null, bio: null };

const CONVERSATIONS: ConversationDto[] = [
  {
    id: 7,
    peer: PEER,
    lastMessage: { id: 20, content: 'See you tomorrow', senderId: 2, createdAt: new Date().toISOString() },
    unreadCount: 2,
    updatedAt: new Date().toISOString(),
  },
];

function page(content: ConversationDto[]): Page<ConversationDto> {
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
        <ConversationListScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('ConversationListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    list.mockResolvedValue(page(CONVERSATIONS));
  });

  it('renders rows from conversations.list', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(list).toHaveBeenCalledWith(0));
    await waitFor(() => expect(getByText('Maya Okafor')).toBeTruthy());
    expect(getByText('See you tomorrow')).toBeTruthy();
  });

  it('tapping a row navigates to Chat with a numeric conversationId', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Maya Okafor')).toBeTruthy());

    fireEvent.press(getByText('Maya Okafor'));

    expect(mockNavigate).toHaveBeenCalledWith('Messages', {
      screen: 'Chat',
      params: { conversationId: 7 },
    });
  });

  it('shows the empty state when there are no conversations', async () => {
    list.mockResolvedValue(page([]));
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('No conversations yet')).toBeTruthy());
  });

  it('shows the error state when the list request fails', async () => {
    list.mockRejectedValue(new ApiError('No connection', 0));
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('No connection')).toBeTruthy());
  });
});
