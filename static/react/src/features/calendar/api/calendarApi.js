import { httpClient } from '@/shared/api';

export function getMonthlySummary(date) {
  return httpClient('/money_transfers', {
    method: 'POST',
    body: {
      date: date.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
}
