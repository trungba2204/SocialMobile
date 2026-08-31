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

const CARD_W = 96;
const CARD_H = 140;

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
          { borderRadius: theme.radius.lg, backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Avatar uri={user?.avatarUrl ?? null} name={user?.displayName ?? 'You'} size={40} />
        <View style={[styles.plus, { backgroundColor: theme.colors.primary, borderColor: theme.colors.card }]}>
          <Plus size={14} color={theme.colors.onPrimary} />
        </View>
        <Text variant="metadata" color="textSecondary" numberOfLines={1}>
          Your story
        </Text>
      </PressableScale>

      {MOCK_STORIES.map((story, i) => (
        <PressableScale
          key={story.id}
          accessibilityRole="button"
          accessibilityLabel={`${story.authorName}'s story`}
          onPress={() => navigation.navigate('StoryViewer', { userIndex: i + 1 })}
          style={[styles.card, { borderRadius: theme.radius.lg, overflow: 'hidden' }]}
        >
          <Image
            source={{ uri: resolveMediaUrl(story.imageUrl) }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`${story.authorName} story`}
          />
          <View style={[styles.ring, { borderColor: theme.colors.accent }]}>
            <Avatar uri={story.avatarUrl} name={story.authorName} size={28} />
          </View>
          <View style={styles.nameWrap}>
            <Text variant="metadata" color="surface" numberOfLines={1}>
              {story.authorName.split(' ')[0]}
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
    padding: 8,
    justifyContent: 'space-between',
  },
  plus: {
    position: 'absolute',
    top: 34,
    left: 34,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2, borderRadius: 18, padding: 2, alignSelf: 'flex-start' },
  nameWrap: { alignSelf: 'stretch' },
});
