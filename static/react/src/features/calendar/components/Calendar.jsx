import { useMemo } from 'react';
import CalendarDay from './CalendarDay';
import './calendar.css';

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function sameDay(firstDate, secondDate) {
  return firstDate && secondDate
    && firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function getWeeks(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOffset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? new Date(year, monthIndex, day) : null;
  });

  return Array.from({ length: 6 }, (_, weekIndex) => cells.slice(weekIndex * 7, weekIndex * 7 + 7));
}

export default function Calendar({ month, selectedDate, summary, isLoading, onPreviousMonth, onNextMonth, onSelectDate }) {
  const weeks = useMemo(() => getWeeks(month), [month]);
  const dailyAmounts = useMemo(() => new Map(summary?.days?.map(({ day, total_amount: amount }) => [day, amount])), [summary]);
  const monthLabel = month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <section className="calendar" aria-labelledby="calendar-title">
      <header className="calendar__header">
        <div><p className="calendar__eyebrow">Vista mensual</p><h2 id="calendar-title">{monthLabel}</h2></div>
        <div className="calendar__controls">
          <button type="button" onClick={onPreviousMonth} aria-label="Mes anterior">‹</button>
          <button type="button" onClick={onNextMonth} aria-label="Mes siguiente">›</button>
        </div>
      </header>
      <div className="calendar__table-wrap" aria-busy={isLoading}>
        <table>
          <thead><tr>{WEEK_DAYS.map((day) => <th key={day} scope="col">{day}</th>)}</tr></thead>
          <tbody>{weeks.map((week, weekIndex) => <tr key={weekIndex}>{week.map((date, dayIndex) => <CalendarDay key={date?.toISOString() ?? `${weekIndex}-${dayIndex}`} date={date} amount={date ? dailyAmounts.get(date.getDate()) : undefined} isSelected={sameDay(date, selectedDate)} isToday={sameDay(date, today)} onSelect={onSelectDate} />)}</tr>)}</tbody>
        </table>
        {isLoading && <div className="calendar__loading" role="status">Actualizando calendario…</div>}
      </div>
    </section>
  );
}
