import api from './client';
import { buildFilePart, type PickedAsset } from './media';
import type { Page, StoryDto, StoryReelDto, UserDto } from './types';

const DEFAULT_SIZE = 20;

export function reels(): Promise<StoryReelDto[]> {
  return api.get<StoryReelDto[]>('/stories').then((r) => r.data);
}

export function create(asset: PickedAsset, caption?: string): Promise<StoryDto> {
  const form = new FormData();
  form.append('file', buildFilePart(asset) as unknown as Blob);
  if (caption != null && caption !== '') {
    form.append('caption', caption);
  }
  return api
    .post<StoryDto>('/stories', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function get(id: number): Promise<StoryDto> {
  return api.get<StoryDto>(`/stories/${id}`).then((r) => r.data);
}

export function remove(id: number): Promise<void> {
  return api.delete(`/stories/${id}`).then(() => undefined);
}

export function markViewed(id: number): Promise<void> {
  return api.post(`/stories/${id}/view`).then(() => undefined);
}

export function viewers(
  id: number,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<UserDto>> {
  return api
    .get<Page<UserDto>>(`/stories/${id}/viewers`, { params: { page, size } })
    .then((r) => r.data);
}
