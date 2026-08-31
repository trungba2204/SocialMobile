import api from './client';
import type { AuthResponse, LoginInput, RegisterInput, TokenPair, UserDto } from './types';

export function register(body: RegisterInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', body).then((r) => r.data);
}

export function login(body: LoginInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', body).then((r) => r.data);
}

export function refresh(refreshToken: string): Promise<TokenPair> {
  return api.post<TokenPair>('/auth/refresh', { refreshToken }).then((r) => r.data);
}

export function logout(refreshToken: string): Promise<void> {
  return api.post('/auth/logout', { refreshToken }).then(() => undefined);
}

export function me(): Promise<UserDto> {
  return api.get<UserDto>('/auth/me').then((r) => r.data);
}
