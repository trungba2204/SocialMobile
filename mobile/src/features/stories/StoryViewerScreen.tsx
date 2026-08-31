import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function StoryViewerScreen() {
  return (
    <ScreenContainer testID="story-viewer-screen" padded>
      <Text variant="heading">Story</Text>
    </ScreenContainer>
  );
}
