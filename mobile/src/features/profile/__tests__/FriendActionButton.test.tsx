import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import type { FriendStatus } from '@/api/types';
import { FriendActionButton } from '../components/FriendActionButton';

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function setup(status: FriendStatus) {
  const onAdd = jest.fn();
  const onAcceptNavigate = jest.fn();
  const onUnfriend = jest.fn();
  const view = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <FriendActionButton
          status={status}
          onAdd={onAdd}
          onAcceptNavigate={onAcceptNavigate}
          onUnfriend={onUnfriend}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { view, onAdd, onAcceptNavigate, onUnfriend };
}

describe('FriendActionButton', () => {
  it('NONE shows "Add friend" and calls onAdd', async () => {
    const { view, onAdd } = await setup('NONE');
    const { getByText } = view;
    fireEvent.press(getByText('Add friend'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('PENDING_IN shows "Accept" and calls onAcceptNavigate', async () => {
    const { view, onAcceptNavigate } = await setup('PENDING_IN');
    const { getByText } = view;
    fireEvent.press(getByText('Accept'));
    expect(onAcceptNavigate).toHaveBeenCalled();
  });

  it('FRIENDS shows "Friends" and its menu calls onUnfriend', async () => {
    const { view, onUnfriend } = await setup('FRIENDS');
    fireEvent.press(view.getByText('Friends'));
    fireEvent.press(await view.findByText('Unfriend'));
    expect(onUnfriend).toHaveBeenCalled();
  });

  it('SELF renders nothing', async () => {
    const { view } = await setup('SELF');
    expect(view.queryByText('Add friend')).toBeNull();
    expect(view.queryByText('Accept')).toBeNull();
    expect(view.queryByText('Friends')).toBeNull();
    expect(view.queryByText('Requested')).toBeNull();
  });
});
