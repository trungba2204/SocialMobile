import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ChatScreen } from '@/features/messages/ChatScreen';
import * as conversationsApi from '@/api/conversations';
import { useAuthStore } from '@/store/useAuthStore';
import type { ConversationDto, MessageDto, Page } from '@/api/types';

jest.mock('@/api/conversations');

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: { conversationId: 7 } }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

const get = conversationsApi.get as jest.MockedFunction<typeof conversationsApi.get>;
const messages = conversationsApi.messages as jest.MockedFunction<typeof conversationsApi.messages>;
const send = conversationsApi.send as jest.MockedFunction<typeof conversationsApi.send>;
const markRead = conversationsApi.markRead as jest.MockedFunction<typeof conversationsApi.markRead>;

const ME = { id: 1, username: 'me', displayName: 'Me', avatarUrl: null, bio: null };
const PEER = { id: 2, username: 'maya', displayName: 'Maya Okafor', avatarUrl: null, bio: null };

const CONVERSATION: ConversationDto = {
  id: 7,
  peer: PEER,
  lastMessage: { id: 20, content: 'hi', senderId: 2, createdAt: new Date().toISOString() },
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const SEEDED: MessageDto[] = [
  { id: 20, conversationId: 7, sender: PEER, content: 'Hey there', createdAt: new Date().toISOString() },
  { id: 19, conversationId: 7, sender: ME, content: 'My earlier reply', createdAt: new Date(Date.now() - 1000).toISOString() },
];

function page(content: MessageDto[]): Page<MessageDto> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, last: true };
}

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <ChatScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: ME });
    get.mockResolvedValue(CONVERSATION);
    messages.mockResolvedValue(page(SEEDED));
    markRead.mockResolvedValue(undefined);
  });

  it('renders the peer header and seeded messages with correct alignment', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Maya Okafor')).toBeTruthy());
    await waitFor(() => expect(getByText('Hey there')).toBeTruthy());

    const peerWrap = getByText('Hey there').parent!.parent!;
    expect(StyleSheet.flatten(peerWrap.props.style).alignItems).toBe('flex-start');
    const mineWrap = getByText('My earlier reply').parent!.parent!;
    expect(StyleSheet.flatten(mineWrap.props.style).alignItems).toBe('flex-end');
  });

  it('marks the conversation read on focus', async () => {
    await renderScreen();
    await waitFor(() => expect(markRead).toHaveBeenCalledWith(7));
  });

  it('sends a message: calls send, appends a right-aligned bubble, clears composer', async () => {
    send.mockResolvedValue({
      id: 21,
      conversationId: 7,
      sender: ME,
      content: 'On my way now',
      createdAt: new Date().toISOString(),
    });

    const { getByPlaceholderText, getByLabelText, getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Hey there')).toBeTruthy());

    await fireEvent.changeText(getByPlaceholderText('Message'), 'On my way now');
    await fireEvent.press(getByLabelText('Send message'));

    await waitFor(() => expect(send).toHaveBeenCalledWith(7, 'On my way now'));
    await waitFor(() => expect(getByText('On my way now')).toBeTruthy());
    expect(getByPlaceholderText('Message').props.value).toBe('');

    const wrap = getByText('On my way now').parent!.parent!;
    expect(StyleSheet.flatten(wrap.props.style).alignItems).toBe('flex-end');
  });

  it('shows an empty state when there are no messages', async () => {
    messages.mockResolvedValue(page([]));
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText('Say hello')).toBeTruthy());
  });
});
