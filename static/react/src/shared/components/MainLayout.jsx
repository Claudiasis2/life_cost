import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './layout.css';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Etapa A: señal mínima para que los dos botones «Añadir movimiento»
  // (Header y HomeIntro) abran el mismo editor que vive en TransfersPanel.
  // Se usa Outlet context de react-router (sin contexto custom): MainLayout
  // conserva el contador y HomePage lo reenvía a TransfersPanel.
  const [createTransferSignal, setCreateTransferSignal] = useState(0);
  const location = useLocation();
  const closeSidebar = () => setIsSidebarOpen(false);
  const requestCreateTransfer = () => setCreateTransferSignal((value) => value + 1);

  return <div className="app-shell"><Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((open) => !open)} onAddMovement={requestCreateTransfer} /><Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} /><main className="app-main" key={location.pathname}><Outlet context={{ createTransferSignal, requestCreateTransfer }} /></main></div>;
}
