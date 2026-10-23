import { useCallback, useEffect, useRef, useState } from 'react';
import { getLastTransfers } from '@/features/transfers/api';

export function useRecentTransfers(walletDataVersion, limit = 5) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);

  const loadRecent = useCallback(async (signal) => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLastTransfers(limit, { signal });
      if (requestId === latestRequest.current) setTransfers(result);
    } catch (nextError) {
      if (requestId !== latestRequest.current) return;
      if (nextError?.name === 'AbortError' || nextError?.cause?.name === 'AbortError') return;
      setError(nextError);
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const controller = new AbortController();
    loadRecent(controller.signal);
    return () => controller.abort();
  }, [loadRecent, walletDataVersion]);

  return { error, isLoading, reload: loadRecent, transfers };
}
