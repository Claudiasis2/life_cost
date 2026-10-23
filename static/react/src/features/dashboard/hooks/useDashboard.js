import { useCallback, useEffect, useRef, useState } from 'react';
import { getDashboardSummary } from '../api';

export function useDashboard(visibleMonth, walletDataVersion) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);

  const loadDashboard = useCallback(async (signal) => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDashboardSummary(visibleMonth, { signal });
      if (requestId === latestRequest.current) setData(result);
    } catch (nextError) {
      if (requestId !== latestRequest.current) return;
      if (nextError?.name === 'AbortError' || nextError?.cause?.name === 'AbortError') return;
      setError(nextError);
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [visibleMonth]);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, walletDataVersion]);

  return { data, error, isLoading, reload: loadDashboard };
}
