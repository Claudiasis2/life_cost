import { NavLink } from 'react-router-dom';
import './layout.css';

export default function Sidebar() { return <aside className="sidebar" aria-label="Navegación principal"><nav><NavLink to="/" end>Inicio</NavLink></nav></aside>; }
