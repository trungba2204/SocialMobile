import { StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.space.xl, gap: theme.space.md }]}>
      <TriangleAlert size={40} color={theme.colors.error} />
      <Text variant="body" color="textSecondary" style={styles.center}>
        {message}
      </Text>
      <Button label="Try again" onPress={onRetry} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
