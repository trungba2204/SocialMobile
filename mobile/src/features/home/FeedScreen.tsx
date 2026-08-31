import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function FeedScreen() {
  return (
    <ScreenContainer testID="feed-screen" padded>
      <Text variant="heading">Feed</Text>
    </ScreenContainer>
  );
}
