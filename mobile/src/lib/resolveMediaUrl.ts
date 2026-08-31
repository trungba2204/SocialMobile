import { API_URL } from './apiUrl';

/**
 * Resolve a media URL from the backend. Absolute URLs are returned as-is;
 * relative paths (e.g. `/api/media/foo/bar.jpg`) are prefixed with the API
 * origin (NOT the `/api` base).
 */
export function resolveMediaUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
