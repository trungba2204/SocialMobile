import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { IconButton } from '@/components/IconButton';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { useResource } from '@/hooks/useResource';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import * as posts from '@/api/posts';
import type { HomeStackParamList } from '@/navigation/types';
import { PostCard } from './components/PostCard';
import { CommentsThread } from '@/features/comments/components/CommentsThread';

export function PostDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeStackParamList, 'PostDetail'>>();
  const { postId } = route.params;
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: post, loading, error, reload } = useResource(() => posts.get(postId), [postId]);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  useEffect(() => {
    if (post) {
      setLiked(post.likedByMe);
      setLikeCount(post.likeCount);
    }
  }, [post]);

  const onToggleLike = useCallback(
    async (next: boolean) => {
      const prevLiked = liked;
      const prevCount = likeCount;
      setLiked(next);
      setLikeCount((c) => c + (next ? 1 : -1));
      try {
        const res = next ? await posts.like(postId) : await posts.unlike(postId);
        setLiked(res.liked);
        setLikeCount(res.likeCount);
      } catch {
        setLiked(prevLiked);
        setLikeCount(prevCount);
        showToast({ message: 'Could not update like', tone: 'error' });
      }
    },
    [postId, liked, likeCount, showToast],
  );

  const onShare = useCallback(async () => {
    try {
      await posts.share(postId);
      showToast({ message: 'Shared to your profile', tone: 'success' });
    } catch {
      showToast({ message: 'Could not share post', tone: 'error' });
    }
  }, [postId, showToast]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await posts.remove(postId);
      setMenuOpen(false);
      navigation.goBack();
    } catch {
      setDeleting(false);
      showToast({ message: 'Could not delete post', tone: 'error' });
    }
  }, [postId, navigation, showToast]);

  const isOwn = !!post && !!user && post.author.id === user.id;

  return (
    <SafeAreaView
      testID="post-detail-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.sm, borderBottomColor: theme.colors.border },
        ]}
      >
        <IconButton
          icon={ChevronLeft}
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title">Post</Text>
        {isOwn ? (
          <IconButton
            icon={MoreHorizontal}
            accessibilityLabel="Post options"
            onPress={() => setMenuOpen(true)}
          />
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {loading && !post ? (
        <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
          <Skeleton width={160} height={14} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
          <Skeleton width="100%" height={200} radius={12} />
        </View>
      ) : error && !post ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : post ? (
        <CommentsThread
          postId={postId}
          postAuthorId={post.author.id}
          header={
            <PostCard
              post={post}
              likeState={{ liked, count: likeCount }}
              onPressPost={() => undefined}
              onPressAuthor={() => navigation.navigate('UserProfile', { userId: post.author.id })}
              onToggleLike={(next) => {
                void onToggleLike(next);
              }}
              onPressComments={() => undefined}
              onShare={() => {
                void onShare();
              }}
            />
          }
        />
      ) : null}

      <AppModal visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={{ gap: theme.space.md }}>
          <Text variant="title">Delete post?</Text>
          <Text variant="body" color="textSecondary">
            This permanently removes the post and its comments.
          </Text>
          <View style={[styles.actions, { gap: theme.space.sm }]}>
            <Button label="Cancel" variant="ghost" onPress={() => setMenuOpen(false)} />
            <Button
              label="Delete"
              variant="danger"
              loading={deleting}
              onPress={() => {
                void onDelete();
              }}
            />
          </View>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: { width: 44, height: 44 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
