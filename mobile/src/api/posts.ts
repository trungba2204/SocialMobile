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
  // React Native FormData: a { string, type, name } object produces a part
  // whose Content-Type is `application/json`, which Spring's
  // `@RequestPart("post") CreatePostRequest` requires to bind (an untyped
  // string part fails with 500 — verified against the backend, Task 11 Step 2).
  form.append('post', {
    string: JSON.stringify(fields),
    type: 'application/json',
    name: 'post',
  } as unknown as Blob);
  media.forEach((asset, i) => {
    form.append('media', {
      ...buildFilePart(asset),
      name: asset.name ?? `media_${i}.jpg`,
      type: asset.type ?? 'image/jpeg',
    } as unknown as Blob);
  });
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
