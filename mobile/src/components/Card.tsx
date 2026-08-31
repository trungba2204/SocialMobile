import { type ReactNode } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/tokens';
import { PressableScale } from '@/components/PressableScale';

type ColorKey = {
  [K in keyof ColorTokens]: ColorTokens[K] extends string ? K : never;
}[keyof ColorTokens];

export type CardProps = {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  padded?: boolean;
  leadingAccent?: ColorKey;
};

const ACCENT_WIDTH = 3;

export function Card({ children, onPress, padded = true, leadingAccent }: CardProps) {
  const theme = useTheme();

  const containerStyle = [
    styles.base,
    {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    theme.shadow(theme.scheme),
  ];

  const inner = (
    <View style={styles.row}>
      {leadingAccent ? (
        <View style={[styles.accent, { backgroundColor: theme.colors[leadingAccent] }]} />
      ) : null}
      <View style={[styles.content, padded && { padding: theme.space.lg }]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" onPress={onPress} style={containerStyle}>
        {inner}
      </PressableScale>
    );
  }

  return <View style={containerStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  accent: { width: ACCENT_WIDTH },
  content: { flex: 1 },
});
