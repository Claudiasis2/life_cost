import { useActiveCurrency } from '@/features/session';
import { formatMoney } from '@/shared/utils';

export default function CalendarDay({ date, amount, isHighlighted, isSelected, isToday, onSelect }) {
  const currency = useActiveCurrency();
  if (!date) return <td className="calendar-day calendar-day--empty" aria-hidden="true" />;

  const hasAmount = amount !== undefined;
  const amountClass = amount < 0 ? 'calendar-day__amount--expense' : 'calendar-day__amount--income';

  return (
    <td className="calendar-day">
      <button
        className={`calendar-day__button ${isToday ? 'calendar-day__button--today' : ''} ${isSelected ? 'calendar-day__button--selected' : ''} ${isHighlighted ? 'calendar-day__button--highlighted' : ''}`}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(date)}
      >
        <span className="calendar-day__number">{date.getDate()}</span>
        {hasAmount && <span className={`calendar-day__amount ${amountClass}`}>{formatMoney(amount, currency)}</span>}
      </button>
    </td>
  );
}
