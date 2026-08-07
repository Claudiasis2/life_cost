import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './layout.css';

export default function MainLayout() { return <div className="app-shell"><Header /><Sidebar /><main className="app-main"><Outlet /></main></div>; }
