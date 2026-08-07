import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './layout.css';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const closeSidebar = () => setIsSidebarOpen(false);

  return <div className="app-shell"><Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((open) => !open)} /><Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} /><main className="app-main" key={location.pathname}><Outlet /></main></div>;
}
