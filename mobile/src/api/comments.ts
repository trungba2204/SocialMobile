import api from './client';
import type { CommentDto, Page } from './types';

const DEFAULT_SIZE = 20;

export function list(
  postId: number,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<CommentDto>> {
  return api
    .get<Page<CommentDto>>(`/posts/${postId}/comments`, { params: { page, size } })
    .then((r) => r.data);
}

export function create(
  postId: number,
  content: string,
  parentId?: number,
): Promise<CommentDto> {
  return api
    .post<CommentDto>(`/posts/${postId}/comments`, {
      content,
      ...(parentId == null ? {} : { parentId }),
    })
    .then((r) => r.data);
}

export function remove(id: number): Promise<void> {
  return api.delete(`/comments/${id}`).then(() => undefined);
}
