import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, useMonthlySummary } from '@/features/calendar';
import { useSession } from '@/features/session';
import { toLocalDateString } from '@/shared/utils';
import './HomePage.css';

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function CalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => firstDayOfMonth(new Date()));
  const { walletDataVersion } = useSession();
  const navigate = useNavigate();
  const { data: summary, error, isLoading } = useMonthlySummary(visibleMonth, walletDataVersion);

  const changeMonth = (amount) => setVisibleMonth((month) => addMonths(month, amount));
  const openDay = (date) => navigate(`/movimientos?date=${toLocalDateString(date)}`);

  return (
    <section className="calendar-page home-light movements-page" aria-labelledby="calendar-page-title">
      <div className="movements-page__intro">
        <div>
          <p>Calendario</p>
          <h1 id="calendar-page-title">Calendario</h1>
          <span>Selecciona un día para consultar sus movimientos</span>
        </div>
      </div>
      {error && <p className="calendar-page__error" role="alert">No se pudo cargar el resumen mensual. Inténtalo de nuevo.</p>}
      <div className="home-main">
        <Calendar month={visibleMonth} selectedDate={null} summary={summary} isLoading={isLoading} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onSelectDate={openDay} />
      </div>
    </section>
  );
}
