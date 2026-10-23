import { useActiveCurrency } from '@/features/session';
import { formatMoney } from '@/shared/utils';

function formatDelta(delta) {
  if (delta === null || delta === undefined) return '—';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const value = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(delta);
  return `${arrow} ${value} % vs mes anterior`;
}

export default function KpiCard({ label, value, delta }) {
  const currency = useActiveCurrency();
  return (
    <div className="dash-kpi">
      <span className="dash-kpi__label">{label}</span>
      <strong className="dash-kpi__value">{value === null || value === undefined ? '—' : formatMoney(value, currency)}</strong>
      <span className="dash-kpi__delta">{formatDelta(delta)}</span>
    </div>
  );
}
