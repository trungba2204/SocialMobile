import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';
import * as notificationsApi from '@/api/notifications';
import { useUiStore } from '@/store/useUiStore';
import type { NotificationDto, Page } from '@/api/types';

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

const list = notificationsApi.list as jest.MockedFunction<typeof notificationsApi.list>;
const markRead = notificationsApi.markRead as jest.MockedFunction<typeof notificationsApi.markRead>;
const markAllRead = notificationsApi.markAllRead as jest.MockedFunction<
  typeof notificationsApi.markAllRead
>;

const ACTOR = { id: 7, username: 'ben', displayName: 'Ben Carter', avatarUrl: null, bio: null };

const NOTIFS: NotificationDto[] = [
  {
    id: 1,
    type: 'POST_COMMENT',
    actor: ACTOR,
    entityType: 'POST',
    entityId: 42,
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'FRIEND_ACCEPTED',
    actor: { id: 9, username: 'mara', displayName: 'Mara Vance', avatarUrl: null, bio: null },
    entityType: 'USER',
    entityId: 9,
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

function page(content: NotificationDto[]): Page<NotificationDto> {
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
        <NotificationsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({ unreadNotifications: 0 });
    list.mockResolvedValue({ page: page(NOTIFS), unread: 2 });
    markRead.mockResolvedValue(undefined);
    markAllRead.mockResolvedValue(undefined);
  });

  it('loads and renders a page from notifications.list', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(list).toHaveBeenCalledWith(0));
    await waitFor(() => expect(getByText(/commented on your post/)).toBeTruthy());
  });

  it('pushes unread count to the ui store on focus', async () => {
    await renderScreen();
    await waitFor(() => expect(useUiStore.getState().unreadNotifications).toBe(2));
  });

  it('tapping a POST_COMMENT row marks it read then deep-links to PostDetail', async () => {
    const { getByText } = await renderScreen();
    await waitFor(() => expect(getByText(/commented on your post/)).toBeTruthy());

    fireEvent.press(getByText(/commented on your post/));

    await waitFor(() => expect(markRead).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('PostDetail', { postId: 42 });
  });

  it('"Mark all read" calls markAllRead and clears the unread dots', async () => {
    const { getByText, queryAllByTestId } = await renderScreen();
    await waitFor(() => expect(getByText(/commented on your post/)).toBeTruthy());
    expect(queryAllByTestId('unread-dot').length).toBe(2);

    fireEvent.press(getByText('Mark all read'));

    await waitFor(() => expect(markAllRead).toHaveBeenCalled());
    await waitFor(() => expect(queryAllByTestId('unread-dot').length).toBe(0));
    expect(useUiStore.getState().unreadNotifications).toBe(0);
  });
});
