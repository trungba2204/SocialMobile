import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import { useAuthStore } from '@/store/useAuthStore';
import { MOCK_STORIES } from '@/mock/stories';

// Rounded-rect story card geometry (token-less: fixed art direction, not spacing scale).
const CARD_W = 96;
const CARD_H = 140;
const ADD_AVATAR = 40;
const STORY_AVATAR = 28;
// "+" badge sits on the lower-right of the add-card avatar.
const PLUS_SIZE = 20;
const PLUS_OFFSET = ADD_AVATAR - PLUS_SIZE / 2 - 4;
// Gradient-style ring inset around the story avatar.
const RING_BORDER = 2;
const RING_INSET = 2;

export function StoriesRail() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

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
        onPress={() => navigation.navigate('StoryViewer', { userIndex: 0 })}
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
          Your story
        </Text>
      </PressableScale>

      {MOCK_STORIES.map((reel, i) => (
        <PressableScale
          key={reel.author.id}
          accessibilityRole="button"
          accessibilityLabel={`${reel.author.name}'s story`}
          onPress={() => navigation.navigate('StoryViewer', { userIndex: i })}
          style={[styles.card, { borderRadius: theme.radius.lg, padding: theme.space.sm, overflow: 'hidden' }]}
        >
          <Image
            source={{ uri: resolveMediaUrl(reel.stories[0]!.imageUrl) }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`${reel.author.name} story`}
          />
          <View style={[styles.ring, { borderColor: theme.colors.accent }]}>
            <Avatar uri={reel.author.avatarUrl} name={reel.author.name} size={STORY_AVATAR} />
          </View>
          <View style={styles.nameWrap}>
            <Text variant="metadata" color="surface" numberOfLines={1}>
              {reel.author.name.split(' ')[0]}
            </Text>
          </View>
        </PressableScale>
      ))}
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
  nameWrap: { alignSelf: 'stretch' },
});
