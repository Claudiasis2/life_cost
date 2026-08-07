import { formatMoney } from '@/shared/utils';

export default function MonthlySummary({ summary }) {
  const items = [
    ['Total del mes', summary?.total_amount],
    ['Promedio diario', summary?.mean],
    ['Promedio del mes', summary?.mean_month],
  ];

  return (
    <section className="monthly-summary" aria-label="Resumen mensual">
      {items.map(([label, amount]) => <div className="monthly-summary__item" key={label}><span>{label}</span><strong className={amount < 0 ? 'money--expense' : 'money--income'}>{amount === undefined ? '—' : formatMoney(amount)}</strong></div>)}
    </section>
  );
}
