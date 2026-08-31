import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function CommentsScreen() {
  return (
    <ScreenContainer testID="comments-screen" padded>
      <Text variant="heading">Comments</Text>
    </ScreenContainer>
  );
}
