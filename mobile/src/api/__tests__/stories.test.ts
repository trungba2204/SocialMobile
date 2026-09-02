import AxiosMockAdapter from 'axios-mock-adapter';

import api from '@/api/client';
import * as stories from '@/api/stories';

let mock: AxiosMockAdapter;

beforeEach(() => {
  mock = new AxiosMockAdapter(api);
});
afterEach(() => mock.restore());

it('reels() GETs /stories and returns StoryReelDto[]', async () => {
  const body = [{ author: { id: 1 }, stories: [], hasUnseen: false }];
  mock.onGet('/stories').reply(200, body);
  await expect(stories.reels()).resolves.toEqual(body);
});

it('get(3) GETs /stories/3', async () => {
  mock.onGet('/stories/3').reply(200, { id: 3 });
  await expect(stories.get(3)).resolves.toEqual({ id: 3 });
});

it('remove(3) DELETEs /stories/3 and resolves void', async () => {
  mock.onDelete('/stories/3').reply(204);
  await expect(stories.remove(3)).resolves.toBeUndefined();
});

it('markViewed(3) POSTs /stories/3/view and resolves void', async () => {
  mock.onPost('/stories/3/view').reply(204);
  await expect(stories.markViewed(3)).resolves.toBeUndefined();
});

it('viewers(3, 1) GETs /stories/3/viewers?page=1&size=20', async () => {
  const page = {
    content: [{ id: 1 }],
    page: 1,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    last: true,
  };
  mock.onGet('/stories/3/viewers').reply((config) => {
    expect(config.params).toEqual({ page: 1, size: 20 });
    return [200, page];
  });
  await expect(stories.viewers(3, 1)).resolves.toEqual(page);
});

it('create() POSTs /stories multipart with a file part + caption field', async () => {
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
    mock.onPost('/stories').reply((config) => {
      sentType =
        (config.headers?.['Content-Type'] as string | undefined) ??
        (config.headers?.['content-type'] as string | undefined);
      return [201, { id: 9 }];
    });

    await expect(
      stories.create(
        { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' },
        'hello',
      ),
    ).resolves.toEqual({ id: 9 });
  } finally {
    global.FormData = OrigFormData;
  }

  expect(sentType).toMatch(/multipart\/form-data/);
  const file = entries.find(([n]) => n === 'file')?.[1];
  expect(file).toMatchObject({ uri: 'file:///a.jpg', type: 'image/jpeg', name: 'a.jpg' });
  const caption = entries.find(([n]) => n === 'caption')?.[1];
  expect(caption).toBe('hello');
});

it('create() omits the caption field when none is given', async () => {
  const entries: [string, unknown][] = [];
  class RecordingFormData {
    append(name: string, value: unknown) {
      entries.push([name, value]);
    }
  }
  const OrigFormData = global.FormData;
  // @ts-expect-error test double
  global.FormData = RecordingFormData;
  try {
    mock.onPost('/stories').reply(201, { id: 1 });
    await stories.create({ uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' });
  } finally {
    global.FormData = OrigFormData;
  }
  expect(entries.some(([n]) => n === 'caption')).toBe(false);
});
