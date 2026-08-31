import api from './client';
import { buildFilePart } from './media';
import type {
  CreatePostInput,
  LikeResponse,
  Page,
  PostDto,
  PostFields,
} from './types';

const DEFAULT_SIZE = 20;

export function feed(
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<PostDto>> {
  return api
    .get<Page<PostDto>>('/posts', { params: { page, size } })
    .then((r) => r.data);
}

export function get(id: number): Promise<PostDto> {
  return api.get<PostDto>(`/posts/${id}`).then((r) => r.data);
}

export function create(input: CreatePostInput): Promise<PostDto> {
  const { media = [], ...fields } = input;
  const form = new FormData();
  form.append('post', JSON.stringify(fields));
  for (const asset of media) {
    form.append('media', buildFilePart(asset) as unknown as Blob);
  }
  return api
    .post<PostDto>('/posts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function update(id: number, body: PostFields): Promise<PostDto> {
  return api.put<PostDto>(`/posts/${id}`, body).then((r) => r.data);
}

export function remove(id: number): Promise<void> {
  return api.delete(`/posts/${id}`).then(() => undefined);
}

export function like(id: number): Promise<LikeResponse> {
  return api.post<LikeResponse>(`/posts/${id}/like`).then((r) => r.data);
}

export function unlike(id: number): Promise<LikeResponse> {
  return api.delete<LikeResponse>(`/posts/${id}/like`).then((r) => r.data);
}

export function share(id: number, caption?: string): Promise<PostDto> {
  return api
    .post<PostDto>(`/posts/${id}/share`, caption == null ? undefined : { caption })
    .then((r) => r.data);
}
