import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function EditProfileScreen() {
  return (
    <ScreenContainer testID="edit-profile-screen" padded>
      <Text variant="heading">Edit profile</Text>
    </ScreenContainer>
  );
}
