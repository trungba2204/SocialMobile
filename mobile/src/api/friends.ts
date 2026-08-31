import api from './client';
import type { FriendRequestDto, Page, UserDto } from './types';

const DEFAULT_SIZE = 20;

export function list(page: number, size: number = DEFAULT_SIZE): Promise<Page<UserDto>> {
  return api
    .get<Page<UserDto>>('/friends', { params: { page, size } })
    .then((r) => r.data);
}

export function requests(
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<FriendRequestDto>> {
  return api
    .get<Page<FriendRequestDto>>('/friends/requests', { params: { page, size } })
    .then((r) => r.data);
}

export function suggestions(): Promise<UserDto[]> {
  return api.get<UserDto[]>('/friends/suggestions').then((r) => r.data);
}

export function sendRequest(userId: number): Promise<FriendRequestDto> {
  return api
    .post<FriendRequestDto>(`/friends/requests/${userId}`)
    .then((r) => r.data);
}

export function accept(id: number): Promise<void> {
  return api.post(`/friends/requests/${id}/accept`).then(() => undefined);
}

export function reject(id: number): Promise<void> {
  return api.post(`/friends/requests/${id}/reject`).then(() => undefined);
}

export function remove(userId: number): Promise<void> {
  return api.delete(`/friends/${userId}`).then(() => undefined);
}
