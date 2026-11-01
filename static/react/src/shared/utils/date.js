export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateString(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return toLocalDateString(date) === value.trim() ? date : null;
}

const ISO_WITH_ZONE = /([zZ]|[+-]\d{2}:?\d{2})$/;

// El backend almacena created_at/modifed_at en UTC naive y los serializa
// con .isoformat() sin offset ni Z. Interpretarlos con new Date(str) los
// trataría como hora local y desplazaría el día mostrado. Esta función
// marca los timestamps naive explícitamente como UTC y respeta los que
// ya traen offset/Z. Devuelve null si el valor no es una fecha válida.
export function toServerDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  let text = value.trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2} /.test(text)) text = text.replace(' ', 'T');
  if (!ISO_WITH_ZONE.test(text)) text = `${text}Z`;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Formatea un timestamp del servidor en la zona horaria del navegador.
// General para cualquier fecha: respeta el instante real, sin desplazar
// día ni mes. Devuelve '—' si el valor es nulo o inválido.
export function formatServerDateTime(value) {
  const date = toServerDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
