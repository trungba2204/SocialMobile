import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { TextField } from '@/components/TextField';
import { BottomSheet } from '@/components/BottomSheet';
import { Divider } from '@/components/Divider';
import { PressableScale } from '@/components/PressableScale';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { haptics } from '@/lib/haptics';
import { validatePostContent } from '@/lib/validation';
import * as posts from '@/api/posts';
import type { PickedAsset } from '@/api/media';
import type { PostPrivacy } from '@/api/types';
import { PrivacyPicker } from './components/PrivacyPicker';
import { ComposerToolbar } from './components/ComposerToolbar';
import { SelectedMediaStrip } from './components/SelectedMediaStrip';

const MAX_MEDIA = 4;
const MAX_CONTENT = 5000;
const FEELINGS = ['happy', 'grateful', 'excited', 'relaxed', 'thoughtful', 'tired', 'motivated'];

function toPickedAsset(asset: ImagePicker.ImagePickerAsset, index: number): PickedAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `media_${Date.now()}_${index}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export function CreatePostScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('PUBLIC');
  const [feeling, setFeeling] = useState<string | undefined>();
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<PickedAsset[]>([]);
  const [inputHeight, setInputHeight] = useState(120);
  const [feelingOpen, setFeelingOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const contentError = useMemo(() => validatePostContent(content), [content]);
  const hasBody = content.trim().length > 0 || media.length > 0;
  const canPublish = hasBody && !contentError && !publishing;

  const onAddPhoto = async () => {
    const remaining = MAX_MEDIA - media.length;
    if (remaining <= 0) {
      showToast({ message: `You can add up to ${MAX_MEDIA} photos`, tone: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets) return;
    setMedia((prev) => [...prev, ...result.assets.map(toPickedAsset)].slice(0, MAX_MEDIA));
  };

  const removeMedia = (index: number) =>
    setMedia((prev) => prev.filter((_, i) => i !== index));

  const onPublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    try {
      await posts.create({
        content: content.trim() || undefined,
        privacy,
        feeling,
        location: location.trim() || undefined,
        media,
      });
      haptics.success();
      showToast({ message: 'Posted', tone: 'success' });
      navigation.goBack();
    } catch {
      setPublishing(false);
      showToast({ message: 'Could not publish post', tone: 'error' });
    }
  };

  return (
    <SafeAreaView
      testID="create-post-screen"
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.sm, borderBottomColor: theme.colors.border },
        ]}
      >
        <IconButton
          icon={X}
          accessibilityLabel="Close"
          onPress={() => navigation.goBack()}
        />
        <Text variant="heading">New post</Text>
        <View style={styles.headerAction}>
          <Button
            label="Publish"
            size="sm"
            loading={publishing}
            disabled={!canPublish}
            onPress={onPublish}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authorRow}>
            <Avatar uri={user?.avatarUrl} name={user?.displayName ?? 'You'} size={44} />
            <View style={styles.authorText}>
              <Text variant="body">{user?.displayName ?? 'You'}</Text>
              <PrivacyPicker value={privacy} onChange={setPrivacy} />
            </View>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.body.fontFamily,
                fontSize: theme.typography.body.fontSize,
                minHeight: Math.max(120, inputHeight),
              },
            ]}
            value={content}
            onChangeText={setContent}
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height + theme.space.md)
            }
            placeholder="What's happening in your orbit?"
            placeholderTextColor={theme.colors.textDim}
            multiline
            maxLength={MAX_CONTENT}
            accessibilityLabel="Post content"
          />

          {feeling ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Clear feeling"
              onPress={() => setFeeling(undefined)}
              style={styles.tagRow}
            >
              <Text variant="metadata" color="textSecondary">
                Feeling {feeling} · tap to clear
              </Text>
            </PressableScale>
          ) : null}
          {location.trim() ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Clear location"
              onPress={() => setLocation('')}
              style={styles.tagRow}
            >
              <Text variant="metadata" color="textSecondary">
                At {location.trim()} · tap to clear
              </Text>
            </PressableScale>
          ) : null}

          <SelectedMediaStrip media={media} onRemove={removeMedia} />

          {contentError ? (
            <Text variant="caption" color="error">
              {contentError}
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.toolbar,
            { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md },
          ]}
        >
          <ComposerToolbar
            onAddPhoto={onAddPhoto}
            onFeeling={() => setFeelingOpen(true)}
            onLocation={() => setLocationOpen(true)}
            photoDisabled={media.length >= MAX_MEDIA}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={feelingOpen} onClose={() => setFeelingOpen(false)}>
        <Text variant="heading">How are you feeling?</Text>
        <View style={{ marginTop: theme.space.md }}>
          {FEELINGS.map((f, i) => (
            <View key={f}>
              {i > 0 ? <Divider /> : null}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={f}
                onPress={() => {
                  setFeeling(f);
                  setFeelingOpen(false);
                }}
                style={{ paddingVertical: theme.space.md }}
              >
                <Text variant="body">{f[0]!.toUpperCase() + f.slice(1)}</Text>
              </PressableScale>
            </View>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={locationOpen} onClose={() => setLocationOpen(false)}>
        <Text variant="heading">Add location</Text>
        <View style={{ marginTop: theme.space.md, gap: theme.space.md }}>
          <TextField
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="Where are you?"
            maxLength={160}
            autoFocus
          />
          <Button label="Done" onPress={() => setLocationOpen(false)} fullWidth />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAction: { minWidth: 88, alignItems: 'flex-end' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorText: { gap: 4 },
  input: { padding: 0, margin: 0, textAlignVertical: 'top' },
  tagRow: { alignSelf: 'flex-start' },
  toolbar: {},
});
