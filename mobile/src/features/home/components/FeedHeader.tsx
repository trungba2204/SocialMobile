import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, MessageSquare, Bell } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { IconButton } from '@/components/IconButton';
import { useUiStore } from '@/store/useUiStore';

export function FeedHeader() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const unread = useUiStore((s) => s.unreadNotifications);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          gap: theme.space.sm,
        },
      ]}
    >
      <View style={[styles.brand, { gap: theme.space.sm }]}>
        <Logo size={26} />
        <Text variant="heading">orbit</Text>
      </View>
      <View style={styles.actions}>
        <IconButton
          icon={Search}
          accessibilityLabel="Search"
          onPress={() => navigation.navigate('SearchModal')}
        />
        <IconButton
          icon={MessageSquare}
          accessibilityLabel="Messages"
          onPress={() => navigation.navigate('Messages')}
        />
        <IconButton
          icon={Bell}
          accessibilityLabel="Notifications"
          badgeCount={unread}
          onPress={() => navigation.navigate('NotificationsTab')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
