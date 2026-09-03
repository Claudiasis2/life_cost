import { useState } from 'react';
import { useTransfers } from '../hooks';
import EditTransferModal from './EditTransferModal';
import TransferDetailsModal from './TransferDetailsModal';
import TransfersTable from './TransfersTable';

export default function TransfersPanel({ onMutationSuccess, selectedDate, walletDataVersion }) {
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [editedTransfer, setEditedTransfer] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { error, isLoading, isMutating, removeTransfer, saveTransfer, transfers } = useTransfers({ selectedDate, selectedTag, walletDataVersion });
  const defaultDate = selectedDate ?? new Date();
  const title = selectedTag ? `Tag: ${selectedTag.name}` : selectedDate ? `Movimientos del ${selectedDate.toLocaleDateString('es-ES')}` : 'Últimos movimientos';

  const closeEditor = () => { setIsEditorOpen(false); setEditedTransfer(null); };
  const openEditor = (transfer = null) => { setSelectedTransfer(null); setEditedTransfer(transfer); setIsEditorOpen(true); };
  const selectTag = (tag) => { setSelectedTag(tag); setSelectedTransfer(null); };
  const clearTag = () => setSelectedTag(null);
  const handleSave = async (values) => { await saveTransfer(values); closeEditor(); onMutationSuccess?.(); };
  const handleDelete = async (transfer) => {
    if (!window.confirm(`¿Eliminar “${transfer.description}”?`)) return;
    await removeTransfer(transfer.id);
    setSelectedTransfer(null);
    onMutationSuccess?.();
  };

  return (
    <section className="transfers-panel">
      {selectedTag && <div className="transfers-panel__filter"><span>Filtrando por <strong>{selectedTag.name}</strong></span><button type="button" onClick={clearTag}>Quitar filtro</button></div>}
      {error && <p className="transfers-panel__error" role="alert">No se pudieron actualizar los movimientos. Inténtalo de nuevo.</p>}
      <TransfersTable transfers={transfers} isLoading={isLoading} title={title} onAdd={() => openEditor()} onDelete={handleDelete} onEdit={openEditor} onSelect={setSelectedTransfer} onTagSelect={selectTag} />
      <TransferDetailsModal isOpen={Boolean(selectedTransfer)} transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} onDelete={handleDelete} onEdit={openEditor} onTagSelect={selectTag} />
      <EditTransferModal defaultDate={defaultDate} isOpen={isEditorOpen} isSaving={isMutating} transfer={editedTransfer} onClose={closeEditor} onSave={handleSave} />
    </section>
  );
}
