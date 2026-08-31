import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/useTheme';
import { useAuthStore } from '@/store/useAuthStore';

const RING_SIZE = 176;

export function SplashScreen() {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <ScreenContainer testID="splash-screen" edges={[]}>
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.primaryMuted, gap: theme.space.lg },
        ]}
      >
        <View style={styles.badge}>
          <Animated.View style={[styles.ring, ringStyle]}>
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_SIZE / 2 - 6}
                stroke={theme.colors.primary}
                strokeOpacity={0.35}
                strokeWidth={2}
                strokeDasharray="4 14"
                fill="none"
              />
              <Circle cx={RING_SIZE / 2} cy={6} r={5} fill={theme.colors.accent} />
            </Svg>
          </Animated.View>
          <View style={styles.logo}>
            <Logo size={64} />
          </View>
        </View>
        <Text variant="display" style={styles.word}>
          orbit
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: RING_SIZE, height: RING_SIZE },
  logo: { alignItems: 'center', justifyContent: 'center' },
  word: { letterSpacing: 1 },
});
