import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/useTheme';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/api/auth';
import { ApiError } from '@/api/errors';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/validation';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthShell } from './components/AuthShell';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type FieldErrors = {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  form?: string;
};

export function RegisterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const next: FieldErrors = {
      email: validateEmail(email.trim()) ?? undefined,
      username: validateUsername(username.trim()) ?? undefined,
      displayName: validateDisplayName(displayName.trim()) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    if (next.email || next.username || next.displayName || next.password) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const auth = await authApi.register({
        email: email.trim(),
        username: username.trim(),
        displayName: displayName.trim(),
        password,
      });
      haptics.success();
      await useAuthStore.getState().setSession(auth);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 0);
      haptics.error();
      const fieldErrors = apiError.fieldErrors;
      if (Object.keys(fieldErrors).length > 0) {
        setErrors({
          email: fieldErrors.email,
          username: fieldErrors.username,
          displayName: fieldErrors.displayName,
          password: fieldErrors.password,
        });
      } else if (apiError.status === 409) {
        const msg = apiError.message;
        if (/user\s?name/i.test(msg)) setErrors({ username: msg });
        else if (/e-?mail/i.test(msg)) setErrors({ email: msg });
        else setErrors({ form: msg });
      } else {
        setErrors({ form: apiError.message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      testID="register-screen"
      title="Create your Orbit"
      subtitle="A calmer place for the people you care about."
      footer={
        <Button
          label="Already have an account? Log in"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('Login')}
        />
      }
    >
      {errors.form ? (
        <Text variant="caption" color="error">
          {errors.form}
        </Text>
      ) : null}

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField
        label="Username"
        placeholder="your_handle"
        value={username}
        onChangeText={setUsername}
        error={errors.username}
        helper="lowercase letters, digits and underscores"
        autoCapitalize="none"
      />
      <TextField
        label="Display name"
        placeholder="How your name appears"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        maxLength={60}
      />
      <TextField
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        helper="at least 8 characters, with a letter and a digit"
        secureTextEntry
        autoCapitalize="none"
      />
      <View style={{ gap: theme.space.md }}>
        <Button
          label="Create account"
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => void onSubmit()}
        />
      </View>
    </AuthShell>
  );
}
