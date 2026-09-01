import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import type { NotificationDto } from '@/api/types';

const ACTOR = { id: 7, username: 'ben', displayName: 'Ben Carter', avatarUrl: null, bio: null };

function notif(over: Partial<NotificationDto>): NotificationDto {
  return {
    id: 1,
    type: 'POST_LIKE',
    actor: ACTOR,
    entityType: 'POST',
    entityId: 42,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('renders a POST_LIKE sentence with the actor name', async () => {
  const { getByText } = await wrap(<NotificationRow n={notif({ type: 'POST_LIKE' })} onPress={jest.fn()} />);
  expect(getByText(/Ben Carter/)).toBeTruthy();
  expect(getByText(/liked your post/)).toBeTruthy();
});

it('renders a FRIEND_ACCEPTED sentence', async () => {
  const { getByText } = await wrap(
    <NotificationRow n={notif({ type: 'FRIEND_ACCEPTED' })} onPress={jest.fn()} />,
  );
  expect(getByText(/accepted your friend request/)).toBeTruthy();
});

it('shows an unread dot when not read, hides it when read', async () => {
  const unread = await wrap(<NotificationRow n={notif({ isRead: false })} onPress={jest.fn()} />);
  expect(unread.getByTestId('unread-dot')).toBeTruthy();

  const read = await wrap(<NotificationRow n={notif({ isRead: true })} onPress={jest.fn()} />);
  expect(read.queryByTestId('unread-dot')).toBeNull();
});
