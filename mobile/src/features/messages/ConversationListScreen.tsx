import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Divider } from '@/components/Divider';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListFooter } from '@/components/ListFooter';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import * as conversations from '@/api/conversations';
import type { ConversationDto } from '@/api/types';
import { ConversationRow } from './components/ConversationRow';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function SkeletonList() {
  const theme = useTheme();
  return (
    <View testID="conversations-skeleton">
      {SKELETON_ROWS.map((i) => (
        <View
          key={i}
          style={[styles.skelRow, { padding: theme.space.lg, gap: theme.space.md }]}
        >
          <Skeleton width={52} height={52} radius={26} />
          <View style={{ gap: theme.space.xs }}>
            <Skeleton width={160} height={12} />
            <Skeleton width={200} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ConversationListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const { items, loading, refreshing, error, endReached, refresh, loadMore } =
    usePagedQuery<ConversationDto>(useCallback((page) => conversations.list(page), []));

  useFocusEffect(
    useCallback(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const initialLoading = loading && items.length === 0;
  const showError = !!error && items.length === 0;

  return (
    <SafeAreaView
      testID="conversation-list-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md }}>
        <Text variant="heading">Messages</Text>
      </View>
      <FlatList
        style={styles.flex}
        data={initialLoading || showError ? [] : items}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() =>
              navigation.navigate('Messages', {
                screen: 'Chat',
                params: { conversationId: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <Divider inset={theme.space.lg + 52 + theme.space.md} />}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        ListEmptyComponent={
          initialLoading ? (
            <SkeletonList />
          ) : showError ? (
            <ErrorState message={error!.message} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              body="Message a friend to start a conversation."
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <ListFooter loading={loading && !refreshing} end={endReached} />
          ) : null
        }
        contentContainerStyle={
          initialLoading || showError || items.length === 0 ? styles.grow : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1, justifyContent: 'center' },
  skelRow: { flexDirection: 'row', alignItems: 'center' },
});
