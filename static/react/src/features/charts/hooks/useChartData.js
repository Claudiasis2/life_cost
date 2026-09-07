import { useEffect, useState } from 'react';
import { getChartData } from '../api';

function parseLocalDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toBalanceSeries(points) {
  let balance = 0;
  return points.map((point) => {
    balance -= Number(point.Close);
    return { date: parseLocalDate(point.Date), balance };
  });
}

export function useChartData(enabled, walletDataVersion) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    getChartData()
      .then((points) => {
        if (isCurrent) setData(toBalanceSeries(points));
      })
      .catch((nextError) => {
        if (isCurrent) setError(nextError);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [enabled, walletDataVersion]);

  return { data, error, isLoading };
}
