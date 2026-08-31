import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function ProfileScreen() {
  return (
    <ScreenContainer testID="profile-screen" padded>
      <Text variant="heading">Profile</Text>
    </ScreenContainer>
  );
}
