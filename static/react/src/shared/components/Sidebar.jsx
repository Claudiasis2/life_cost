import { NavLink } from 'react-router-dom';
import './layout.css';

const PENDING_ITEMS = [
  { label: 'Gráficos', icon: '📈' },
  { label: 'Etiquetas', icon: '🏷' },
  { label: 'Configuración', icon: '⚙' },
];

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Navegación principal">
      <div className="sidebar__section-label">Espacio personal</div>
      <nav>
        <NavLink to="/" end onClick={onNavigate}><span aria-hidden="true">⌂</span> Inicio</NavLink>
        <NavLink to="/calendario" onClick={onNavigate}><span aria-hidden="true">📅</span> Calendario</NavLink>
        <NavLink to="/movimientos" onClick={onNavigate}><span aria-hidden="true">▤</span> Movimientos</NavLink>
        {PENDING_ITEMS.map((item) => (
          <button key={item.label} className="sidebar__pending" type="button" disabled aria-disabled="true" title="Próximamente">
            <span aria-hidden="true">{item.icon}</span> {item.label} <span className="sidebar__badge">Próximamente</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">Tu información financiera, en un solo lugar.</div>
    </aside>
  );
}
