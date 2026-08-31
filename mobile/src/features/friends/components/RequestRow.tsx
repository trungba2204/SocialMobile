import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import type { FriendRequestDto } from '@/api/types';

export type RequestRowProps = {
  request: FriendRequestDto;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  pending: boolean;
  onPress?: () => void;
};

export function RequestRow({ request, onAccept, onReject, pending, onPress }: RequestRowProps) {
  const theme = useTheme();
  const { requester } = request;
  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.identity, { gap: theme.space.md }]}
      >
        <Avatar uri={requester.avatarUrl} name={requester.displayName} size={44} />
        <View style={styles.flexShrink}>
          <Text variant="bodyMed" numberOfLines={1}>
            {requester.displayName}
          </Text>
          <Text variant="metadata" color="textSecondary" numberOfLines={1}>
            @{requester.username}
          </Text>
        </View>
      </Pressable>
      <View style={[styles.actions, { gap: theme.space.sm }]}>
        <Button
          label="Accept"
          size="sm"
          disabled={pending}
          onPress={() => onAccept(request.id)}
        />
        <Button
          label="Decline"
          variant="secondary"
          size="sm"
          disabled={pending}
          onPress={() => onReject(request.id)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  flexShrink: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
