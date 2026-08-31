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
import type { AuthStackParamList } from '@/navigation/types';
import { AuthShell } from './components/AuthShell';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    emailOrUsername?: string;
    password?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const next: typeof errors = {};
    if (!emailOrUsername.trim()) next.emailOrUsername = 'Enter your email or username';
    if (!password) next.password = 'Enter your password';
    if (next.emailOrUsername || next.password) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const auth = await authApi.login({ emailOrUsername: emailOrUsername.trim(), password });
      haptics.success();
      await useAuthStore.getState().setSession(auth);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 0);
      haptics.error();
      if (apiError.status === 401) {
        setErrors({ form: 'Incorrect email/username or password' });
      } else if (Object.keys(apiError.fieldErrors).length > 0) {
        setErrors({
          emailOrUsername: apiError.fieldErrors.emailOrUsername ?? apiError.fieldErrors.email,
          password: apiError.fieldErrors.password,
        });
      } else {
        setErrors({ form: apiError.message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      testID="login-screen"
      title="Welcome back"
      subtitle="Log in to see what's orbiting you."
      footer={
        <View style={{ gap: theme.space.sm, alignItems: 'flex-start' }}>
          <Button
            label="Forgot password?"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('ForgotPassword')}
          />
          <Button
            label="New here? Create an account"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      }
    >
      {errors.form ? (
        <Text variant="caption" color="error">
          {errors.form}
        </Text>
      ) : null}

      <TextField
        label="Email or username"
        placeholder="you@example.com or username"
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        error={errors.emailOrUsername}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
      <Button
        label="Log in"
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={() => void onSubmit()}
      />
    </AuthShell>
  );
}
