import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL } from '@/lib/apiUrl';

import { toApiError } from './errors';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStore';
import type { TokenPair } from './types';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

let refreshPromise: Promise<TokenPair> | null = null;

async function doRefresh(): Promise<TokenPair> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new AxiosError('Missing refresh token', 'ENOREFRESH');
  }
  const res = await api.post<TokenPair>('/auth/refresh', { refreshToken });
  const pair = res.data;
  setAccessToken(pair.accessToken);
  await setRefreshToken(pair.refreshToken);
  return pair;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthPath = original?.url?.includes('/auth/') ?? false;

    if (status === 401 && original && !original._retry && !isAuthPath) {
      original._retry = true;
      try {
        refreshPromise ??= doRefresh();
        const pair = await refreshPromise;
        refreshPromise = null;
        const headers = AxiosHeaders.from(original.headers);
        headers.set('Authorization', `Bearer ${pair.accessToken}`);
        original.headers = headers;
        return api(original);
      } catch (e) {
        refreshPromise = null;
        unauthorizedHandler?.();
        return Promise.reject(toApiError(e));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export default api;
