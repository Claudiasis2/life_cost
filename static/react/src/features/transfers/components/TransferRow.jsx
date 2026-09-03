import { formatMoney } from '@/shared/utils';
import TransferTag from './TransferTag';

export default function TransferRow({ transfer, onDelete, onEdit, onSelect, onTagSelect }) {
  const amountClass = transfer.amount < 0 ? 'money--expense' : 'money--income';

  return (
    <tr>
      <td><button className="transfer-row__description" type="button" onClick={() => onSelect(transfer)}>{transfer.description}</button></td>
      <td className={amountClass}>{formatMoney(transfer.amount)}</td>
      <td><div className="transfer-tags">{transfer.tags.map((tag) => <TransferTag key={tag.id} tag={tag} onSelect={onTagSelect} />)}</div></td>
      <td><div className="transfer-row__actions"><button type="button" onClick={() => onEdit(transfer)} aria-label={`Editar ${transfer.description}`}>Editar</button><button className="transfer-row__delete" type="button" onClick={() => onDelete(transfer)} aria-label={`Eliminar ${transfer.description}`}>Eliminar</button></div></td>
    </tr>
  );
}
