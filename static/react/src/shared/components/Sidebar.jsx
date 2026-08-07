import { NavLink } from 'react-router-dom';
import './layout.css';

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Navegación principal">
      <div className="sidebar__section-label">Espacio personal</div>
      <nav><NavLink to="/" end onClick={onNavigate}><span aria-hidden="true">⌂</span> Inicio</NavLink></nav>
      <div className="sidebar__footer">Tu información financiera, en un solo lugar.</div>
    </aside>
  );
}
