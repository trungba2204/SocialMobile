import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { relativeTime } from '@/lib/format';
import type { ConversationDto } from '@/api/types';

export type ConversationRowProps = {
  conversation: ConversationDto;
  onPress: () => void;
};

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const theme = useTheme();
  const { peer, lastMessage, unreadCount, updatedAt } = conversation;
  const unreadRow = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${peer.displayName}`}
      onPress={onPress}
      style={[
        styles.row,
        { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
      ]}
    >
      <Avatar uri={peer.avatarUrl} name={peer.displayName} size={52} />
      <View style={styles.body}>
        <View style={styles.line}>
          <Text variant="bodyMed" numberOfLines={1} style={styles.name}>
            {peer.displayName}
          </Text>
          <Text variant="metadata" color={unreadRow ? 'primary' : 'textDim'}>
            {relativeTime(updatedAt)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text
            variant="caption"
            color={unreadRow ? 'textPrimary' : 'textSecondary'}
            numberOfLines={1}
            style={styles.preview}
          >
            {lastMessage?.content ?? 'No messages yet'}
          </Text>
          {unreadRow ? <Badge count={unreadCount} color={theme.colors.primary} /> : null}
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
});
