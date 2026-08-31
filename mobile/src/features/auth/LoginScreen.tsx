import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function LoginScreen() {
  return (
    <ScreenContainer testID="login-screen" padded>
      <Text variant="heading">Log in</Text>
    </ScreenContainer>
  );
}
