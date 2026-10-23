const CURRENCY_LOCALES = {
  BOB: 'es-BO',
  EUR: 'es-ES',
  USD: 'es-ES',
};

// Normaliza a código ISO 4217. Un valor ausente o inválido se muestra como
// 'XXX' (símbolo explícito de moneda desconocida): nunca se inventa ni se
// oculta silenciosamente la moneda de la cartera activa.
function normalizeCurrency(currency) {
  if (typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim())) {
    return currency.trim().toUpperCase();
  }
  return 'XXX';
}

export function formatMoney(amount, currency) {
  const value = Number(amount);
  const code = normalizeCurrency(currency);
  const locale = CURRENCY_LOCALES[code] ?? 'es-ES';
  // 'XXX' se muestra como código literal ("100,00 XXX") en cualquier ICU,
  // para que la falta de moneda sea siempre visible y determinista.
  const currencyDisplay = code === 'XXX' ? 'code' : 'symbol';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
