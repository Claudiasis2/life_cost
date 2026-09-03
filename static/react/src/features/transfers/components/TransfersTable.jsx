import TransferRow from './TransferRow';
import './transfers.css';

export default function TransfersTable({ transfers, isLoading, onAdd, onDelete, onEdit, onSelect, onTagSelect, title }) {
  return (
    <section className="transfers-table" aria-labelledby="transfers-title">
      <header className="transfers-table__header"><div><p className="transfers-table__eyebrow">Movimientos</p><h2 id="transfers-title">{title}</h2></div><button className="button button--primary" type="button" onClick={onAdd}>Añadir gasto</button></header>
      <div className="transfers-table__scroll">
        <table>
          <thead><tr><th>Descripción</th><th>Importe</th><th>Tags</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
          <tbody>
            {isLoading && <tr><td className="transfers-table__empty" colSpan="4">Cargando movimientos…</td></tr>}
            {!isLoading && transfers.length === 0 && <tr><td className="transfers-table__empty" colSpan="4">No hay movimientos para este filtro.</td></tr>}
            {!isLoading && transfers.map((transfer) => <TransferRow key={transfer.id} transfer={transfer} onDelete={onDelete} onEdit={onEdit} onSelect={onSelect} onTagSelect={onTagSelect} />)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
