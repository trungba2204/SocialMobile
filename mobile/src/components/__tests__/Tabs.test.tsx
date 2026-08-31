import { render, fireEvent } from '@testing-library/react-native';
import { Tabs } from '@/components/Tabs';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const tabs = [
  { key: 'feed', label: 'Feed' },
  { key: 'popular', label: 'Popular' },
];

it('renders each tab label', async () => {
  const { getByText } = await wrap(<Tabs tabs={tabs} active="feed" onChange={jest.fn()} />);
  expect(getByText('Feed')).toBeTruthy();
  expect(getByText('Popular')).toBeTruthy();
});

it('calls onChange with the tab key when pressed', async () => {
  const onChange = jest.fn();
  const { getByText } = await wrap(<Tabs tabs={tabs} active="feed" onChange={onChange} />);
  fireEvent.press(getByText('Popular'));
  expect(onChange).toHaveBeenCalledWith('popular');
});
