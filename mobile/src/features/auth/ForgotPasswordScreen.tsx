import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function ForgotPasswordScreen() {
  return (
    <ScreenContainer testID="forgot-password-screen" padded>
      <Text variant="heading">Reset password</Text>
    </ScreenContainer>
  );
}
