import api from './client';
import { buildFilePart, type PickedAsset } from './media';
import type {
  Page,
  PostDto,
  UpdateMeInput,
  UploadUrlResponse,
  UserDto,
  UserProfileDto,
} from './types';

const DEFAULT_SIZE = 20;

export function getProfile(id: number): Promise<UserProfileDto> {
  return api.get<UserProfileDto>(`/users/${id}`).then((r) => r.data);
}

export function updateMe(body: UpdateMeInput): Promise<UserDto> {
  return api.put<UserDto>('/users/me', body).then((r) => r.data);
}

function uploadImage(path: string, asset: PickedAsset): Promise<UploadUrlResponse> {
  const form = new FormData();
  form.append('file', buildFilePart(asset) as unknown as Blob);
  return api
    .post<UploadUrlResponse>(path, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function uploadAvatar(asset: PickedAsset): Promise<UploadUrlResponse> {
  return uploadImage('/users/me/avatar', asset);
}

export function uploadCover(asset: PickedAsset): Promise<UploadUrlResponse> {
  return uploadImage('/users/me/cover', asset);
}

export function posts(
  id: number,
  page: number,
  size: number = DEFAULT_SIZE,
): Promise<Page<PostDto>> {
  return api
    .get<Page<PostDto>>(`/users/${id}/posts`, { params: { page, size } })
    .then((r) => r.data);
}
