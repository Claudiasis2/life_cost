import { httpClient } from '@/shared/api';

export function getSession() {
  return httpClient('/api/me');
}

export function updateActiveWallet(walletId) {
  return httpClient('/update_last_visited_wallet', {
    method: 'POST',
    body: { wallet_id: walletId },
  });
}
