import KpiCard from './KpiCard';
import './dashboard.css';

export default function KpiRow({ month, deltas }) {
  return (
    <section className="dash-kpis" aria-label="Resumen del mes">
      <KpiCard label="Ingresos" value={month?.ingresos} delta={deltas?.ingresos} />
      <KpiCard label="Egresos" value={month?.egresos} delta={deltas?.egresos} />
      <KpiCard label="Saldo" value={month?.saldo} delta={deltas?.saldo} />
    </section>
  );
}
