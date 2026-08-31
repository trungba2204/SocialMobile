import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function ChatScreen() {
  return (
    <ScreenContainer testID="chat-screen" padded>
      <Text variant="heading">Chat</Text>
    </ScreenContainer>
  );
}
