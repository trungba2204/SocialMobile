import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function ConversationListScreen() {
  return (
    <ScreenContainer testID="conversation-list-screen" padded>
      <Text variant="heading">Messages</Text>
    </ScreenContainer>
  );
}
