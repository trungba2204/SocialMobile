import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/tokens';
import { Text } from '@/components/Text';
import { useUiStore, type Toast as ToastData } from '@/store/useUiStore';

const AUTO_HIDE_MS = 3000;

type ColorKey = {
  [K in keyof ColorTokens]: ColorTokens[K] extends string ? K : never;
}[keyof ColorTokens];

const TONE_COLOR: Record<ToastData['tone'], ColorKey> = {
  neutral: 'secondary',
  success: 'success',
  error: 'error',
};

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!toast) {
      opacity.value = withTiming(0, { duration: 150 });
      return;
    }
    opacity.value = withTiming(1, { duration: 150 });
    const timeout = setTimeout(hideToast, AUTO_HIDE_MS);
    return () => clearTimeout(timeout);
  }, [toast, hideToast, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!toast) return null;

  const bg = theme.colors[TONE_COLOR[toast.tone]];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + theme.space.xl, paddingHorizontal: theme.space.xl },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: bg,
            borderRadius: theme.radius.md,
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.lg,
          },
        ]}
      >
        <Text variant="bodyMed" color="surface">
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
}

export const Toast = ToastHost;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { maxWidth: '100%' },
});
