import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/api/auth';
import * as tokenStore from '@/api/tokenStore';

jest.mock('@/api/auth');

beforeEach(() => {
  useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
  jest.clearAllMocks();
});

it('bootstrap with no refresh token → signedOut', async () => {
  jest.spyOn(tokenStore, 'getRefreshToken').mockResolvedValue(null);
  jest.spyOn(tokenStore, 'clearTokens').mockResolvedValue();
  await useAuthStore.getState().bootstrap();
  expect(useAuthStore.getState().status).toBe('signedOut');
});

it('bootstrap with valid refresh token → signedIn', async () => {
  jest.spyOn(tokenStore, 'getRefreshToken').mockResolvedValue('r1');
  jest.spyOn(tokenStore, 'setRefreshToken').mockResolvedValue();
  (authApi.refresh as jest.Mock).mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' });
  (authApi.me as jest.Mock).mockResolvedValue({
    id: 1,
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
    bio: null,
  });
  await useAuthStore.getState().bootstrap();
  const s = useAuthStore.getState();
  expect(s.status).toBe('signedIn');
  expect(s.user?.username).toBe('alice');
});

it('bootstrap failure → signedOut', async () => {
  jest.spyOn(tokenStore, 'getRefreshToken').mockResolvedValue('r1');
  jest.spyOn(tokenStore, 'clearTokens').mockResolvedValue();
  (authApi.refresh as jest.Mock).mockRejectedValue(new Error('bad'));
  await useAuthStore.getState().bootstrap();
  expect(useAuthStore.getState().status).toBe('signedOut');
});

it('setSession persists refresh token and sets user', async () => {
  const setRefresh = jest.spyOn(tokenStore, 'setRefreshToken').mockResolvedValue();
  await useAuthStore.getState().setSession({
    accessToken: 'a',
    refreshToken: 'r',
    user: { id: 1, username: 'alice', displayName: 'Alice', avatarUrl: null, bio: null },
  });
  expect(setRefresh).toHaveBeenCalledWith('r');
  expect(useAuthStore.getState().status).toBe('signedIn');
});

it('signOut clears tokens and returns to signedOut', async () => {
  const clear = jest.spyOn(tokenStore, 'clearTokens').mockResolvedValue();
  await useAuthStore.getState().signOut();
  expect(clear).toHaveBeenCalled();
  expect(useAuthStore.getState().status).toBe('signedOut');
});
