import { resolveNotification } from '@/navigation/resolveNotification';
import type { NotificationDto, UserDto } from '@/api/types';

const actor: UserDto = {
  id: 4,
  username: 'sam',
  displayName: 'Sam',
  avatarUrl: null,
  bio: null,
};

function makeNotification(over: Partial<NotificationDto>): NotificationDto {
  return {
    id: 1,
    type: 'POST_LIKE',
    actor: null,
    entityType: null,
    entityId: null,
    isRead: false,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('resolveNotification', () => {
  it('routes POST_LIKE to PostDetail with entityId', () => {
    const nav = { navigate: jest.fn() };
    resolveNotification(makeNotification({ type: 'POST_LIKE', entityId: 9 }), nav);
    expect(nav.navigate).toHaveBeenCalledWith('PostDetail', { postId: 9 });
  });

  it('routes FRIEND_REQUEST to UserProfile with actor id', () => {
    const nav = { navigate: jest.fn() };
    resolveNotification(makeNotification({ type: 'FRIEND_REQUEST', actor }), nav);
    expect(nav.navigate).toHaveBeenCalledWith('UserProfile', { userId: 4 });
  });

  it('routes MESSAGE to Messages', () => {
    const nav = { navigate: jest.fn() };
    resolveNotification(makeNotification({ type: 'MESSAGE' }), nav);
    expect(nav.navigate).toHaveBeenCalledWith('Messages', { screen: 'ConversationList' });
  });

  it('no-ops on unknown / STORY_REACTION', () => {
    const nav = { navigate: jest.fn() };
    resolveNotification(makeNotification({ type: 'STORY_REACTION' }), nav);
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});
