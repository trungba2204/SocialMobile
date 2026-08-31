import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('fires onPress', async () => {
  const onPress = jest.fn();
  const { getByText } = await wrap(<Button label="Go" onPress={onPress} />);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalled();
});

it('does not fire when loading', async () => {
  const onPress = jest.fn();
  const { getByLabelText } = await wrap(<Button label="Go" onPress={onPress} loading />);
  fireEvent.press(getByLabelText('Go'));
  expect(onPress).not.toHaveBeenCalled();
});

it('does not fire when disabled', async () => {
  const onPress = jest.fn();
  const { getByLabelText } = await wrap(<Button label="Go" onPress={onPress} disabled />);
  fireEvent.press(getByLabelText('Go'));
  expect(onPress).not.toHaveBeenCalled();
});

it('exposes disabled accessibility state when loading', async () => {
  const { getByLabelText } = await wrap(<Button label="Go" onPress={jest.fn()} loading />);
  expect(getByLabelText('Go').props.accessibilityState).toMatchObject({ disabled: true });
});
