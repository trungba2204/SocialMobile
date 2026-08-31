import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import type { UserDto } from '@/api/types';

export type SearchResultUserProps = {
  user: UserDto;
  onPress: () => void;
};

export function SearchResultUser({ user, onPress }: SearchResultUserProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.row,
        {
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          gap: theme.space.md,
        },
      ]}
    >
      <Avatar uri={user.avatarUrl} name={user.displayName} size={44} />
      <View style={styles.body}>
        <Text variant="bodyMed" numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text variant="metadata" color="textSecondary" numberOfLines={1}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text variant="caption" color="textDim" numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, flexShrink: 1 },
});
