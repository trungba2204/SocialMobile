import AxiosMockAdapter from 'axios-mock-adapter';

import api from '@/api/client';
import * as posts from '@/api/posts';

let mock: AxiosMockAdapter;

beforeEach(() => {
  mock = new AxiosMockAdapter(api);
});
afterEach(() => mock.restore());

it('feed(0) GETs /posts?page=0&size=20 and parses Page<PostDto>', async () => {
  const page = {
    content: [{ id: 1 }],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    last: true,
  };
  mock.onGet('/posts').reply((config) => {
    expect(config.params).toEqual({ page: 0, size: 20 });
    return [200, page];
  });

  await expect(posts.feed(0)).resolves.toEqual(page);
});

it('like(5) POSTs /posts/5/like and returns LikeResponse', async () => {
  mock.onPost('/posts/5/like').reply(200, { liked: true, likeCount: 3 });
  await expect(posts.like(5)).resolves.toEqual({ liked: true, likeCount: 3 });
});

it('create posts multipart form-data with post + media parts', async () => {
  let sentBody: unknown;
  let sentType: string | undefined;
  mock.onPost('/posts').reply((config) => {
    sentBody = config.data;
    sentType =
      (config.headers?.['Content-Type'] as string | undefined) ??
      (config.headers?.['content-type'] as string | undefined);
    return [200, { id: 9 }];
  });

  await posts.create({
    content: 'hi',
    privacy: 'PUBLIC',
    media: [{ uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' }],
  });

  expect(sentBody).toBeInstanceOf(FormData);
  expect(sentType).toMatch(/multipart\/form-data/);
  const names = Array.from((sentBody as FormData).keys());
  expect(names).toContain('post');
  expect(names).toContain('media');
  expect((sentBody as FormData).get('post')).toBe(
    JSON.stringify({ content: 'hi', privacy: 'PUBLIC' }),
  );
});
