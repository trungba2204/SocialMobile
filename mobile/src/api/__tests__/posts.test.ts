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

it('create posts multipart form-data with typed post + media parts', async () => {
  // Record raw appended values (React Native FormData keeps { string, type, uri }
  // objects verbatim; the whatwg FormData would coerce them to strings).
  const entries: [string, unknown][] = [];
  class RecordingFormData {
    append(name: string, value: unknown) {
      entries.push([name, value]);
    }
  }
  const OrigFormData = global.FormData;
  // @ts-expect-error test double
  global.FormData = RecordingFormData;

  let sentType: string | undefined;
  try {
    mock.onPost('/posts').reply((config) => {
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
  } finally {
    global.FormData = OrigFormData;
  }

  expect(sentType).toMatch(/multipart\/form-data/);

  const post = entries.find(([n]) => n === 'post')?.[1] as Record<string, string>;
  expect(post.type).toBe('application/json');
  expect(post.string).toBe(
    JSON.stringify({ content: 'hi', privacy: 'PUBLIC' }),
  );

  const media = entries.filter(([n]) => n === 'media').map(([, v]) => v);
  expect(media).toHaveLength(1);
  expect(media[0]).toMatchObject({ uri: 'file:///a.jpg', type: 'image/jpeg' });
});
