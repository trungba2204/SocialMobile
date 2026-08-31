import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Users, Plus, Bell, User, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Badge } from '@/components/Badge';
import { useUiStore } from '@/store/useUiStore';

const ICONS: Record<string, LucideIcon> = {
  HomeTab: Home,
  FriendsTab: Users,
  CreateTab: Plus,
  NotificationsTab: Bell,
  ProfileTab: User,
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  FriendsTab: 'Friends',
  CreateTab: 'Create',
  NotificationsTab: 'Alerts',
  ProfileTab: 'You',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const unread = useUiStore((s) => s.unreadNotifications);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, theme.space.sm),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name] ?? Home;
        const isCreate = route.name === 'CreateTab';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (isCreate) {
            navigation.getParent()?.navigate('CreatePost');
            return;
          }
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        if (isCreate) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel="Create"
              onPress={onPress}
              style={styles.slot}
            >
              <View style={[styles.createPill, { backgroundColor: theme.colors.primary }]}>
                <View
                  style={[styles.createPillAccent, { backgroundColor: theme.colors.accent }]}
                />
                <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Pressable>
          );
        }

        const tint = focused ? theme.colors.primary : theme.colors.textDim;
        const showBadge = route.name === 'NotificationsTab' && unread > 0;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name] ?? route.name}
            onPress={onPress}
            style={styles.slot}
          >
            <View>
              <Icon size={22} color={tint} />
              {showBadge ? (
                <View style={styles.badge}>
                  <Badge count={unread} />
                </View>
              ) : null}
            </View>
            <Text variant="metadata" style={{ color: tint }}>
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  badge: { position: 'absolute', top: -6, right: -10 },
  createPill: {
    width: 54,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: -14,
  },
  createPillAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 19,
    opacity: 0.55,
  },
});
