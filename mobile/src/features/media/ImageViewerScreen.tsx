import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function ImageViewerScreen() {
  return (
    <ScreenContainer testID="image-viewer-screen" padded>
      <Text variant="heading">Image</Text>
    </ScreenContainer>
  );
}
