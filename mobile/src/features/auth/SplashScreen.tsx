import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/theme/useTheme';
import { useAuthStore } from '@/store/useAuthStore';

export function SplashScreen() {
  const theme = useTheme();

  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  return (
    <ScreenContainer testID="splash-screen">
      <View style={styles.center}>
        <Logo />
        <ActivityIndicator style={styles.spinner} color={theme.colors.primary} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: 24 },
});
