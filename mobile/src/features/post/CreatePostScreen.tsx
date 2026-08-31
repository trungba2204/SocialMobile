import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function CreatePostScreen() {
  return (
    <ScreenContainer testID="create-post-screen" padded>
      <Text variant="heading">Create post</Text>
    </ScreenContainer>
  );
}
