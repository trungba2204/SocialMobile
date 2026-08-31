import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { usePagedQuery } from '@/hooks/usePagedQuery';
import type { Page } from '@/api/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const flush = () => new Promise((resolve) => setImmediate(resolve));

it('loads page 0, appends on loadMore, no-ops at endReached, resets on refresh', async () => {
  const fetcher = jest.fn((page: number) => Promise.resolve(makePage(page)));
  const ref: { current: Api } = { current: null as unknown as Api };

  function Probe() {
    ref.current = usePagedQuery(fetcher);
    return React.createElement(Text, null, JSON.stringify(ref.current.items));
  }

  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(React.createElement(Probe));
    await flush();
  });

  // initial load populates page 0
  expect(ref.current.items).toEqual([1, 2]);
  expect(ref.current.endReached).toBe(false);

  // loadMore appends page 1 and reaches the end
  await act(async () => {
    ref.current.loadMore();
    await flush();
  });
  expect(ref.current.items).toEqual([1, 2, 3, 4]);
  expect(ref.current.endReached).toBe(true);

  // a third loadMore no-ops once endReached
  await act(async () => {
    ref.current.loadMore();
    await flush();
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(ref.current.items).toEqual([1, 2, 3, 4]);

  // refresh resets to page 0
  await act(async () => {
    ref.current.refresh();
    await flush();
  });
  expect(ref.current.items).toEqual([1, 2]);
  expect(ref.current.endReached).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(3);

  act(() => {
    renderer.unmount();
  });
});
