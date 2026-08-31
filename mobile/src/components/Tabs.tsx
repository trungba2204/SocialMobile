import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type LayoutRectangle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';

export type TabItem = { key: string; label: string };

export type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  const theme = useTheme();
  const layouts = useRef<Record<string, LayoutRectangle>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);

  const sync = (key: string) => {
    const l = layouts.current[key];
    if (!l) return;
    x.value = withTiming(l.x, { duration: 180 });
    width.value = withTiming(l.width, { duration: 180 });
  };

  useEffect(() => {
    sync(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: width.value,
  }));

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.row}>
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(t.key)}
              onLayout={(e) => {
                layouts.current[t.key] = e.nativeEvent.layout;
                if (isActive) sync(t.key);
              }}
              style={[styles.tab, { paddingVertical: theme.space.md, paddingHorizontal: theme.space.lg }]}
            >
              <Text variant="bodyMed" color={isActive ? 'textPrimary' : 'textSecondary'}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Animated.View
        style={[styles.underline, { backgroundColor: theme.colors.primary }, underlineStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row' },
  tab: { alignItems: 'center' },
  underline: { position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 2 },
});
