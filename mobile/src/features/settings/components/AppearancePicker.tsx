import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { haptics } from '@/lib/haptics';
import { useUiStore, type ThemePref } from '@/store/useUiStore';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function AppearancePicker() {
  const theme = useTheme();
  const themePreference = useUiStore((s) => s.themePreference);
  const setThemePreference = useUiStore((s) => s.setThemePreference);

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.space.xs,
          gap: theme.space.xs,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const selected = themePreference === opt.value;
        return (
          <PressableScale
            key={opt.value}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.selection();
              setThemePreference(opt.value);
            }}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? theme.colors.card : 'transparent',
                borderRadius: theme.radius.sm,
                paddingVertical: theme.space.xs,
                paddingHorizontal: theme.space.sm,
              },
            ]}
          >
            <Text variant="metadata" color={selected ? 'textPrimary' : 'textSecondary'}>
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth },
  segment: { alignItems: 'center', justifyContent: 'center' },
});
