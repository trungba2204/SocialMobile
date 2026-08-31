import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/useAuthStore';

function renderRoot() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('RootNavigator', () => {
  it('shows the Login screen when signed out', async () => {
    useAuthStore.setState({ status: 'signedOut' });
    const { getByTestId } = await renderRoot();
    await waitFor(() => expect(getByTestId('login-screen')).toBeTruthy());
  });

  it('shows the Feed screen when signed in', async () => {
    useAuthStore.setState({ status: 'signedIn' });
    const { getByTestId } = await renderRoot();
    await waitFor(() => expect(getByTestId('feed-screen')).toBeTruthy());
  });
});
