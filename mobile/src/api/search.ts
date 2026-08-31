import api from './client';
import type { Page, PostDto, UserDto } from './types';

const DEFAULT_SIZE = 20;

export function users(
  q: string,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<UserDto>> {
  return api
    .get<Page<UserDto>>('/search/users', { params: { q, page, size } })
    .then((r) => r.data);
}

export function posts(
  q: string,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<PostDto>> {
  return api
    .get<Page<PostDto>>('/search/posts', { params: { q, page, size } })
    .then((r) => r.data);
}
