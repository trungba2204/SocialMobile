import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RequestRow } from '@/features/friends/components/RequestRow';
import type { FriendRequestDto } from '@/api/types';

const REQUEST: FriendRequestDto = {
  id: 7,
  requester: { id: 3, username: 'nova', displayName: 'Nova Reyes', avatarUrl: null, bio: null },
  status: 'PENDING',
  createdAt: new Date().toISOString(),
};

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('RequestRow', () => {
  it('renders the requester displayName', async () => {
    const { getByText } = await wrap(
      <RequestRow request={REQUEST} onAccept={jest.fn()} onReject={jest.fn()} pending={false} />,
    );
    expect(getByText('Nova Reyes')).toBeTruthy();
  });

  it('calls onAccept with the request id', async () => {
    const onAccept = jest.fn();
    const { getByText } = await wrap(
      <RequestRow request={REQUEST} onAccept={onAccept} onReject={jest.fn()} pending={false} />,
    );
    fireEvent.press(getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith(7);
  });

  it('calls onReject with the request id', async () => {
    const onReject = jest.fn();
    const { getByText } = await wrap(
      <RequestRow request={REQUEST} onAccept={jest.fn()} onReject={onReject} pending={false} />,
    );
    fireEvent.press(getByText('Decline'));
    expect(onReject).toHaveBeenCalledWith(7);
  });

  it('disables both buttons while pending', async () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const { getByText } = await wrap(
      <RequestRow request={REQUEST} onAccept={onAccept} onReject={onReject} pending />,
    );
    fireEvent.press(getByText('Accept'));
    fireEvent.press(getByText('Decline'));
    expect(onAccept).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });
});
