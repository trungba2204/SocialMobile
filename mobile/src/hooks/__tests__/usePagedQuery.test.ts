import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

import { usePagedQuery } from '@/hooks/usePagedQuery';
import type { Page } from '@/api/types';

function makePage(page: number): Page<number> {
  const start = page * 2;
  return {
    content: [start + 1, start + 2],
    page,
    size: 2,
    totalElements: 4,
    totalPages: 2,
    last: page >= 1,
  };
}

type Api = ReturnType<typeof usePagedQuery<number>>;

function mountHook(fetcher: (page: number) => Promise<Page<number>>): { current: Api } {
  const ref: { current: Api } = { current: null as unknown as Api };
  function Probe() {
    ref.current = usePagedQuery(fetcher);
    return React.createElement(Text, null, JSON.stringify(ref.current.items));
  }
  render(React.createElement(Probe));
  return ref;
}

it('loads page 0, appends on loadMore, no-ops at endReached, resets on refresh', async () => {
  const fetcher = jest.fn((page: number) => Promise.resolve(makePage(page)));
  const hook = mountHook(fetcher);

  await waitFor(() => expect(hook.current.items).toEqual([1, 2]));
  expect(hook.current.endReached).toBe(false);

  await act(async () => {
    hook.current.loadMore();
  });
  expect(hook.current.items).toEqual([1, 2, 3, 4]);
  expect(hook.current.endReached).toBe(true);

  await act(async () => {
    hook.current.loadMore();
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(hook.current.items).toEqual([1, 2, 3, 4]);

  await act(async () => {
    hook.current.refresh();
  });
  expect(hook.current.items).toEqual([1, 2]);
  expect(hook.current.endReached).toBe(false);
});
