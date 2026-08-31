import { render, fireEvent, act } from '@testing-library/react-native';
import { TextField } from '@/components/TextField';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('renders the label', async () => {
  const { getByText } = await wrap(
    <TextField label="Email" value="" onChangeText={jest.fn()} />,
  );
  expect(getByText('Email')).toBeTruthy();
});

it('shows error text when passed', async () => {
  const { getByText } = await wrap(
    <TextField label="Email" value="" onChangeText={jest.fn()} error="Required" />,
  );
  expect(getByText('Required')).toBeTruthy();
});

it('secure toggle flips visibility', async () => {
  const { getByLabelText, queryByLabelText } = await wrap(
    <TextField label="Password" value="secret" onChangeText={jest.fn()} secureTextEntry />,
  );
  const input = getByLabelText('Password');
  expect(input.props.secureTextEntry).toBe(true);
  await act(async () => {
    fireEvent.press(getByLabelText('Show password'));
  });
  expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
  expect(queryByLabelText('Hide password')).toBeTruthy();
});
