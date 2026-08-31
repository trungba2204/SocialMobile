import { render, act } from '@testing-library/react-native';
import { ToastHost } from '@/components/Toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/store/useUiStore';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const wrap = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.useFakeTimers();
  useUiStore.getState().hideToast();
});

afterEach(() => {
  jest.useRealTimers();
});

it('shows the toast message and auto-hides after 3s', async () => {
  const { queryByText } = await wrap(<ToastHost />);

  await act(async () => {
    useUiStore.getState().showToast({ message: 'Saved', tone: 'success' });
  });
  expect(queryByText('Saved')).toBeTruthy();

  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(queryByText('Saved')).toBeNull();
});
