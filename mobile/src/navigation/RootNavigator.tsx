import { useAuthStore } from '@/store/useAuthStore';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <SplashScreen />;
  if (status === 'signedOut') return <AuthNavigator />;
  return <AppNavigator />;
}
