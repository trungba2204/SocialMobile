import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { Trash2, X } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import { haptics } from '@/lib/haptics';
import { toApiError, type ApiError } from '@/api/errors';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import * as stories from '@/api/stories';
import type { RootStackParamList } from '@/navigation/types';
import type { StoryDto } from '@/api/types';
import { StoryProgressBar } from './components/StoryProgressBar';

const TICK_MS = 50;
const STORY_DURATION_MS = 5000;
// A press held longer than this is a hold-to-pause gesture, not a tap.
const HOLD_MS = 200;

export function StoryViewerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StoryViewer'>>();
  const authorId = route.params?.authorId;
  const showToast = useUiStore((s) => s.showToast);

  const [reelStories, setReelStories] = useState<StoryDto[] | null>(null);
  const [author, setAuthor] = useState<StoryDto['author'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progress = useSharedValue(0);
  const elapsedRef = useRef(0);
  const heldRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewedRef = useRef<Set<number>>(new Set());

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reels = await stories.reels();
        if (cancelled) return;
        const reel = reels.find((r) => r.author.id === authorId);
        if (!reel || reel.stories.length === 0) {
          goBack();
          return;
        }
        setAuthor(reel.author);
        setReelStories(reel.stories);
      } catch (e) {
        if (!cancelled) setError(toApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authorId, goBack]);

  const story = reelStories?.[storyIndex] ?? null;
  const count = reelStories?.length ?? 0;
  const me = useAuthStore.getState().user;
  const isOwn = !!author && author.id === me?.id;

  // Mark each story viewed once, fire-and-forget.
  useEffect(() => {
    if (!story || viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    stories.markViewed(story.id).catch(() => undefined);
  }, [story]);

  const next = useCallback(() => {
    elapsedRef.current = 0;
    progress.value = 0;
    setStoryIndex((i) => {
      if (i >= count - 1) {
        goBack();
        return i;
      }
      return i + 1;
    });
  }, [count, goBack, progress]);

  const prev = useCallback(() => {
    elapsedRef.current = 0;
    progress.value = 0;
    setStoryIndex((i) => (i > 0 ? i - 1 : i));
  }, [progress]);

  const hold = () => {
    heldRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      heldRef.current = true;
    }, HOLD_MS);
    haptics.selection();
    setPaused(true);
  };
  const release = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    setPaused(false);
  };
  const tapThen = (action: () => void) => () => {
    if (!heldRef.current) action();
  };

  useEffect(() => {
    if (paused || !story || confirmDelete) return;
    const startedAt = Date.now() - elapsedRef.current;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      elapsedRef.current = elapsed;
      progress.value = elapsed / STORY_DURATION_MS;
      if (elapsed >= STORY_DURATION_MS) {
        clearInterval(id);
        next();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, storyIndex, story, next, progress, confirmDelete]);

  useEffect(
    () => () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    },
    [],
  );

  const onDelete = async () => {
    if (!story || deleting) return;
    setDeleting(true);
    try {
      await stories.remove(story.id);
      setConfirmDelete(false);
      setDeleting(false);
      showToast({ message: 'Story deleted', tone: 'success' });
      setReelStories((prev) => {
        const rest = (prev ?? []).filter((s) => s.id !== story.id);
        if (rest.length === 0) {
          goBack();
          return prev;
        }
        setStoryIndex((i) => Math.min(i, rest.length - 1));
        elapsedRef.current = 0;
        progress.value = 0;
        return rest;
      });
    } catch {
      setDeleting(false);
      showToast({ message: 'Could not delete story', tone: 'error' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: '#000' }]} testID="story-viewer-screen">
        <ActivityIndicator size="large" color="#fff" testID="story-viewer-loading" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.colors.background }]} testID="story-viewer-screen">
        <ErrorState message={error.message} onRetry={goBack} />
        <IconButton icon={X} onPress={goBack} accessibilityLabel="Close story" />
      </View>
    );
  }

  if (!story || !author) return null;

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]} testID="story-viewer-screen">
      <Image
        key={story.id}
        source={{ uri: resolveMediaUrl(story.mediaUrl) }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        testID="story-image"
        accessibilityLabel={`${author.displayName} story ${storyIndex + 1}`}
      />

      <Pressable
        style={[styles.zone, styles.zoneLeft]}
        onPress={tapThen(prev)}
        onPressIn={hold}
        onPressOut={release}
        accessibilityLabel="Previous story"
      />
      <Pressable
        style={[styles.zone, styles.zoneRight]}
        onPress={tapThen(next)}
        onPressIn={hold}
        onPressOut={release}
        accessibilityLabel="Next story"
      />

      <View style={[styles.header, { paddingTop: insets.top + theme.space.sm, paddingHorizontal: theme.space.lg }]}>
        <StoryProgressBar count={count} activeIndex={storyIndex} progress={progress} />
        <View style={[styles.headerRow, { marginTop: theme.space.md, gap: theme.space.sm }]}>
          <Avatar uri={author.avatarUrl} name={author.displayName} size={32} />
          <Text variant="bodyMed" color="onPrimary" style={styles.flex} numberOfLines={1}>
            {author.displayName}
          </Text>
          <Text variant="metadata" color="onPrimary" style={styles.dim}>
            {storyIndex + 1}/{count}
          </Text>
          {isOwn ? (
            <IconButton
              icon={Trash2}
              color={theme.colors.onPrimary}
              onPress={() => setConfirmDelete(true)}
              accessibilityLabel="Delete story"
            />
          ) : null}
          <IconButton icon={X} color={theme.colors.onPrimary} onPress={goBack} accessibilityLabel="Close story" />
        </View>
      </View>

      {isOwn ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space.md, paddingHorizontal: theme.space.lg }]}>
          <Text variant="metadata" color="onPrimary" style={styles.dim}>
            Seen by {story.viewerCount}
          </Text>
        </View>
      ) : story.caption ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space.md, paddingHorizontal: theme.space.lg }]}>
          <Text variant="body" color="onPrimary">
            {story.caption}
          </Text>
        </View>
      ) : null}

      <AppModal visible={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <Text variant="title">Delete this story?</Text>
        <View style={{ marginTop: theme.space.lg, gap: theme.space.sm }}>
          <Button label="Delete" variant="danger" fullWidth onPress={onDelete} loading={deleting} />
          <Button label="Cancel" variant="ghost" fullWidth onPress={() => setConfirmDelete(false)} />
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  zoneLeft: { left: 0, width: '40%' },
  zoneRight: { right: 0, width: '60%' },
  header: { position: 'absolute', left: 0, right: 0, top: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  dim: { opacity: 0.7 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
