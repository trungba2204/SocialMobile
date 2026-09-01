import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BellOff } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { Divider } from '@/components/Divider';
import { PressableScale } from '@/components/PressableScale';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import * as notifications from '@/api/notifications';
import { useUiStore } from '@/store/useUiStore';
import { resolveNotification } from '@/navigation/resolveNotification';
import type { NotificationDto } from '@/api/types';
import { NotificationRow } from './components/NotificationRow';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function SkeletonList() {
  const theme = useTheme();
  return (
    <View testID="notifications-skeleton">
      {SKELETON_ROWS.map((i) => (
        <View
          key={i}
          style={[styles.skelRow, { padding: theme.space.lg, gap: theme.space.md }]}
        >
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ gap: theme.space.xs }}>
            <Skeleton width={180} height={12} />
            <Skeleton width={60} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const showToast = useUiStore((s) => s.showToast);

  const { items, loading, refreshing, error, endReached, refresh, loadMore, setItems } =
    usePagedQuery<NotificationDto>(
      useCallback((page) => notifications.list(page).then((r) => r.page), []),
    );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notifications
        .list(0)
        .then(({ unread }) => {
          if (active) useUiStore.getState().setUnreadNotifications(unread);
        })
        .catch(() => undefined);
      refresh();
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onPressRow = useCallback(
    (n: NotificationDto) => {
      if (!n.isRead) {
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
        );
        notifications.markRead(n.id).catch(() => undefined);
      }
      resolveNotification(n, navigation);
    },
    [navigation, setItems],
  );

  const onMarkAllRead = useCallback(() => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    useUiStore.getState().setUnreadNotifications(0);
    notifications.markAllRead().catch(() => {
      showToast({ message: 'Could not mark all read', tone: 'error' });
    });
  }, [setItems, showToast]);

  const hasUnread = items.some((n) => !n.isRead);
  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <SafeAreaView
      testID="notifications-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md },
        ]}
      >
        <Text variant="heading" color="textPrimary">
          Notifications
        </Text>
        {hasUnread ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Mark all read"
            hitSlop={theme.hitSlop}
            onPress={onMarkAllRead}
          >
            <Text variant="button" color="primary">
              Mark all read
            </Text>
          </PressableScale>
        ) : null}
      </View>
      <Divider />

      <FlatList
        style={styles.flex}
        data={initialLoading || showError ? [] : items}
        keyExtractor={(n) => String(n.id)}
        renderItem={({ item }) => (
          <NotificationRow n={item} onPress={() => onPressRow(item)} />
        )}
        ItemSeparatorComponent={Divider}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          initialLoading ? (
            <SkeletonList />
          ) : showError ? (
            <ErrorState message={error!.message} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={BellOff}
              title="No notifications yet"
              body="You're all caught up."
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <ListFooter loading={loading && !refreshing} end={endReached} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skelRow: { flexDirection: 'row', alignItems: 'center' },
});
