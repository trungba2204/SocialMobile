import { StyleSheet, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { relativeTime } from '@/lib/format';
import type { CommentDto } from '@/api/types';

export type CommentRowProps = {
  comment: CommentDto;
  canDelete?: boolean;
  onDelete?: () => void;
  pending?: boolean;
};

export function CommentRow({ comment, canDelete, onDelete, pending }: CommentRowProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { padding: theme.space.lg, gap: theme.space.md, opacity: pending ? 0.5 : 1 },
      ]}
    >
      <Avatar uri={comment.author.avatarUrl} name={comment.author.displayName} size={36} />
      <View style={styles.flex}>
        <View style={[styles.head, { gap: theme.space.sm }]}>
          <Text variant="bodyMed">{comment.author.displayName}</Text>
          <Text variant="metadata" color="textSecondary">
            {relativeTime(comment.createdAt)}
          </Text>
        </View>
        <Text variant="body">{comment.content}</Text>
      </View>
      {canDelete && onDelete ? (
        <IconButton
          icon={Trash2}
          accessibilityLabel="Delete comment"
          size={18}
          color={theme.colors.textSecondary}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center' },
});
