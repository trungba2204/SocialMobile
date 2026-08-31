import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function FriendsScreen() {
  return (
    <ScreenContainer testID="friends-screen" padded>
      <Text variant="heading">Friends</Text>
    </ScreenContainer>
  );
}
