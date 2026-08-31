import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SearchX } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Tabs } from '@/components/Tabs';
import { TextField } from '@/components/TextField';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import * as search from '@/api/search';
import * as recentSearches from '@/lib/recentSearches';
import type { PostDto, UserDto } from '@/api/types';
import { PostCard } from '@/features/home/components/PostCard';
import { RecentSearches } from './components/RecentSearches';
import { SearchResultUser } from './components/SearchResultUser';

const MIN_LEN = 2;
const SKELETON_ROWS = [0, 1, 2, 3, 4];

type TabKey = 'people' | 'posts';

const TABS = [
  { key: 'people', label: 'People' },
  { key: 'posts', label: 'Posts' },
];

function SkeletonList() {
  const theme = useTheme();
  return (
    <View testID="search-skeleton">
      {SKELETON_ROWS.map((i) => (
        <View
          key={i}
          style={[styles.skeletonRow, { padding: theme.space.lg, gap: theme.space.md }]}
        >
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ gap: theme.space.xs }}>
            <Skeleton width={160} height={12} />
            <Skeleton width={100} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('people');
  const [recents, setRecents] = useState<string[]>([]);

  const debounced = useDebouncedValue(query, 300);
  const trimmed = debounced.trim();
  const active = trimmed.length >= MIN_LEN;

  const refreshRecents = useCallback(() => {
    void recentSearches.list().then(setRecents);
  }, []);

  useEffect(() => {
    refreshRecents();
  }, [refreshRecents]);

  const record = useCallback(
    (term: string) => {
      void recentSearches.add(term).then(refreshRecents);
    },
    [refreshRecents],
  );

  const onPressUser = useCallback(
    (user: UserDto) => {
      record(trimmed);
      navigation.navigate('UserProfile', { userId: user.id });
    },
    [navigation, record, trimmed],
  );

  const onPressPost = useCallback(
    (post: PostDto) => {
      record(trimmed);
      // PostDetail lives in HomeStack (a different navigator). Attempt the
      // cross-stack navigation; React Navigation resolves it up the tree when
      // possible. See task-13 report for the M1 limitation note.
      navigation.navigate('PostDetail', { postId: post.id });
    },
    [navigation, record, trimmed],
  );

  return (
    <SafeAreaView
      testID="search-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.bar,
          { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
        ]}
      >
        <View style={styles.flex}>
          <TextField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search people and posts"
            autoCapitalize="none"
            autoFocus
            returnKeyType="search"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          hitSlop={theme.hitSlop}
        >
          <Text variant="button" color="primary">
            Cancel
          </Text>
        </Pressable>
      </View>

      {active ? (
        <>
          <Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as TabKey)} />
          {tab === 'people' ? (
            <PeopleResults key={`people:${trimmed}`} q={trimmed} onPressUser={onPressUser} />
          ) : (
            <PostResults key={`posts:${trimmed}`} q={trimmed} onPressPost={onPressPost} />
          )}
        </>
      ) : (
        <RecentSearches
          terms={recents}
          onPick={setQuery}
          onClear={() => {
            void recentSearches.clear().then(refreshRecents);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function PeopleResults({
  q,
  onPressUser,
}: {
  q: string;
  onPressUser: (user: UserDto) => void;
}) {
  const { items, loading, error, endReached, refresh, loadMore } = usePagedQuery<UserDto>(
    useCallback((page) => search.users(q, page), [q]),
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <FlatList
      style={styles.flex}
      data={initialLoading || showError ? [] : items}
      keyExtractor={(u) => String(u.id)}
      renderItem={({ item }) => (
        <SearchResultUser user={item} onPress={() => onPressUser(item)} />
      )}
      onEndReached={() => loadMore()}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        initialLoading ? (
          <SkeletonList />
        ) : showError ? (
          <ErrorState message={error!.message} onRetry={refresh} />
        ) : (
          <EmptyState icon={SearchX} title={`No matches for '${q}'`} />
        )
      }
      ListFooterComponent={
        items.length > 0 ? <ListFooter loading={loading} end={endReached} /> : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function PostResults({
  q,
  onPressPost,
}: {
  q: string;
  onPressPost: (post: PostDto) => void;
}) {
  const { items, loading, error, endReached, refresh, loadMore } = usePagedQuery<PostDto>(
    useCallback((page) => search.posts(q, page), [q]),
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <FlatList
      style={styles.flex}
      data={initialLoading || showError ? [] : items}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPressPost={() => onPressPost(item)}
          onPressAuthor={() => onPressPost(item)}
          onToggleLike={() => undefined}
          onPressComments={() => onPressPost(item)}
          onShare={() => onPressPost(item)}
        />
      )}
      onEndReached={() => loadMore()}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        initialLoading ? (
          <SkeletonList />
        ) : showError ? (
          <ErrorState message={error!.message} onRetry={refresh} />
        ) : (
          <EmptyState icon={SearchX} title={`No matches for '${q}'`} />
        )
      }
      ListFooterComponent={
        items.length > 0 ? <ListFooter loading={loading} end={endReached} /> : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center' },
  skeletonRow: { flexDirection: 'row', alignItems: 'center' },
});
