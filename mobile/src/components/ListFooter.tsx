import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export type ListFooterProps = {
  loading?: boolean;
  end?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

export function ListFooter({ loading, end, error, onRetry }: ListFooterProps) {
  const theme = useTheme();

  if (!loading && !end && !error) return null;

  return (
    <View style={[styles.container, { padding: theme.space.lg }]}>
      {error ? (
        <Button label="Retry" onPress={() => onRetry?.()} variant="ghost" size="sm" />
      ) : loading ? (
        <ActivityIndicator color={theme.colors.textSecondary} />
      ) : (
        <Text variant="caption" color="textDim">
          You’re all caught up
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
