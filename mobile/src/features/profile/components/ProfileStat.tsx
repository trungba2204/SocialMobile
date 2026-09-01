import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { compactCount } from '@/lib/format';

export type ProfileStatProps = {
  label: string;
  value: number;
  onPress?: () => void;
};

export function ProfileStat({ label, value, onPress }: ProfileStatProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.container, { gap: theme.space.xs, paddingRight: theme.space.xl }]}
    >
      <Text variant="title" color="textPrimary">
        {compactCount(value)}
      </Text>
      <Text variant="metadata" color="textSecondary">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline' },
});
