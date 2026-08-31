import api from './client';
import type { NotificationDto, Page } from './types';

const DEFAULT_SIZE = 20;

export function list(
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<{ page: Page<NotificationDto>; unread: number }> {
  return api
    .get<Page<NotificationDto>>('/notifications', { params: { page, size } })
    .then((r) => {
      const header = r.headers?.['x-unread-count'];
      const unread = header == null ? 0 : Number(header) || 0;
      return { page: r.data, unread };
    });
}

export function markRead(id: number): Promise<void> {
  return api.post(`/notifications/${id}/read`).then(() => undefined);
}

export function markAllRead(): Promise<void> {
  return api.post('/notifications/read-all').then(() => undefined);
}
