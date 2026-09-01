// M2: stories are mock data until the Story API ships — the whole viewer runs on local mock data.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { Send, X } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import { haptics } from '@/lib/haptics';
import type { RootStackParamList } from '@/navigation/types';
import { MOCK_STORIES } from '@/mock/stories';
import { StoryProgressBar } from './components/StoryProgressBar';

const TICK_MS = 50;

export function StoryViewerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'StoryViewer'>>();

  const userIndex = route.params?.userIndex ?? 0;
  const reel = MOCK_STORIES[Math.min(userIndex, MOCK_STORIES.length - 1)]!;
  const stories = reel.stories;

  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useSharedValue(0);
  const elapsedRef = useRef(0);

  const story = stories[storyIndex]!;
  const duration = story.durationMs;

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const next = useCallback(() => {
    elapsedRef.current = 0;
    progress.value = 0;
    setStoryIndex((i) => {
      if (i < stories.length - 1) return i + 1;
      goBack();
      return i;
    });
  }, [stories.length, goBack, progress]);

  const prev = useCallback(() => {
    elapsedRef.current = 0;
    progress.value = 0;
    setStoryIndex((i) => (i > 0 ? i - 1 : i));
  }, [progress]);

  // Timer + progress fill. Recomputes remaining time on pause/resume and per story.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now() - elapsedRef.current;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      elapsedRef.current = elapsed;
      progress.value = elapsed / duration;
      if (elapsed >= duration) {
        clearInterval(id);
        next();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, storyIndex, duration, next, progress]);

  const hold = () => {
    haptics.selection();
    setPaused(true);
  };
  const release = () => setPaused(false);

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]} testID="story-viewer-screen">
      <Image
        key={story.id}
        source={{ uri: resolveMediaUrl(story.imageUrl) }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        testID="story-image"
        accessibilityLabel={`${reel.author.name} story ${storyIndex + 1}`}
      />

      {/* Tap zones: left = previous, right = next; hold anywhere = pause. */}
      <Pressable
        style={[styles.zone, styles.zoneLeft]}
        onPress={prev}
        onPressIn={hold}
        onPressOut={release}
        accessibilityLabel="Previous story"
      />
      <Pressable
        style={[styles.zone, styles.zoneRight]}
        onPress={next}
        onPressIn={hold}
        onPressOut={release}
        accessibilityLabel="Next story"
      />

      <View style={[styles.header, { paddingTop: insets.top + theme.space.sm, paddingHorizontal: theme.space.lg }]}>
        <StoryProgressBar count={stories.length} activeIndex={storyIndex} progress={progress} />
        <View style={[styles.headerRow, { marginTop: theme.space.md, gap: theme.space.sm }]}>
          <Avatar uri={reel.author.avatarUrl} name={reel.author.name} size={32} />
          <Text variant="bodyMed" color="onPrimary" style={styles.flex} numberOfLines={1}>
            {reel.author.name}
          </Text>
          <Text variant="metadata" color="onPrimary" style={styles.dim}>
            {storyIndex + 1}/{stories.length}
          </Text>
          <IconButton icon={X} color={theme.colors.onPrimary} onPress={goBack} accessibilityLabel="Close story" />
        </View>
      </View>

      {/* M2: reply bar is UI-only — no submission until the Story API ships. */}
      <View
        style={[
          styles.replyBar,
          {
            paddingBottom: insets.bottom + theme.space.md,
            paddingHorizontal: theme.space.lg,
            gap: theme.space.sm,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { borderColor: 'rgba(255,255,255,0.4)', color: theme.colors.onPrimary, borderRadius: theme.radius.pill },
          ]}
          placeholder={`Reply to ${reel.author.name.split(' ')[0]}…`}
          placeholderTextColor="rgba(255,255,255,0.6)"
          editable={false}
        />
        <IconButton icon={Send} color={theme.colors.onPrimary} accessibilityLabel="Send reply" disabled />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  zoneLeft: { left: 0, width: '40%' },
  zoneRight: { right: 0, width: '60%' },
  header: { position: 'absolute', left: 0, right: 0, top: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  dim: { opacity: 0.7 },
  replyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 40, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
});
