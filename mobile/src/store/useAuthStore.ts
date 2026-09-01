import { create } from 'zustand';

import * as auth from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';
import {
  clearTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/api/tokenStore';
import type { AuthResponse, TokenPair, UserDto } from '@/api/types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  accessToken: string | null;
  bootstrap(): Promise<void>;
  setSession(a: AuthResponse): Promise<void>;
  applyTokens(t: TokenPair): Promise<void>;
  patchUser(p: Partial<UserDto>): void;
  signOut(): Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,

  bootstrap: async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await get().signOut();
      return;
    }
    try {
      const pair = await auth.refresh(refreshToken);
      await get().applyTokens(pair);
      const user = await auth.me();
      set({ user, status: 'signedIn' });
    } catch {
      await get().signOut();
    }
  },

  setSession: async (a) => {
    setAccessToken(a.accessToken);
    await setRefreshToken(a.refreshToken);
    set({ accessToken: a.accessToken, user: a.user, status: 'signedIn' });
  },

  applyTokens: async (t) => {
    setAccessToken(t.accessToken);
    await setRefreshToken(t.refreshToken);
    set({ accessToken: t.accessToken });
  },

  patchUser: (p) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...p } });
  },

  signOut: async () => {
    await clearTokens();
    set({ status: 'signedOut', user: null, accessToken: null });
  },
}));

setUnauthorizedHandler(() => {
  void useAuthStore.getState().signOut();
});
