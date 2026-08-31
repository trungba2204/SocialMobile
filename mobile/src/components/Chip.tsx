import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  leftIcon?: LucideIcon;
};

export function Chip({ label, selected = false, onPress, leftIcon: LeftIcon }: ChipProps) {
  const theme = useTheme();
  const bg = selected ? theme.colors.primary : theme.colors.card;
  const fg = selected ? 'surface' : 'textSecondary';
  const fgColor = theme.colors[selected ? 'surface' : 'textSecondary'];

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!onPress}
      hitSlop={theme.hitSlop}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.space.sm,
          paddingHorizontal: theme.space.lg,
        },
      ]}
    >
      <View style={styles.row}>
        {LeftIcon ? <LeftIcon size={16} color={fgColor} /> : null}
        <Text variant="metadata" color={fg}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
