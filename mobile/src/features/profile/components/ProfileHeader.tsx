import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Settings } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import type { FriendStatus, UserProfileDto } from '@/api/types';
import { ProfileStat } from './ProfileStat';
import { FriendActionButton } from './FriendActionButton';

export type ProfileHeaderProps = {
  profile: UserProfileDto;
  friendStatus: FriendStatus;
  isSelf: boolean;
  onEditProfile: () => void;
  onSettings: () => void;
  onAddFriend: () => void;
  onAcceptNavigate: () => void;
  onUnfriend: () => void;
  onMessage: () => void;
  onPressFriends: () => void;
};

const COVER_HEIGHT = 150;
const AVATAR_SIZE = 88;

export function ProfileHeader({
  profile,
  friendStatus,
  isSelf,
  onEditProfile,
  onSettings,
  onAddFriend,
  onAcceptNavigate,
  onUnfriend,
  onMessage,
  onPressFriends,
}: ProfileHeaderProps) {
  const theme = useTheme();

  return (
    <View>
      <View style={[styles.cover, { height: COVER_HEIGHT, backgroundColor: theme.colors.primaryMuted }]}>
        {profile.coverUrl ? (
          <Image
            source={{ uri: resolveMediaUrl(profile.coverUrl) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel="Cover photo"
          />
        ) : null}
      </View>

      <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.md }}>
        <View style={[styles.avatarRow, { marginTop: -AVATAR_SIZE / 2 }]}>
          <View style={[styles.avatarWrap, { borderColor: theme.colors.background }]}>
            <Avatar uri={profile.avatarUrl} name={profile.displayName} size={AVATAR_SIZE} />
          </View>
          {isSelf ? (
            <IconButton
              icon={Settings}
              accessibilityLabel="Settings"
              onPress={onSettings}
            />
          ) : null}
        </View>

        <View style={{ gap: theme.space.xs }}>
          <Text variant="heading" color="textPrimary">
            {profile.displayName}
          </Text>
          <Text variant="metadata" color="textSecondary">
            @{profile.username}
          </Text>
        </View>

        {profile.bio ? (
          <Text variant="body" color="textPrimary">
            {profile.bio}
          </Text>
        ) : null}

        <View style={styles.stats}>
          <ProfileStat label="Friends" value={profile.friendCount} onPress={onPressFriends} />
          <ProfileStat label="Posts" value={profile.postCount} />
        </View>

        <View style={[styles.actions, { gap: theme.space.md, marginBottom: theme.space.md }]}>
          {isSelf ? (
            <Button label="Edit profile" variant="secondary" onPress={onEditProfile} />
          ) : (
            <>
              <FriendActionButton
                status={friendStatus}
                onAdd={onAddFriend}
                onAcceptNavigate={onAcceptNavigate}
                onUnfriend={onUnfriend}
              />
              {friendStatus === 'FRIENDS' ? (
                <Button label="Message" onPress={onMessage} />
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', overflow: 'hidden' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  avatarWrap: { borderRadius: AVATAR_SIZE / 2 + 3, borderWidth: 3 },
  stats: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
