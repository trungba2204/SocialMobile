import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useUiStore } from '@/store/useUiStore';
import * as posts from '@/api/posts';
import * as notifications from '@/api/notifications';
import type { PostDto } from '@/api/types';
import { FeedHeader } from './components/FeedHeader';
import { StoriesRail } from './components/StoriesRail';
import { PostCard } from './components/PostCard';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function SkeletonRow() {
  const theme = useTheme();
  return (
    <View style={[styles.skeleton, { padding: theme.space.lg, gap: theme.space.md }]}>
      <View style={[styles.skeletonHead, { gap: theme.space.md }]}>
        <Skeleton width={42} height={42} radius={21} />
        <View style={{ gap: 6 }}>
          <Skeleton width={140} height={12} />
          <Skeleton width={80} height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="70%" height={12} />
      <Skeleton width="100%" height={180} radius={12} />
    </View>
  );
}

export function FeedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const showToast = useUiStore((s) => s.showToast);

  const { items, loading, refreshing, error, endReached, refresh, loadMore, setItems } =
    usePagedQuery<PostDto>((page) => posts.feed(page));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notifications
        .list(0)
        .then(({ unread }) => {
          if (active) useUiStore.getState().setUnreadNotifications(unread);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const patch = useCallback(
    (id: number, updater: (p: PostDto) => PostDto) => {
      setItems((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
    },
    [setItems],
  );

  const onToggleLike = useCallback(
    async (post: PostDto, next: boolean) => {
      patch(post.id, (p) => ({
        ...p,
        likedByMe: next,
        likeCount: p.likeCount + (next ? 1 : -1),
      }));
      try {
        const res = next ? await posts.like(post.id) : await posts.unlike(post.id);
        patch(post.id, (p) => ({ ...p, likedByMe: res.liked, likeCount: res.likeCount }));
      } catch {
        patch(post.id, (p) => ({
          ...p,
          likedByMe: post.likedByMe,
          likeCount: post.likeCount,
        }));
        showToast({ message: 'Could not update like', tone: 'error' });
      }
    },
    [patch, showToast],
  );

  const header = (
    <>
      <FeedHeader />
      <StoriesRail />
    </>
  );

  const renderItem = useCallback(
    ({ item }: { item: PostDto }) => (
      <PostCard
        post={item}
        onPressPost={() => navigation.navigate('PostDetail', { postId: item.id })}
        onPressAuthor={() => navigation.navigate('UserProfile', { userId: item.author.id })}
        onToggleLike={(next) => {
          void onToggleLike(item, next);
        }}
        onPressComments={() => navigation.navigate('Comments', { postId: item.id })}
        onShare={() => navigation.navigate('PostDetail', { postId: item.id })}
      />
    ),
    [navigation, onToggleLike],
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <SafeAreaView
      testID="feed-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={initialLoading || showError ? [] : items}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
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
            <View testID="feed-skeleton">
              {SKELETON_ROWS.map((i) => (
                <SkeletonRow key={i} />
              ))}
            </View>
          ) : showError ? (
            <ErrorState message={error!.message} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={Users}
              title="Your orbit is quiet"
              body="Follow a few people and their posts will land here."
              actionLabel="Find friends"
              onAction={() => navigation.navigate('FriendsTab')}
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <ListFooter
              loading={loading && !refreshing}
              end={endReached}
              error={!!error}
              onRetry={loadMore}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeleton: {},
  skeletonHead: { flexDirection: 'row', alignItems: 'center' },
});
