import { ActivityIndicator, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import type { Theme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { haptics } from '@/lib/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  fullWidth?: boolean;
};

type FgToken = 'surface' | 'textPrimary' | 'primary';
type VariantStyle = { bg: string; fg: FgToken; border?: string };

function variantStyle(theme: Theme, variant: ButtonVariant): VariantStyle {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return { bg: c.card, fg: 'textPrimary', border: c.border };
    case 'ghost':
      return { bg: 'transparent', fg: 'primary' };
    case 'danger':
      return { bg: c.error, fg: 'surface' };
    case 'primary':
    default:
      return { bg: c.primary, fg: 'surface' };
  }
}

function sizeStyle(theme: Theme, size: ButtonSize) {
  switch (size) {
    case 'sm':
      return { paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg, minHeight: 44 };
    case 'lg':
      return { paddingVertical: theme.space.lg, paddingHorizontal: theme.space.xl, minHeight: 56 };
    case 'md':
    default:
      return { paddingVertical: theme.space.md, paddingHorizontal: theme.space.xl, minHeight: 48 };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const blocked = disabled || loading;
  const v = variantStyle(theme, variant);
  const s = sizeStyle(theme, size);
  const fgColor = theme.colors[v.fg];

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={(e) => {
        if (blocked) return;
        haptics.light();
        onPress?.(e);
      }}
      style={[
        styles.base,
        s,
        {
          backgroundColor: v.bg,
          borderRadius: theme.radius.md,
          borderWidth: v.border ? StyleSheet.hairlineWidth : 0,
          borderColor: v.border,
          opacity: blocked && !loading ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fgColor} />
        ) : (
          <>
            {LeftIcon ? <LeftIcon size={18} color={fgColor} /> : null}
            <Text variant="button" color={v.fg}>
              {label}
            </Text>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
