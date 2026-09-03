import { httpClient } from '@/shared/api';

const getTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getRecentTransfers() {
  return httpClient('/last_money_transfers/5');
}

export function getTransfersByDate(date) {
  return httpClient('/money_transfer_from_date', {
    method: 'POST',
    body: { date: date.toISOString(), timeZone: getTimeZone() },
  });
}

export function getTransfersByCategory(categoryId) {
  return httpClient(`/money_transfers_by_category/${categoryId}`);
}

export function createTransfer(values) {
  return httpClient('/add_money', { method: 'POST', body: values });
}

export function updateTransfer(values) {
  return httpClient('/edit_money', { method: 'POST', body: values });
}

export function deleteTransfer(id) {
  return httpClient(`/remove_money/${id}`, { method: 'DELETE' });
}
