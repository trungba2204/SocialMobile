import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/theme/useTheme';

export type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
};

/**
 * Shared auth layout: Orbit logo, a subtle concentric orbital-arc backdrop,
 * a title + subtitle, and a slot for the screen's form. Keyboard-avoiding.
 */
export function AuthShell({ title, subtitle, children, footer, testID }: AuthShellProps) {
  const theme = useTheme();

  return (
    <ScreenContainer testID={testID} scroll keyboardAvoiding edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.backdrop}>
        <Svg width={420} height={420} viewBox="0 0 420 420">
          {[80, 140, 200].map((r) => (
            <Circle
              key={r}
              cx={210}
              cy={210}
              r={r}
              stroke={theme.colors.primary}
              strokeOpacity={0.08}
              strokeWidth={1.5}
              fill="none"
            />
          ))}
        </Svg>
      </View>

      <View style={[styles.content, { padding: theme.space.xl, gap: theme.space.xl }]}>
        <View style={{ gap: theme.space.md }}>
          <Logo size={44} />
          <Text variant="display">{title}</Text>
          {subtitle ? (
            <Text variant="body" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: theme.space.lg }}>{children}</View>

        {footer ? <View style={{ gap: theme.space.md }}>{footer}</View> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: -80,
    right: -120,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});
