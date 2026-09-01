import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { haptics } from '@/lib/haptics';

export type SettingsRowProps = {
  label: string;
  icon?: LucideIcon;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  rightElement?: ReactNode;
};

export function SettingsRow({
  label,
  icon: Icon,
  value,
  onPress,
  danger = false,
  disabled = false,
  rightElement,
}: SettingsRowProps) {
  const theme = useTheme();
  const labelColor = danger ? 'error' : 'textPrimary';
  const iconColor = danger ? theme.colors.error : theme.colors.textSecondary;

  const handlePress = onPress
    ? () => {
        haptics.selection();
        onPress();
      }
    : undefined;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || !onPress }}
      disabled={disabled || !handlePress}
      onPress={handlePress}
      style={[
        styles.row,
        {
          paddingVertical: theme.space.md,
          paddingHorizontal: theme.space.lg,
          gap: theme.space.md,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {Icon ? <Icon size={20} color={iconColor} /> : null}
      <View style={styles.labelWrap}>
        <Text variant="body" color={labelColor}>
          {label}
        </Text>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <View style={[styles.right, { gap: theme.space.xs }]}>
          {value ? (
            <Text variant="body" color="textSecondary">
              {value}
            </Text>
          ) : null}
          {handlePress ? <ChevronRight size={18} color={theme.colors.textDim} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  labelWrap: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
});
