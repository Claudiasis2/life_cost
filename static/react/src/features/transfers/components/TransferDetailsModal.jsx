import { formatDateTime, formatMoney } from '@/shared/utils';
import TransferTag from './TransferTag';

export default function TransferDetailsModal({ isOpen, onClose, onDelete, onEdit, onTagSelect, transfer }) {
  if (!isOpen || !transfer) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="transfer-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header"><h2 id="transfer-details-title">Detalle del movimiento</h2><button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
        <dl className="transfer-details"><div><dt>Descripción</dt><dd>{transfer.description}</dd></div><div><dt>Importe</dt><dd className={transfer.amount < 0 ? 'money--expense' : 'money--income'}>{formatMoney(transfer.amount)}</dd></div><div><dt>Tags</dt><dd className="transfer-tags">{transfer.tags.map((tag) => <TransferTag key={tag.id} tag={tag} onSelect={onTagSelect} />)}</dd></div><div><dt>Creado por</dt><dd>{transfer.created_by}</dd></div><div><dt>Fecha de creación</dt><dd>{formatDateTime(transfer.created_at)}</dd></div><div><dt>Última edición</dt><dd>{formatDateTime(transfer.modifed_at)}</dd></div></dl>
        <footer className="modal__actions"><button className="button button--secondary" type="button" onClick={() => onEdit(transfer)}>Editar</button><button className="button button--danger" type="button" onClick={() => onDelete(transfer)}>Eliminar</button></footer>
      </section>
    </div>
  );
}
