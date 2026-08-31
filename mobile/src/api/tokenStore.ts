import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'orbit.refresh';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(t: string | null): void {
  accessToken = t;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setRefreshToken(t: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, t);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
