import { render, fireEvent } from '@testing-library/react-native';
import { Inbox } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('renders title and body', async () => {
  const { getByText } = await wrap(
    <EmptyState icon={Inbox} title="Nothing here" body="Come back later" />,
  );
  expect(getByText('Nothing here')).toBeTruthy();
  expect(getByText('Come back later')).toBeTruthy();
});

it('renders action and calls onAction when pressed', async () => {
  const onAction = jest.fn();
  const { getByText } = await wrap(
    <EmptyState icon={Inbox} title="Empty" actionLabel="Refresh" onAction={onAction} />,
  );
  fireEvent.press(getByText('Refresh'));
  expect(onAction).toHaveBeenCalled();
});
