export default function SearchInput() {
  return (
    <label className="header-search">
      <span className="visually-hidden">Buscar movimientos</span>
      <input type="search" placeholder="Buscar movimientos, categorías, notas…" disabled title="Próximamente: búsqueda" aria-disabled="true" />
    </label>
  );
}
