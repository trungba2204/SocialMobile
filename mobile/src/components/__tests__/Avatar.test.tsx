import { render } from '@testing-library/react-native';
import { Avatar } from '@/components/Avatar';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('renders initials when uri is null', async () => {
  const { getByText } = await wrap(<Avatar uri={null} name="Alice Brown" size={40} />);
  expect(getByText('AB')).toBeTruthy();
});

it('renders an image when a uri is provided', async () => {
  const { getByLabelText } = await wrap(
    <Avatar uri="https://example.com/a.png" name="Alice Brown" size={40} />,
  );
  expect(getByLabelText('Alice Brown avatar')).toBeTruthy();
});
