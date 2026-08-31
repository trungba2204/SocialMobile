import { Pressable, StyleSheet, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import type { UserDto } from '@/api/types';

export type UserRowProps = {
  user: UserDto;
  onPress: () => void;
  onMessage?: () => void;
  onMore?: () => void;
};

export function UserRow({ user, onPress, onMessage, onMore }: UserRowProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.identity, { gap: theme.space.md }]}
      >
        <Avatar uri={user.avatarUrl} name={user.displayName} size={44} />
        <View style={styles.flexShrink}>
          <Text variant="bodyMed" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text variant="metadata" color="textSecondary" numberOfLines={1}>
            @{user.username}
          </Text>
        </View>
      </Pressable>
      {onMessage ? (
        <Button label="Message" variant="secondary" size="sm" onPress={onMessage} />
      ) : null}
      {onMore ? (
        <IconButton icon={MoreHorizontal} accessibilityLabel="More options" onPress={onMore} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  flexShrink: { flexShrink: 1 },
});
