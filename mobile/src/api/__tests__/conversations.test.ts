import AxiosMockAdapter from 'axios-mock-adapter';

import api from '@/api/client';
import * as conversations from '@/api/conversations';

let mock: AxiosMockAdapter;

beforeEach(() => {
  mock = new AxiosMockAdapter(api);
});
afterEach(() => mock.restore());

const page = {
  content: [{ id: 1 }],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  last: true,
};

it('list(0) GETs /conversations?page=0&size=20', async () => {
  mock.onGet('/conversations').reply((config) => {
    expect(config.params).toEqual({ page: 0, size: 20 });
    return [200, page];
  });
  await expect(conversations.list(0)).resolves.toEqual(page);
});

it('getOrCreate POSTs /conversations { peerUserId } and returns the body', async () => {
  mock.onPost('/conversations').reply((config) => {
    expect(JSON.parse(config.data)).toEqual({ peerUserId: 7 });
    return [201, { id: 3, peer: { id: 7 } }];
  });
  await expect(conversations.getOrCreate(7)).resolves.toEqual({ id: 3, peer: { id: 7 } });
});

it('get(3) GETs /conversations/3', async () => {
  mock.onGet('/conversations/3').reply(200, { id: 3 });
  await expect(conversations.get(3)).resolves.toEqual({ id: 3 });
});

it('messages(3, 1) GETs /conversations/3/messages?page=1&size=20', async () => {
  mock.onGet('/conversations/3/messages').reply((config) => {
    expect(config.params).toEqual({ page: 1, size: 20 });
    return [200, page];
  });
  await expect(conversations.messages(3, 1)).resolves.toEqual(page);
});

it('send(3, "hi") POSTs /conversations/3/messages { content } and returns MessageDto', async () => {
  mock.onPost('/conversations/3/messages').reply((config) => {
    expect(JSON.parse(config.data)).toEqual({ content: 'hi' });
    return [201, { id: 9, conversationId: 3, content: 'hi' }];
  });
  await expect(conversations.send(3, 'hi')).resolves.toEqual({
    id: 9,
    conversationId: 3,
    content: 'hi',
  });
});

it('markRead(3) POSTs /conversations/3/read and resolves void', async () => {
  mock.onPost('/conversations/3/read').reply(204);
  await expect(conversations.markRead(3)).resolves.toBeUndefined();
});
