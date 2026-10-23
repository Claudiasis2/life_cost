import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, MonthlySummary, useMonthlySummary } from '@/features/calendar';
import { ChartModal } from '@/features/charts';
import { EvolutionCard, KpiRow, RecentMovements, useDashboard } from '@/features/dashboard';
import HomeIntro from '@/features/dashboard/components/HomeIntro';
import { useSession } from '@/features/session';
import { TransfersPanel } from '@/features/transfers';
import './HomePage.css';

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
  const { user, walletDataVersion } = useSession();
  // Señal compartida desde MainLayout (Header) para abrir el mismo editor.
  const outletContext = useOutletContext() ?? {};
  const createTransferSignal = outletContext.createTransferSignal ?? 0;
  const requestCreateTransfer = outletContext.requestCreateTransfer ?? (() => {});
  const { data: summary, error, isLoading, reload } = useMonthlySummary(visibleMonth, walletDataVersion);
  const { data: dashboard, error: dashboardError } = useDashboard(visibleMonth, walletDataVersion);

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
    <section className="calendar-page home-light" aria-labelledby="page-title">
      <div className="calendar-page__intro"><div><p>Panel personal</p><h1 id="page-title">Resumen de actividad</h1><span>{selectedDate ? 'Fecha seleccionada' : 'Fecha de trabajo'}: {workingDate.toLocaleDateString('es-ES')}</span></div><button className="calendar-page__chart-button" type="button" onClick={() => setIsChartOpen(true)}>Ver evolución</button></div>
      <div className="home-layout">
        <div className="home-main">
          <HomeIntro username={user?.username} walletName={user?.active_wallet?.name} onAddMovement={requestCreateTransfer} />
          {error && <p className="calendar-page__error" role="alert">No se pudo cargar el resumen mensual. Inténtalo de nuevo.</p>}
          {dashboardError && <p className="dash-error" role="alert">No se pudo cargar el resumen del mes. Inténtalo de nuevo.</p>}
          <KpiRow month={dashboard?.month} deltas={dashboard?.deltas_pct} />
          <div className="home-charts">
            <EvolutionCard evolution={dashboard?.evolution} />
            {/* Etapa B: CategoryDonut se montará aquí como segundo hijo
                para compartir la fila de dos columnas en escritorio. */}
          </div>
          <RecentMovements walletDataVersion={walletDataVersion} />
        </div>
        <div className="home-aside">
          <Calendar month={visibleMonth} selectedDate={selectedDate} summary={summary} isLoading={isLoading} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onSelectDate={setSelectedDate} />
          <MonthlySummary summary={summary} selectedDate={workingDate} walletDataVersion={walletDataVersion} />
          <TransfersPanel createSignal={createTransferSignal} selectedDate={workingDate} walletDataVersion={walletDataVersion} onMutationSuccess={reload} />
        </div>
      </div>
      <ChartModal isOpen={isChartOpen} onClose={() => setIsChartOpen(false)} onSelectDate={selectChartDate} walletDataVersion={walletDataVersion} />
    </section>
  );
}
