import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from '@/components/PressableScale';
import type { PickedAsset } from '@/api/media';

export type SelectedMediaStripProps = {
  media: PickedAsset[];
  onRemove: (index: number) => void;
};

export function SelectedMediaStrip({ media, onRemove }: SelectedMediaStripProps) {
  const theme = useTheme();
  if (media.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { gap: theme.space.sm }]}
    >
      {media.map((asset, index) => (
        <View key={`${asset.uri}-${index}`} style={styles.item}>
          <Image
            source={{ uri: asset.uri }}
            accessibilityLabel={`Selected image ${index + 1}`}
            style={[styles.thumb, { borderRadius: theme.radius.md, backgroundColor: theme.colors.card }]}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Remove image ${index + 1}`}
            hitSlop={theme.hitSlop}
            onPress={() => onRemove(index)}
            style={[styles.remove, { backgroundColor: theme.colors.overlay }]}
          >
            <X size={16} color={theme.colors.onPrimary} />
          </PressableScale>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 4 },
  item: { position: 'relative' },
  thumb: { width: 96, height: 96 },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
