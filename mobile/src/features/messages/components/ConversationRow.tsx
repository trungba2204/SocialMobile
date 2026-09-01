// M3: messaging is mock data until the Conversation/Message API + STOMP ship.
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { relativeTime } from '@/lib/format';
import type { MockConversation } from '@/mock/conversations';

export type ConversationRowProps = {
  conversation: MockConversation;
  onPress: () => void;
};

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const theme = useTheme();
  const { peer, lastMessage, lastAt, unread, online } = conversation;
  const unreadRow = unread > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${peer.name}`}
      onPress={onPress}
      style={[
        styles.row,
        { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
      ]}
    >
      <View>
        <Avatar uri={peer.avatarUrl} name={peer.name} size={52} />
        {online ? (
          <View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.success, borderColor: theme.colors.background },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text variant="bodyMed" numberOfLines={1} style={styles.name}>
            {peer.name}
          </Text>
          <Text variant="metadata" color={unreadRow ? 'primary' : 'textDim'}>
            {relativeTime(lastAt)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text
            variant="caption"
            color={unreadRow ? 'textPrimary' : 'textSecondary'}
            numberOfLines={1}
            style={styles.preview}
          >
            {lastMessage}
          </Text>
          {unreadRow ? <Badge count={unread} color={theme.colors.primary} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flexShrink: 1 },
  preview: { flexShrink: 1 },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
});
