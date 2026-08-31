import type { NotificationDto } from '@/api/types';

export type Navigator = {
  navigate: (name: string, params?: object) => void;
};

/**
 * Route to the relevant screen for a tapped notification.
 * See Design §2.
 */
export function resolveNotification(n: NotificationDto, nav: Navigator): void {
  switch (n.type) {
    case 'POST_LIKE':
    case 'POST_COMMENT':
    case 'POST_SHARE': {
      if (n.entityId != null) nav.navigate('PostDetail', { postId: n.entityId });
      return;
    }
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED': {
      const userId = n.actor?.id ?? n.entityId;
      if (userId != null) nav.navigate('UserProfile', { userId });
      return;
    }
    case 'MESSAGE': {
      nav.navigate('Messages', { screen: 'ConversationList' });
      return;
    }
    default:
      return;
  }
}
