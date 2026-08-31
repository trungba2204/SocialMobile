import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';

import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { relativeTime } from '@/lib/format';
import type { PostDto, PostPrivacy } from '@/api/types';
import { PostActions } from './PostActions';
import { PostMediaGrid } from './PostMediaGrid';

export type PostCardProps = {
  post: PostDto;
  onPressPost: () => void;
  onPressAuthor: () => void;
  onToggleLike: (next: boolean) => void;
  onPressComments: () => void;
  onShare: () => void;
};

const HAIRLINE: Record<PostPrivacy, 'accent' | 'primary' | 'textSecondary'> = {
  PUBLIC: 'accent',
  FRIENDS: 'primary',
  PRIVATE: 'textSecondary',
};

export function PostCard({
  post,
  onPressPost,
  onPressAuthor,
  onToggleLike,
  onPressComments,
  onShare,
}: PostCardProps) {
  const theme = useTheme();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  // Re-seed from props when the authoritative post changes (server sync / rollback).
  const prev = useRef({ liked: post.likedByMe, count: post.likeCount });
  if (prev.current.liked !== post.likedByMe || prev.current.count !== post.likeCount) {
    prev.current = { liked: post.likedByMe, count: post.likeCount };
    setLiked(post.likedByMe);
    setLikeCount(post.likeCount);
  }

  const toggleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    onToggleLike(next);
  }, [liked, onToggleLike]);

  const meta = [post.feeling, post.location].filter(Boolean).join(' · ');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.hairline, { backgroundColor: theme.colors[HAIRLINE[post.privacy]] }]} />
      <View style={styles.content}>
        <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={onPressAuthor}
              style={[styles.author, { gap: theme.space.md }]}
            >
              <Avatar uri={post.author.avatarUrl} name={post.author.displayName} size={42} />
              <View style={styles.flexShrink}>
                <Text variant="bodyMed">{post.author.displayName}</Text>
                <Text variant="metadata" color="textSecondary">
                  {relativeTime(post.createdAt)}
                  {meta ? ` · ${meta}` : ''}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              hitSlop={theme.hitSlop}
              onPress={onPressPost}
            >
              <MoreHorizontal size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {post.content ? (
            <Pressable accessibilityRole="button" onPress={onPressPost}>
              <Text variant="body">{post.content}</Text>
            </Pressable>
          ) : null}
        </View>

        {post.media.length > 0 ? (
          <PostMediaGrid media={post.media} onPress={onPressPost} />
        ) : null}

        <View
          style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.md, paddingBottom: theme.space.sm }}
        >
          <PostActions
            liked={liked}
            likeCount={likeCount}
            commentCount={post.commentCount}
            shareCount={post.shareCount}
            onToggleLike={toggleLike}
            onPressComments={onPressComments}
            onShare={onShare}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', flexDirection: 'row', alignItems: 'stretch', marginBottom: 8 },
  hairline: { width: 3 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  flexShrink: { flexShrink: 1 },
});
