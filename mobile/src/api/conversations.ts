import api from './client';
import type { ConversationDto, MessageDto, Page } from './types';

const DEFAULT_SIZE = 20;

export function list(
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<ConversationDto>> {
  return api
    .get<Page<ConversationDto>>('/conversations', { params: { page, size } })
    .then((r) => r.data);
}

export function getOrCreate(peerUserId: number): Promise<ConversationDto> {
  return api
    .post<ConversationDto>('/conversations', { peerUserId })
    .then((r) => r.data);
}

export function get(id: number): Promise<ConversationDto> {
  return api.get<ConversationDto>(`/conversations/${id}`).then((r) => r.data);
}

export function messages(
  id: number,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<MessageDto>> {
  return api
    .get<Page<MessageDto>>(`/conversations/${id}/messages`, {
      params: { page, size },
    })
    .then((r) => r.data);
}

export function send(id: number, content: string): Promise<MessageDto> {
  return api
    .post<MessageDto>(`/conversations/${id}/messages`, { content })
    .then((r) => r.data);
}

export function markRead(id: number): Promise<void> {
  return api.post(`/conversations/${id}/read`).then(() => undefined);
}
