import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { relativeTime } from '@/lib/format';
import type { NotificationDto, NotificationType } from '@/api/types';

const PHRASES: Record<NotificationType, string> = {
  POST_LIKE: 'liked your post',
  POST_COMMENT: 'commented on your post',
  POST_SHARE: 'shared your post',
  FRIEND_REQUEST: 'sent you a friend request',
  FRIEND_ACCEPTED: 'accepted your friend request',
  MESSAGE: 'sent you a message',
  STORY_REACTION: 'reacted to your story',
};

export type NotificationRowProps = {
  n: NotificationDto;
  onPress: () => void;
};

export function NotificationRow({ n, onPress }: NotificationRowProps) {
  const theme = useTheme();
  const name = n.actor?.displayName ?? 'Someone';
  const phrase = PHRASES[n.type];

  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.row,
        {
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          gap: theme.space.md,
          backgroundColor: n.isRead ? 'transparent' : theme.colors.primaryMuted,
        },
      ]}
    >
      <Avatar uri={n.actor?.avatarUrl ?? null} name={name} size={44} />
      <View style={[styles.body, { gap: theme.space.xs }]}>
        <Text variant="body" color="textPrimary">
          <Text variant="bodyMed" color="textPrimary">
            {name}
          </Text>{' '}
          {phrase}
        </Text>
        <Text variant="metadata" color="textDim">
          {relativeTime(n.createdAt)}
        </Text>
      </View>
      {!n.isRead ? (
        <View
          testID="unread-dot"
          style={[styles.dot, { backgroundColor: theme.colors.primary }]}
        />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
