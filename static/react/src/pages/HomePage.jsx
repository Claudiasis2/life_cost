import { useState } from 'react';
import { Calendar, MonthlySummary, useMonthlySummary } from '@/features/calendar';
import { ChartModal } from '@/features/charts';
import { useSession } from '@/features/session';
import { TransfersPanel } from '@/features/transfers';

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function HomePage() {
  const [visibleMonth, setVisibleMonth] = useState(() => firstDayOfMonth(new Date()));
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const { walletDataVersion } = useSession();
  const { data: summary, error, isLoading, reload } = useMonthlySummary(visibleMonth, walletDataVersion);

  const changeMonth = (amount) => {
    setVisibleMonth((month) => addMonths(month, amount));
    setSelectedDate(null);
  };
  const workingDate = selectedDate ?? today;
  const selectChartDate = (date) => {
    setVisibleMonth(firstDayOfMonth(date));
    setSelectedDate(date);
    setIsChartOpen(false);
  };

  return (
    <section className="calendar-page" aria-labelledby="page-title">
      <div className="calendar-page__intro"><div><p>Panel personal</p><h1 id="page-title">Resumen de actividad</h1><span>{selectedDate ? 'Fecha seleccionada' : 'Fecha de trabajo'}: {workingDate.toLocaleDateString('es-ES')}</span></div><button className="calendar-page__chart-button" type="button" onClick={() => setIsChartOpen(true)}>Ver evolución</button></div>
      {error && <p className="calendar-page__error" role="alert">No se pudo cargar el resumen mensual. Inténtalo de nuevo.</p>}
      <Calendar month={visibleMonth} selectedDate={selectedDate} summary={summary} isLoading={isLoading} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onSelectDate={setSelectedDate} />
      <MonthlySummary summary={summary} />
      <TransfersPanel selectedDate={workingDate} walletDataVersion={walletDataVersion} onMutationSuccess={reload} />
      <ChartModal isOpen={isChartOpen} onClose={() => setIsChartOpen(false)} onSelectDate={selectChartDate} walletDataVersion={walletDataVersion} />
    </section>
  );
}
