import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from '@/components/PressableScale';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import type { PostMediaDto } from '@/api/types';

export type PostMediaGridProps = {
  media: PostMediaDto[];
  onPress?: () => void;
};

// Hairline gutter between media tiles — deliberately sub-token (tighter than space.xs).
const TILE_GAP = 2;

function Tile({ item, style }: { item: PostMediaDto; style?: object }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.colors.border }, style]}>
      <Image
        source={{ uri: resolveMediaUrl(item.url) }}
        contentFit="cover"
        transition={150}
        style={StyleSheet.absoluteFill}
        accessibilityLabel="Post media"
      />
      {item.type === 'VIDEO' ? (
        <View style={[styles.playWrap, { backgroundColor: theme.colors.overlay }]}>
          <Play size={22} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
        </View>
      ) : null}
    </View>
  );
}

export function PostMediaGrid({ media, onPress }: PostMediaGridProps) {
  if (!media || media.length === 0) return null;

  const ordered = [...media].sort((a, b) => a.position - b.position).slice(0, 4);
  const count = ordered.length;

  let layout;
  if (count === 1) {
    layout = <Tile item={ordered[0]!} style={{ aspectRatio: 1 }} />;
  } else if (count === 2) {
    layout = (
      <View style={[styles.row, { aspectRatio: 2 }]}>
        <Tile item={ordered[0]!} style={styles.flex} />
        <Tile item={ordered[1]!} style={styles.flex} />
      </View>
    );
  } else if (count === 3) {
    layout = (
      <View style={[styles.row, { aspectRatio: 1.6 }]}>
        <Tile item={ordered[0]!} style={styles.flex} />
        <View style={[styles.col, styles.flex]}>
          <Tile item={ordered[1]!} style={styles.flex} />
          <Tile item={ordered[2]!} style={styles.flex} />
        </View>
      </View>
    );
  } else {
    layout = (
      <View style={[styles.col, { aspectRatio: 1 }]}>
        <View style={[styles.row, styles.flex]}>
          <Tile item={ordered[0]!} style={styles.flex} />
          <Tile item={ordered[1]!} style={styles.flex} />
        </View>
        <View style={[styles.row, styles.flex]}>
          <Tile item={ordered[2]!} style={styles.flex} />
          <Tile item={ordered[3]!} style={styles.flex} />
        </View>
      </View>
    );
  }

  return (
    <PressableScale accessibilityRole="image" onPress={onPress} style={styles.container}>
      {layout}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  row: { flexDirection: 'row', gap: TILE_GAP },
  col: { flexDirection: 'column', gap: TILE_GAP },
  flex: { flex: 1 },
  tile: { overflow: 'hidden', position: 'relative' },
  playWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 48,
    height: 48,
    marginTop: -24,
    marginLeft: -24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
