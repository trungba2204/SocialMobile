import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function NotificationsScreen() {
  return (
    <ScreenContainer testID="notifications-screen" padded>
      <Text variant="heading">Notifications</Text>
    </ScreenContainer>
  );
}
