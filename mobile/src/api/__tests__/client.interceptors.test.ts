import AxiosMockAdapter from 'axios-mock-adapter';
import * as SecureStore from 'expo-secure-store';

import api, { setUnauthorizedHandler } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getAccessToken, setAccessToken } from '@/api/tokenStore';

let mock: AxiosMockAdapter;

beforeEach(() => {
  mock = new AxiosMockAdapter(api);
  setAccessToken(null);
  setUnauthorizedHandler(() => {});
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-token-1');
  (SecureStore.setItemAsync as jest.Mock).mockClear();
});

afterEach(() => {
  mock.restore();
  jest.clearAllMocks();
});

it('401 triggers exactly one refresh then replays the request', async () => {
  let refreshCalls = 0;
  let postAttempts = 0;

  mock.onPost('/auth/refresh').reply(() => {
    refreshCalls += 1;
    return [200, { accessToken: 'new-access', refreshToken: 'new-refresh' }];
  });
  mock.onGet('/posts').reply((config) => {
    postAttempts += 1;
    if (postAttempts === 1) return [401, { message: 'expired' }];
    expect(config.headers?.Authorization).toBe('Bearer new-access');
    return [200, { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true }];
  });

  const res = await api.get('/posts');
  expect(res.status).toBe(200);
  expect(refreshCalls).toBe(1);
  expect(postAttempts).toBe(2);
  expect(getAccessToken()).toBe('new-access');
});

it('concurrent 401s share a single refresh', async () => {
  let refreshCalls = 0;
  const attempts: Record<string, number> = {};

  mock.onPost('/auth/refresh').reply(() => {
    refreshCalls += 1;
    return [200, { accessToken: 'a2', refreshToken: 'r2' }];
  });
  const handler = (url: string) => (): [number, unknown] => {
    attempts[url] = (attempts[url] ?? 0) + 1;
    if (attempts[url] === 1) return [401, { message: 'expired' }];
    return [200, { ok: true }];
  };
  mock.onGet('/a').reply(handler('/a'));
  mock.onGet('/b').reply(handler('/b'));

  await Promise.all([api.get('/a'), api.get('/b')]);
  expect(refreshCalls).toBe(1);
});

it('failed refresh calls the unauthorized handler and rejects with ApiError', async () => {
  const onUnauthorized = jest.fn();
  setUnauthorizedHandler(onUnauthorized);

  mock.onPost('/auth/refresh').reply(401, { message: 'bad refresh' });
  mock.onGet('/posts').reply(401, { message: 'expired' });

  await expect(api.get('/posts')).rejects.toBeInstanceOf(ApiError);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});
