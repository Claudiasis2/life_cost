import { useCallback, useEffect, useState } from 'react';
import { getMonthlySummary } from '../api';

export function useMonthlySummary(month, walletDataVersion) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getMonthlySummary(month));
    } catch (nextError) {
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, walletDataVersion]);

  return { data, error, isLoading, reload: loadSummary };
}
