import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { X } from 'lucide-react-native';
import { useUiStore } from '@/store/useUiStore';
import type { PickedAsset } from '@/api/media';
import * as stories from '@/api/stories';

const CAPTION_MAX = 200;

function toPickedAsset(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `story_${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export function AddStoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const showToast = useUiStore((s) => s.showToast);

  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const picked = useRef(false);

  useEffect(() => {
    if (picked.current) return;
    picked.current = true;
    (async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (result.canceled || !result.assets?.[0]) {
        navigation.goBack();
        return;
      }
      setAsset(toPickedAsset(result.assets[0]));
    })();
  }, [navigation]);

  const onShare = async () => {
    if (!asset || uploading) return;
    setUploading(true);
    try {
      await stories.create(asset, caption.trim() || undefined);
      showToast({ message: 'Story shared', tone: 'success' });
      navigation.goBack();
    } catch {
      showToast({ message: 'Could not share story', tone: 'error' });
      setUploading(false);
    }
  };

  return (
    <View
      testID="add-story-screen"
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      {asset ? (
        <Image
          source={{ uri: asset.uri }}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          testID="add-story-preview"
        />
      ) : null}

      <View style={[styles.header, { paddingTop: insets.top + theme.space.sm, paddingHorizontal: theme.space.lg }]}>
        <IconButton
          icon={X}
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close"
        />
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + theme.space.lg,
            paddingHorizontal: theme.space.lg,
            gap: theme.space.md,
          },
        ]}
      >
        {asset ? (
          <>
            <TextField
              label="Caption"
              value={caption}
              onChangeText={setCaption}
              maxLength={CAPTION_MAX}
              placeholder="Add a caption…"
              helper={`${caption.length}/${CAPTION_MAX}`}
            />
            <Button
              label="Share story"
              fullWidth
              onPress={onShare}
              loading={uploading}
              disabled={uploading}
            />
          </>
        ) : (
          <Text variant="body" color="textSecondary">
            Opening your photos…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'flex-start' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
