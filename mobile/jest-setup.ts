jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const React = require('react');
  const makeShared = (v: unknown) => ({ value: v });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    View,
    useSharedValue: (v: unknown) => makeShared(v),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useDerivedValue: (fn: () => unknown) => makeShared(fn()),
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
    withDelay: (_d: unknown, v: unknown) => v,
    runOnJS: (fn: (...a: unknown[]) => unknown) => fn,
    interpolate: (x: number) => x,
    interpolateColor: () => 'transparent',
    Easing: new Proxy({}, { get: () => () => 0 }),
    cancelAnimation: () => {},
    createAnimatedComponent: (c: unknown) => c,
    Extrapolation: { CLAMP: 'clamp' },
  };
});
jest.mock('lucide-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_t, name) => {
        if (name === '__esModule') return true;
        const Icon = (props: Record<string, unknown>) =>
          React.createElement('Icon', { ...props, name: String(name) });
        Icon.displayName = String(name);
        return Icon;
      },
    },
  );
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
}));
