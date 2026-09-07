import { useEffect } from 'react';
import { useChartData } from '../hooks';
import BalanceChart from './BalanceChart';
import './charts.css';

export default function ChartModal({ isOpen, onClose, onSelectDate, walletDataVersion }) {
  const { data, error, isLoading } = useChartData(isOpen, walletDataVersion);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="chart-modal__backdrop" role="presentation" onMouseDown={onClose}>
      <section className="chart-modal" role="dialog" aria-modal="true" aria-labelledby="chart-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="chart-modal__header"><div><p>Evolución</p><h2 id="chart-modal-title">Balance acumulado</h2></div><button type="button" onClick={onClose} aria-label="Cerrar gráfico">×</button></header>
        <div className="chart-modal__content">
          {isLoading && <p role="status">Cargando gráfico…</p>}
          {error && <p className="chart-modal__error" role="alert">No se pudo cargar el gráfico.</p>}
          {!isLoading && !error && <BalanceChart data={data} onSelectDate={onSelectDate} />}
        </div>
      </section>
    </div>
  );
}
