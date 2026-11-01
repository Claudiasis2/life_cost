import { useNavigate } from 'react-router-dom';
import { useActiveCurrency } from '@/features/session';
import { formatMoney, formatServerDateTime } from '@/shared/utils';
import { useRecentTransfers } from '../hooks';
import '../../transfers/components/transfers.css';

export default function RecentMovements({ walletDataVersion }) {
  const { error, isLoading, transfers } = useRecentTransfers(walletDataVersion);
  const currency = useActiveCurrency();
  const navigate = useNavigate();

  return (
    <section className="transfers-table" aria-labelledby="recent-title">
      <header className="transfers-table__header">
        <div>
          <p className="transfers-table__eyebrow">Movimientos</p>
          <h2 id="recent-title">Movimientos recientes</h2>
        </div>
        <button className="button button--primary" type="button" onClick={() => navigate('/movimientos')}>Ver todos →</button>
      </header>
      {error && <p className="transfers-panel__error" role="alert">No se pudieron cargar los movimientos recientes.</p>}
      <div className="transfers-table__scroll">
        <table>
          <thead><tr><th>Fecha</th><th>Descripción</th><th>Tag</th><th>Importe</th></tr></thead>
          <tbody>
            {isLoading && <tr><td className="transfers-table__empty" colSpan="4">Cargando movimientos…</td></tr>}
            {!isLoading && !error && transfers.length === 0 && <tr><td className="transfers-table__empty" colSpan="4">No hay movimientos todavía.</td></tr>}
            {!isLoading && transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td>{formatServerDateTime(transfer.created_at)}</td>
                <td>{transfer.description}</td>
                <td><div className="transfer-tags">{transfer.tags.map((tag) => <span className="transfer-tag" key={tag.id}>{tag.name}</span>)}</div></td>
                <td className={transfer.amount < 0 ? 'money--expense' : 'money--income'}>{formatMoney(transfer.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
