// M2: stories are mock data until the Story API ships.
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

export type StoryProgressBarProps = {
  /** Number of segments (one per story of the current author). */
  count: number;
  /** Index of the segment currently playing. */
  activeIndex: number;
  /** 0..1 fill of the active segment, driven by the viewer timer. */
  progress: SharedValue<number>;
};

export function StoryProgressBar({ count, activeIndex, progress }: StoryProgressBarProps) {
  const theme = useTheme();

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, progress.value)) * 100}%`,
  }));

  return (
    <View style={[styles.row, { gap: theme.space.xs }]} testID="story-progress-bar">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: theme.radius.pill }]}
        >
          {i < activeIndex ? (
            <View style={[styles.fill, { width: '100%', backgroundColor: theme.colors.onPrimary }]} />
          ) : i === activeIndex ? (
            <Animated.View style={[styles.fill, { backgroundColor: theme.colors.onPrimary }, fillStyle]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  track: { flex: 1, height: 3, overflow: 'hidden' },
  fill: { height: '100%' },
});
