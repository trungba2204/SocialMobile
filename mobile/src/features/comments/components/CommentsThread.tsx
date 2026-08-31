import { type ReactElement, useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import * as comments from '@/api/comments';
import type { CommentDto } from '@/api/types';
import { CommentRow } from './CommentRow';
import { CommentComposer } from './CommentComposer';

export type CommentsThreadProps = {
  postId: number;
  postAuthorId?: number;
  header?: ReactElement | null;
};

const SKELETON_ROWS = [0, 1, 2];

function SkeletonRow() {
  const theme = useTheme();
  return (
    <View style={[styles.skelRow, { padding: theme.space.lg, gap: theme.space.md }]}>
      <Skeleton width={36} height={36} radius={18} />
      <View style={{ gap: theme.space.xs, flex: 1 }}>
        <Skeleton width={120} height={12} />
        <Skeleton width="90%" height={12} />
      </View>
    </View>
  );
}

export function CommentsThread({ postId, postAuthorId, header }: CommentsThreadProps) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);
  const [pendingDelete, setPendingDelete] = useState<CommentDto | null>(null);

  const { items, loading, error, endReached, refresh, loadMore, setItems } =
    usePagedQuery<CommentDto>((page) => comments.list(postId, page));

  const onSubmit = useCallback(
    async (text: string) => {
      const temp: CommentDto = {
        id: -Date.now(),
        postId,
        author: user ?? {
          id: 0,
          username: '',
          displayName: 'You',
          avatarUrl: null,
          bio: null,
        },
        content: text,
        parentId: null,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [...prev, temp]);
      try {
        const real = await comments.create(postId, text);
        setItems((prev) => prev.map((c) => (c.id === temp.id ? real : c)));
      } catch (e) {
        setItems((prev) => prev.filter((c) => c.id !== temp.id));
        showToast({ message: 'Could not post your comment', tone: 'error' });
        throw e;
      }
    },
    [postId, user, setItems, showToast],
  );

  const confirmDelete = useCallback(async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    const snapshot = target;
    setItems((prev) => prev.filter((c) => c.id !== snapshot.id));
    try {
      await comments.remove(snapshot.id);
    } catch {
      setItems((prev) => [...prev, snapshot].sort((a, b) => a.id - b.id));
      showToast({ message: 'Could not delete comment', tone: 'error' });
    }
  }, [pendingDelete, setItems, showToast]);

  const renderItem = useCallback(
    ({ item }: { item: CommentDto }) => {
      const pending = item.id < 0;
      const canDelete =
        !pending &&
        !!user &&
        (item.author.id === user.id || postAuthorId === user.id);
      return (
        <CommentRow
          comment={item}
          pending={pending}
          canDelete={canDelete}
          onDelete={canDelete ? () => setPendingDelete(item) : undefined}
        />
      );
    },
    [user, postAuthorId],
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        style={styles.flex}
        data={initialLoading || showError ? [] : items}
        keyExtractor={(c) => String(c.id)}
        renderItem={renderItem}
        ListHeaderComponent={header ?? undefined}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          initialLoading ? (
            <View testID="comments-skeleton">
              {SKELETON_ROWS.map((i) => (
                <SkeletonRow key={i} />
              ))}
            </View>
          ) : showError ? (
            <ErrorState message={error!.message} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No comments yet"
              body="Start the conversation."
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <ListFooter loading={loading} end={endReached} error={!!error} onRetry={loadMore} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
      <CommentComposer onSubmit={onSubmit} />

      <AppModal visible={!!pendingDelete} onClose={() => setPendingDelete(null)}>
        <View style={{ gap: theme.space.md }}>
          <Text variant="title">Delete comment?</Text>
          <Text variant="body" color="textSecondary">
            This can’t be undone.
          </Text>
          <View style={[styles.actions, { gap: theme.space.sm }]}>
            <Button label="Cancel" variant="ghost" onPress={() => setPendingDelete(null)} />
            <Button
              label="Delete"
              variant="danger"
              onPress={() => {
                void confirmDelete();
              }}
            />
          </View>
        </View>
      </AppModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skelRow: { flexDirection: 'row' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
