import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.space.xl, gap: theme.space.md }]}>
      <Icon size={40} color={theme.colors.textDim} />
      <Text variant="title" color="textPrimary" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textSecondary" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.space.sm }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
