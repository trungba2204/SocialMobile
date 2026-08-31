import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';

export type IconButtonProps = {
  icon: LucideIcon;
  onPress?: (e: GestureResponderEvent) => void;
  size?: number;
  color?: string;
  badgeCount?: number;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function IconButton({
  icon: Icon,
  onPress,
  size = 22,
  color,
  badgeCount,
  accessibilityLabel,
  disabled,
}: IconButtonProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.textPrimary;
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={theme.hitSlop}
      onPress={onPress}
      style={[styles.hit, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View>
        <Icon size={size} color={tint} />
        {showBadge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.error, borderColor: theme.colors.background },
            ]}
          >
            <Text variant="metadata" color="surface">
              {badgeCount > 99 ? '99+' : String(badgeCount)}
            </Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
