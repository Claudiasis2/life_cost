import { httpClient } from '@/shared/api';

export function getChartData() {
  return httpClient('/chart_data', {
    method: 'POST',
    body: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });
}
