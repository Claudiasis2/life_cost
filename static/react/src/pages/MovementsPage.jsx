import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Calendar, useMonthlySummary } from '@/features/calendar';
import { useSession } from '@/features/session';
import { TransfersPanel } from '@/features/transfers';
import { fromLocalDateString, toLocalDateString } from '@/shared/utils';
import './HomePage.css';

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const selectedDate = useMemo(() => fromLocalDateString(dateParam), [dateParam]);
  const highlightedDate = searchParams.get('highlight') === '1' ? selectedDate : null;
  const [visibleMonth, setVisibleMonth] = useState(() => firstDayOfMonth(selectedDate ?? new Date()));
  const { walletDataVersion } = useSession();
  const outletContext = useOutletContext() ?? {};
  const createTransferSignal = outletContext.createTransferSignal ?? 0;
  const { data: summary, error, isLoading, reload } = useMonthlySummary(visibleMonth, walletDataVersion);

  useEffect(() => {
    if (selectedDate) setVisibleMonth(firstDayOfMonth(selectedDate));
  }, [selectedDate]);

  const changeMonth = (amount) => {
    setVisibleMonth((month) => addMonths(month, amount));
    setSearchParams({}, { replace: true });
  };

  const selectDate = (date) => {
    setVisibleMonth(firstDayOfMonth(date));
    setSearchParams({ date: toLocalDateString(date) });
  };

  return (
    <section className="calendar-page home-light movements-page" aria-labelledby="movements-title">
      <div className="movements-page__intro">
        <div>
          <p>Registros</p>
          <h1 id="movements-title">Movimientos</h1>
          <span>{selectedDate ? `Fecha seleccionada: ${selectedDate.toLocaleDateString('es-ES')}` : 'Selecciona un día en el calendario'}</span>
        </div>
      </div>
      <div className="home-layout movements-page__layout">
        <div className="home-main movements-page__main">
          <TransfersPanel createSignal={createTransferSignal} selectedDate={selectedDate} walletDataVersion={walletDataVersion} onMutationSuccess={reload} />
        </div>
        <div className="home-aside movements-page__aside">
          {error && <p className="calendar-page__error" role="alert">No se pudo cargar el resumen mensual.</p>}
          <Calendar month={visibleMonth} selectedDate={selectedDate} highlightedDate={highlightedDate} summary={summary} isLoading={isLoading} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onSelectDate={selectDate} />
        </div>
      </div>
    </section>
  );
}
