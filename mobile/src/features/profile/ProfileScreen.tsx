import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Tabs } from '@/components/Tabs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { Divider } from '@/components/Divider';
import { useResource } from '@/hooks/useResource';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import * as users from '@/api/users';
import * as friends from '@/api/friends';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import type { FriendStatus, PostDto } from '@/api/types';
import { PostCard } from '@/features/home/components/PostCard';
import { ProfileHeader } from './components/ProfileHeader';

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'about', label: 'About' },
];

function HeroSkeleton() {
  const theme = useTheme();
  return (
    <View testID="profile-skeleton">
      <Skeleton width="100%" height={150} radius={0} />
      <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
        <Skeleton width={88} height={88} radius={44} />
        <Skeleton width={180} height={16} />
        <Skeleton width={120} height={12} />
        <Skeleton width="90%" height={12} />
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const authUser = useAuthStore((s) => s.user);

  const paramUserId: number | undefined = route.params?.userId;
  const isSelf = paramUserId === undefined || paramUserId === authUser?.id;
  const targetId = (isSelf ? authUser?.id ?? paramUserId : paramUserId) as number;

  const {
    data: profile,
    loading,
    error,
    reload,
  } = useResource(() => users.getProfile(targetId), [targetId]);

  const [tab, setTab] = useState('posts');
  const [statusOverride, setStatusOverride] = useState<FriendStatus | null>(null);
  useEffect(() => {
    setStatusOverride(null);
  }, [targetId]);

  const friendStatus: FriendStatus =
    statusOverride ?? profile?.friendStatus ?? 'NONE';

  const feed = usePagedQuery<PostDto>(
    useCallback((page) => users.posts(targetId, page), [targetId]),
  );

  const onAddFriend = useCallback(() => {
    setStatusOverride('PENDING_OUT');
    friends.sendRequest(targetId).catch(() => {
      setStatusOverride('NONE');
      useUiStore.getState().showToast({ message: 'Could not send request', tone: 'error' });
    });
  }, [targetId]);

  const onUnfriend = useCallback(() => {
    setStatusOverride('NONE');
    friends.remove(targetId).catch(() => {
      setStatusOverride('FRIENDS');
      useUiStore.getState().showToast({ message: 'Could not unfriend', tone: 'error' });
    });
  }, [targetId]);

  const onAcceptNavigate = useCallback(() => {
    navigation.navigate('FriendsTab');
  }, [navigation]);

  const header = useMemo(
    () =>
      profile ? (
        <>
          <ProfileHeader
            profile={profile}
            friendStatus={friendStatus}
            isSelf={isSelf}
            onEditProfile={() => navigation.navigate('EditProfile')}
            onSettings={() => navigation.navigate('Settings')}
            onAddFriend={onAddFriend}
            onAcceptNavigate={onAcceptNavigate}
            onUnfriend={onUnfriend}
            onMessage={() => navigation.navigate('Messages')}
            onPressFriends={() => navigation.navigate('FriendsTab')}
          />
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </>
      ) : null,
    [profile, friendStatus, isSelf, tab, navigation, onAddFriend, onAcceptNavigate, onUnfriend],
  );

  const renderPost = useCallback(
    ({ item }: { item: PostDto }) => (
      <PostCard
        post={item}
        onPressPost={() => navigation.navigate('PostDetail', { postId: item.id })}
        onPressAuthor={() => navigation.navigate('UserProfile', { userId: item.author.id })}
        onToggleLike={() => {}}
        onPressComments={() => navigation.navigate('PostDetail', { postId: item.id })}
        onShare={() => navigation.navigate('PostDetail', { postId: item.id })}
      />
    ),
    [navigation],
  );

  const About = profile ? (
    <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
      <Text variant="title" color="textPrimary">
        About
      </Text>
      {profile.bio ? (
        <Text variant="body" color="textPrimary">
          {profile.bio}
        </Text>
      ) : (
        <Text variant="body" color="textSecondary">
          No bio yet.
        </Text>
      )}
      <Divider spacing="sm" />
      <Text variant="body" color="textSecondary">
        @{profile.username}
      </Text>
      <Text variant="body" color="textSecondary">
        {profile.friendCount} friends · {profile.postCount} posts
      </Text>
    </View>
  ) : null;

  const postsInitialLoading = feed.loading && feed.items.length === 0;
  const postsShowError = !!feed.error && feed.items.length === 0;

  const listEmpty =
    tab === 'about' ? (
      About
    ) : postsInitialLoading ? (
      <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width="100%" height={120} />
        ))}
      </View>
    ) : postsShowError ? (
      <ErrorState message={feed.error!.message} onRetry={feed.refresh} />
    ) : (
      <EmptyState icon={FileText} title="No posts yet" />
    );

  return (
    <SafeAreaView
      testID="profile-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      {loading && !profile ? (
        <HeroSkeleton />
      ) : error && !profile ? (
        <View style={styles.flex}>
          <ErrorState message={error.message} onRetry={reload} />
        </View>
      ) : (
        <FlatList
          data={tab === 'posts' ? feed.items : []}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderPost}
          ListHeaderComponent={header}
          ListEmptyComponent={listEmpty}
          onEndReached={() => tab === 'posts' && feed.loadMore()}
          onEndReachedThreshold={0.4}
          refreshing={feed.refreshing}
          onRefresh={() => {
            reload();
            feed.refresh();
          }}
          ListFooterComponent={
            tab === 'posts' && feed.items.length > 0 ? (
              <ListFooter loading={feed.loading && !feed.refreshing} end={feed.endReached} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
