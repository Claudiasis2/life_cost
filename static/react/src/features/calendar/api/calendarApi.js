import { httpClient } from '@/shared/api';
import { toLocalDateString } from '@/shared/utils';

export function getMonthlySummary(date) {
  return httpClient('/money_transfers', {
    method: 'POST',
    body: {
      date: toLocalDateString(date),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
}
