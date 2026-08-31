import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { compactCount } from '@/lib/format';

export type PostActionsProps = {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  onToggleLike: () => void;
  onPressComments: () => void;
  onShare: () => void;
};

export function PostActions({
  liked,
  likeCount,
  commentCount,
  shareCount,
  onToggleLike,
  onPressComments,
  onShare,
}: PostActionsProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (liked) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
  }, [liked, scale]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.row, { gap: theme.space.xl }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Unlike' : 'Like'}
        onPress={onToggleLike}
        style={styles.action}
      >
        <Animated.View style={heartStyle}>
          <Heart
            size={22}
            color={liked ? theme.colors.error : theme.colors.textSecondary}
            fill={liked ? theme.colors.error : 'transparent'}
          />
        </Animated.View>
        <Text variant="metadata" color={liked ? 'error' : 'textSecondary'}>
          {compactCount(likeCount)}
        </Text>
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Comments"
        onPress={onPressComments}
        style={styles.action}
      >
        <MessageCircle size={22} color={theme.colors.textSecondary} />
        <Text variant="metadata" color="textSecondary">
          {compactCount(commentCount)}
        </Text>
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Share"
        onPress={onShare}
        style={styles.action}
      >
        <Share2 size={22} color={theme.colors.textSecondary} />
        <Text variant="metadata" color="textSecondary">
          {compactCount(shareCount)}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
});
