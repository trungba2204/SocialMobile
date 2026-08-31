import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import type { UserDto } from '@/api/types';

export type SuggestionCardProps = {
  user: UserDto;
  requested: boolean;
  onAdd: () => void;
  onPress: () => void;
};

export function SuggestionCard({ user, requested, onAdd, onPress }: SuggestionCardProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={[styles.body, { gap: theme.space.sm }]}>
        <Avatar uri={user.avatarUrl} name={user.displayName} size={56} />
        <Text variant="bodyMed" numberOfLines={1} style={styles.center}>
          {user.displayName}
        </Text>
        <Text variant="metadata" color="textSecondary" numberOfLines={1} style={styles.center}>
          @{user.username}
        </Text>
        <View style={{ marginTop: theme.space.xs }}>
          <Button
            label={requested ? 'Requested' : 'Add friend'}
            variant={requested ? 'secondary' : 'primary'}
            size="sm"
            disabled={requested}
            onPress={onAdd}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
