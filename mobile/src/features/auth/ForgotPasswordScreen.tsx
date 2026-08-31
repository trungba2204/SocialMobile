import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { haptics } from '@/lib/haptics';
import { validateEmail } from '@/lib/validation';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthShell } from './components/AuthShell';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const CONFIRMATION = "If an account exists for that email, you'll receive a reset link.";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  function onSubmit() {
    const err = validateEmail(email.trim());
    if (err) {
      setError(err);
      return;
    }
    setError(undefined);
    // M1: UI only — no forgot-password endpoint yet. No network call is made.
    haptics.success();
    setSent(true);
  }

  return (
    <AuthShell
      testID="forgot-password-screen"
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Button
          label="Back to log in"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('Login')}
        />
      }
    >
      {sent ? (
        <Text variant="body" color="textSecondary">
          {CONFIRMATION}
        </Text>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError(undefined);
            }}
            error={error}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
          <Button label="Send reset link" fullWidth onPress={onSubmit} />
        </>
      )}
    </AuthShell>
  );
}
