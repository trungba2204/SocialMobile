import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserPlus, Users, UserCheck } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Tabs } from '@/components/Tabs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useResource } from '@/hooks/useResource';
import { useUiStore } from '@/store/useUiStore';
import { ApiError } from '@/api/errors';
import * as friends from '@/api/friends';
import * as conversations from '@/api/conversations';
import type { FriendRequestDto, UserDto } from '@/api/types';
import { UserRow } from './components/UserRow';
import { RequestRow } from './components/RequestRow';
import { SuggestionCard } from './components/SuggestionCard';

type TabKey = 'all' | 'requests' | 'suggestions';

async function openChat(
  navigation: { navigate: (...args: any[]) => void },
  showToast: (t: { message: string; tone: 'neutral' | 'success' | 'error' }) => void,
  peerUserId: number,
) {
  try {
    const c = await conversations.getOrCreate(peerUserId);
    navigation.navigate('Messages', { screen: 'Chat', params: { conversationId: c.id } });
  } catch {
    showToast({ message: 'Could not open conversation', tone: 'error' });
  }
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'requests', label: 'Requests' },
  { key: 'suggestions', label: 'Suggestions' },
];

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function SkeletonList() {
  const theme = useTheme();
  return (
    <View testID="friends-skeleton">
      {SKELETON_ROWS.map((i) => (
        <View
          key={i}
          style={[styles.skeletonRow, { padding: theme.space.lg, gap: theme.space.md }]}
        >
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ gap: theme.space.xs }}>
            <Skeleton width={140} height={12} />
            <Skeleton width={90} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function FriendsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const showToast = useUiStore((s) => s.showToast);
  const [tab, setTab] = useState<TabKey>('all');

  return (
    <SafeAreaView
      testID="friends-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md }}>
        <Text variant="heading">Friends</Text>
      </View>
      <Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as TabKey)} />
      {tab === 'all' ? (
        <AllTab
          navigation={navigation}
          showToast={showToast}
          onFindPeople={() => setTab('suggestions')}
        />
      ) : tab === 'requests' ? (
        <RequestsTab navigation={navigation} showToast={showToast} />
      ) : (
        <SuggestionsTab navigation={navigation} showToast={showToast} />
      )}
    </SafeAreaView>
  );
}

type TabProps = {
  navigation: { navigate: (...args: any[]) => void };
  showToast: (t: { message: string; tone: 'neutral' | 'success' | 'error' }) => void;
};

function AllTab({ navigation, showToast, onFindPeople }: TabProps & { onFindPeople: () => void }) {
  const theme = useTheme();
  const { items, loading, refreshing, error, endReached, refresh, loadMore, setItems } =
    usePagedQuery<UserDto>((page) => friends.list(page));
  const [confirm, setConfirm] = useState<UserDto | null>(null);

  const doUnfriend = useCallback(
    async (user: UserDto) => {
      setConfirm(null);
      const snapshot = items;
      setItems((prev) => prev.filter((u) => u.id !== user.id));
      try {
        await friends.remove(user.id);
      } catch {
        setItems(() => snapshot);
        showToast({ message: 'Could not remove friend', tone: 'error' });
      }
    },
    [items, setItems, showToast],
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <>
      <FlatList
        style={styles.flex}
        data={initialLoading || showError ? [] : items}
        keyExtractor={(u) => String(u.id)}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
            onMessage={() => void openChat(navigation, showToast, item.id)}
            onMore={() => setConfirm(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          initialLoading ? (
            <SkeletonList />
          ) : showError ? (
            <ErrorState message={error!.message} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={Users}
              title="No friends yet"
              body="Find people you know and send them a request."
              actionLabel="Find people"
              onAction={onFindPeople}
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
      <AppModal visible={!!confirm} onClose={() => setConfirm(null)}>
        <View style={{ gap: theme.space.md }}>
          <Text variant="title">Remove friend?</Text>
          <Text variant="body" color="textSecondary">
            {confirm
              ? `${confirm.displayName} will be removed from your friends.`
              : ''}
          </Text>
          <View style={{ gap: theme.space.sm }}>
            <Button
              label="Remove"
              variant="danger"
              onPress={() => confirm && void doUnfriend(confirm)}
              fullWidth
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setConfirm(null)}
              fullWidth
            />
          </View>
        </View>
      </AppModal>
    </>
  );
}

function RequestsTab({ showToast, navigation }: TabProps) {
  const theme = useTheme();
  const { items, loading, refreshing, error, endReached, refresh, loadMore, setItems } =
    usePagedQuery<FriendRequestDto>((page) => friends.requests(page));
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const act = useCallback(
    async (id: number, fn: (id: number) => Promise<void>, failMsg: string) => {
      const snapshot = items;
      setPendingIds((prev) => new Set(prev).add(id));
      setItems((prev) => prev.filter((r) => r.id !== id));
      try {
        await fn(id);
      } catch {
        setItems(() => snapshot);
        showToast({ message: failMsg, tone: 'error' });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [items, setItems, showToast],
  );

  const onAccept = useCallback(
    (id: number) => void act(id, friends.accept, 'Could not accept request'),
    [act],
  );
  const onReject = useCallback(
    (id: number) => void act(id, friends.reject, 'Could not decline request'),
    [act],
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <FlatList
      style={styles.flex}
      data={initialLoading || showError ? [] : items}
      keyExtractor={(r) => String(r.id)}
      renderItem={({ item }) => (
        <RequestRow
          request={item}
          onAccept={onAccept}
          onReject={onReject}
          pending={pendingIds.has(item.id)}
          onPress={() => navigation.navigate('UserProfile', { userId: item.requester.id })}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.colors.textSecondary}
        />
      }
      onEndReached={() => loadMore()}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        initialLoading ? (
          <SkeletonList />
        ) : showError ? (
          <ErrorState message={error!.message} onRetry={refresh} />
        ) : (
          <EmptyState
            icon={UserCheck}
            title="No pending requests"
            body="Friend requests you receive will show up here."
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
  );
}

function SuggestionsTab({ navigation, showToast }: TabProps) {
  const theme = useTheme();
  const { data, loading, error, reload } = useResource<UserDto[]>(
    () => friends.suggestions(),
    [],
  );
  const [requested, setRequested] = useState<Set<number>>(new Set());

  const onAdd = useCallback(
    async (user: UserDto) => {
      setRequested((prev) => new Set(prev).add(user.id));
      try {
        await friends.sendRequest(user.id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) return;
        setRequested((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
        showToast({ message: 'Could not send request', tone: 'error' });
      }
    },
    [showToast],
  );

  const items = data ?? [];
  const initialLoading = loading && !data;
  const showError = !!error && !data;

  if (initialLoading) return <SkeletonList />;
  if (showError) return <ErrorState message={error!.message} onRetry={reload} />;

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={{ padding: theme.space.md, gap: theme.space.md }}
      columnWrapperStyle={{ gap: theme.space.md }}
      data={items}
      numColumns={2}
      keyExtractor={(u) => String(u.id)}
      renderItem={({ item }) => (
        <View style={styles.gridCell}>
          <SuggestionCard
            user={item}
            requested={requested.has(item.id)}
            onAdd={() => void onAdd(item)}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon={UserPlus}
          title="No suggestions right now"
          body="Check back later for people you may know."
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center' },
  gridCell: { flex: 1 },
});
