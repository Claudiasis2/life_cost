import { useEffect, useState } from 'react';

function getInitialValues(transfer, defaultDate) {
  return {
    id: transfer?.id,
    description: transfer?.description ?? '',
    amount: transfer?.amount?.toString() ?? '',
    tagsText: transfer?.tags?.map((tag) => tag.name).join(', ') ?? '',
    created_at: transfer?.created_at ?? defaultDate.toISOString(),
  };
}

function validate(values) {
  const errors = {};
  if (!values.description.trim()) errors.description = 'Indica una descripción.';
  if (!values.amount || Number.isNaN(Number(values.amount))) errors.amount = 'Indica un importe válido.';
  if (!values.tagsText.trim()) errors.tagsText = 'Añade al menos un tag.';
  return errors;
}

export default function EditTransferModal({ defaultDate, isOpen, isSaving, onClose, onSave, transfer }) {
  const [values, setValues] = useState(() => getInitialValues(transfer, defaultDate));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(transfer, defaultDate));
      setErrors({});
    }
  }, [defaultDate, isOpen, transfer]);

  if (!isOpen) return null;
  const isEditing = Boolean(transfer);
  const changeValue = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSave(values);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-transfer-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header"><h2 id="edit-transfer-title">{isEditing ? 'Editar movimiento' : 'Añadir movimiento'}</h2><button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
        <form className="transfer-form" onSubmit={submit} noValidate>
          <label>Descripción<input name="description" value={values.description} onChange={changeValue} autoFocus />{errors.description && <span>{errors.description}</span>}</label>
          <label>Importe<input name="amount" value={values.amount} onChange={changeValue} inputMode="decimal" placeholder="-12.50" />{errors.amount && <span>{errors.amount}</span>}</label>
          <label>Tags <small>Separados por comas</small><input name="tagsText" value={values.tagsText} onChange={changeValue} placeholder="alimentación, hogar" />{errors.tagsText && <span>{errors.tagsText}</span>}</label>
          <footer className="modal__actions"><button className="button button--secondary" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button><button className="button button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</button></footer>
        </form>
      </section>
    </div>
  );
}
