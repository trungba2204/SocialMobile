import { useCallback, useEffect, useRef, useState } from 'react';

import { toApiError, type ApiError } from '@/api/errors';

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload(): void;
}

export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current());
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload };
}
