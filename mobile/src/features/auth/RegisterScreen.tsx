import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function RegisterScreen() {
  return (
    <ScreenContainer testID="register-screen" padded>
      <Text variant="heading">Create account</Text>
    </ScreenContainer>
  );
}
