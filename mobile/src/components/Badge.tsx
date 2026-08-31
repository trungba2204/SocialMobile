import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';

export type BadgeProps = {
  count?: number;
  dot?: boolean;
  color?: string;
};

export function Badge({ count, dot = false, color }: BadgeProps) {
  const theme = useTheme();
  const bg = color ?? theme.colors.error;

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: bg, borderColor: theme.colors.background },
        ]}
      />
    );
  }

  if (typeof count !== 'number' || count <= 0) return null;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: theme.colors.background, paddingHorizontal: theme.space.xs },
      ]}
    >
      <Text variant="metadata" color="surface">
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  pill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
