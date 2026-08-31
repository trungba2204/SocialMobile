import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import { API_URL } from '@/lib/apiUrl';

describe('resolveMediaUrl', () => {
  it('prefixes relative paths with the API origin', () => {
    expect(resolveMediaUrl('/api/media/x')).toBe(`${API_URL}/api/media/x`);
  });

  it('returns absolute URLs unchanged', () => {
    expect(resolveMediaUrl('https://a/b')).toBe('https://a/b');
  });
});
