import { useCallback, useEffect, useRef, useState } from 'react';

import { toApiError, type ApiError } from '@/api/errors';
import type { Page } from '@/api/types';

export interface PagedQuery<T> {
  items: T[];
  loading: boolean;
  refreshing: boolean;
  error: ApiError | null;
  endReached: boolean;
  refresh(): void;
  loadMore(): void;
  setItems(updater: (prev: T[]) => T[]): void;
}

export function usePagedQuery<T>(
  fetcher: (page: number) => Promise<Page<T>>,
): PagedQuery<T> {
  const [items, setItemsState] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [endReached, setEndReached] = useState(false);

  const pageRef = useRef(0);
  const inFlightRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (nextPage: number, mode: 'refresh' | 'more' | 'initial') => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(nextPage);
      pageRef.current = nextPage;
      setEndReached(result.last);
      setItemsState((prev) =>
        nextPage === 0 ? result.content : [...prev, ...result.content],
      );
    } catch (e) {
      setError(toApiError(e));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void run(0, 'initial');
  }, [run]);

  const refresh = useCallback(() => {
    setEndReached(false);
    void run(0, 'refresh');
  }, [run]);

  const loadMore = useCallback(() => {
    if (endReached || inFlightRef.current) return;
    void run(pageRef.current + 1, 'more');
  }, [endReached, run]);

  const setItems = useCallback((updater: (prev: T[]) => T[]) => {
    setItemsState(updater);
  }, []);

  return { items, loading, refreshing, error, endReached, refresh, loadMore, setItems };
}
