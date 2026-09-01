import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { validateBio, validateDisplayName } from '@/lib/validation';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import type { PickedAsset } from '@/api/media';
import * as users from '@/api/users';
import { COVER_HEIGHT } from './components/ProfileHeader';

function toPickedAsset(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `upload_${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

const AVATAR_SIZE = 88;
// White ring around the avatar where it overlaps the cover.
const AVATAR_RING = 3;

export function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const showToast = useUiStore((s) => s.showToast);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const nameError = validateDisplayName(displayName);
  const bioError = validateBio(bio);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return toPickedAsset(result.assets[0]);
  };

  const onPickAvatar = async () => {
    const asset = await pick();
    if (!asset) return;
    setUploadingAvatar(true);
    try {
      const { url } = await users.uploadAvatar(asset);
      patchUser({ avatarUrl: url });
    } catch {
      showToast({ message: 'Could not upload photo', tone: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onPickCover = async () => {
    const asset = await pick();
    if (!asset) return;
    setUploadingCover(true);
    try {
      const { url } = await users.uploadCover(asset);
      setCoverUrl(url);
    } catch {
      showToast({ message: 'Could not upload cover', tone: 'error' });
    } finally {
      setUploadingCover(false);
    }
  };

  const onSave = async () => {
    if (nameError || bioError || saving) return;
    setSaving(true);
    try {
      const updated = await users.updateMe({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      patchUser(updated);
      navigation.goBack();
    } catch {
      showToast({ message: 'Could not save profile', tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <ScreenContainer testID="edit-profile-screen" scroll keyboardAvoiding>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Change cover photo"
        onPress={onPickCover}
        style={[styles.cover, { height: COVER_HEIGHT, backgroundColor: theme.colors.primaryMuted }]}
      >
        {coverUrl ? (
          <Image
            source={{ uri: resolveMediaUrl(coverUrl) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
        <View style={[styles.coverBadge, { gap: theme.space.xs }]}>
          <Camera size={18} color={theme.colors.onPrimary} />
          <Text variant="metadata" color="onPrimary">
            {uploadingCover ? 'Uploading…' : 'Edit cover'}
          </Text>
        </View>
      </PressableScale>

      <View style={{ padding: theme.space.lg, gap: theme.space.lg }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={onPickAvatar}
          style={[styles.avatarRow, { marginTop: -AVATAR_SIZE / 2 - theme.space.lg, gap: theme.space.md }]}
        >
          <View style={[styles.avatarWrap, { borderColor: theme.colors.background }]}>
            <Avatar uri={user?.avatarUrl} name={user?.displayName ?? ''} size={AVATAR_SIZE} />
          </View>
          <Text variant="button" color="primary">
            {uploadingAvatar ? 'Uploading…' : 'Change photo'}
          </Text>
        </PressableScale>

        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={60}
          error={nameError ?? undefined}
        />

        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={280}
          error={bioError ?? undefined}
          helper={`${bio.length}/280`}
        />

        <Button
          label="Save"
          fullWidth
          onPress={onSave}
          loading={saving}
          disabled={!!nameError || !!bioError}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverBadge: { flexDirection: 'row', alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderRadius: AVATAR_SIZE / 2 + AVATAR_RING, borderWidth: AVATAR_RING },
});
