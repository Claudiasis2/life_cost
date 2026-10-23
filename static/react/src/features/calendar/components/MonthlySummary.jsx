import { useEffect, useState } from 'react';
import { useActiveCurrency } from '@/features/session';
import { getTransfersByDate } from '@/features/transfers/api';
import { formatMoney } from '@/shared/utils';

export default function MonthlySummary({ summary, selectedDate, walletDataVersion }) {
  const currency = useActiveCurrency();
  const [dailyTotal, setDailyTotal] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!selectedDate) {
      setDailyTotal(undefined);
      return undefined;
    }
    setDailyTotal(undefined);
    getTransfersByDate(selectedDate)
      .then((transfers) => {
        if (cancelled) return;
        setDailyTotal(
          (Array.isArray(transfers) ? transfers : []).reduce(
            (acc, transfer) => acc + Number(transfer.amount),
            0,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setDailyTotal(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, walletDataVersion]);

  const items = [
    ['Average per day', summary?.mean],
    ['Average this month', summary?.mean_month],
    ['Total', dailyTotal],
  ];

  return (
    <section className="monthly-summary" aria-label="Resumen mensual">
      {items.map(([label, amount]) => <div className="monthly-summary__item" key={label}><span>{label}</span><strong className={amount < 0 ? 'money--expense' : 'money--income'}>{amount === undefined ? '—' : formatMoney(amount, currency)}</strong></div>)}
    </section>
  );
}
