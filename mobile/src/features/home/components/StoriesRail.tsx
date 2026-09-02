import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useResource } from '@/hooks/useResource';
import { useAuthStore } from '@/store/useAuthStore';
import * as stories from '@/api/stories';

// Rounded-rect story card geometry (token-less: fixed art direction, not spacing scale).
const CARD_W = 96;
const CARD_H = 140;
const ADD_AVATAR = 40;
const STORY_AVATAR = 28;
const PLUS_SIZE = 20;
const PLUS_OFFSET = ADD_AVATAR - PLUS_SIZE / 2 - 4;
const RING_BORDER = 2;
const RING_INSET = 2;

export function StoriesRail() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const { data, loading, error, reload } = useResource(stories.reels, []);

  // Refresh after Add / Delete when the feed regains focus (skip the initial mount).
  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (mounted.current) reload();
      else mounted.current = true;
    }, [reload]),
  );

  const reels = data ?? [];
  const showLoading = loading && !data;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md, gap: theme.space.sm },
      ]}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Add to your story"
        onPress={() => navigation.navigate('AddStory')}
        style={[
          styles.card,
          {
            borderRadius: theme.radius.lg,
            padding: theme.space.sm,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Avatar uri={user?.avatarUrl ?? null} name={user?.displayName ?? 'You'} size={ADD_AVATAR} />
        <View style={[styles.plus, { backgroundColor: theme.colors.primary, borderColor: theme.colors.card }]}>
          <Plus size={14} color={theme.colors.onPrimary} />
        </View>
        <Text variant="metadata" color="textSecondary" numberOfLines={1}>
          Add story
        </Text>
      </PressableScale>

      {showLoading
        ? [0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={CARD_W} height={CARD_H} radius={theme.radius.lg} />
            </View>
          ))
        : reels.map((reel) => (
            <PressableScale
              key={reel.author.id}
              accessibilityRole="button"
              accessibilityLabel={`${reel.author.displayName}'s story`}
              onPress={() =>
                navigation.navigate('StoryViewer', { authorId: reel.author.id })
              }
              style={[
                styles.card,
                {
                  borderRadius: theme.radius.lg,
                  padding: theme.space.sm,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.ring,
                  {
                    borderColor: reel.hasUnseen ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              >
                <Avatar
                  uri={reel.author.avatarUrl}
                  name={reel.author.displayName}
                  size={STORY_AVATAR}
                />
              </View>
              <Text variant="metadata" color="textSecondary" numberOfLines={1}>
                {reel.author.displayName.split(' ')[0]}
              </Text>
            </PressableScale>
          ))}

      {error && !showLoading ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Retry loading stories"
          onPress={reload}
          style={[styles.retry, { borderRadius: theme.radius.lg, borderColor: theme.colors.border }]}
        >
          <Text variant="metadata" color="textSecondary">
            Retry
          </Text>
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row' },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  skeletonCard: { width: CARD_W, height: CARD_H },
  plus: {
    position: 'absolute',
    top: PLUS_OFFSET,
    left: PLUS_OFFSET,
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    borderRadius: PLUS_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: RING_BORDER,
    borderRadius: STORY_AVATAR / 2 + RING_BORDER + RING_INSET,
    padding: RING_INSET,
    alignSelf: 'flex-start',
  },
  retry: {
    width: 64,
    height: CARD_H,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
