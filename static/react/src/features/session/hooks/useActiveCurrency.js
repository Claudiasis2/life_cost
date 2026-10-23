import { useSession } from '../SessionProvider';

// Moneda ISO 4217 de la cartera activa (p. ej. 'EUR', 'BOB').
// Devuelve null cuando la cartera aún no tiene moneda asignada:
// los componentes deben mostrarlo de forma explícita (formatMoney
// usa 'XXX'), nunca inventar un símbolo por defecto.
export function useActiveCurrency() {
  const { user } = useSession();
  return user?.active_wallet?.currency ?? null;
}
