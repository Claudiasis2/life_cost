import { httpClient } from '@/shared/api';
import { toLocalDateString } from '@/shared/utils';

export function getDashboardSummary(date, options = {}) {
  return httpClient('/dashboard_summary', {
    method: 'POST',
    body: {
      date: toLocalDateString(date),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    signal: options.signal,
  });
}
