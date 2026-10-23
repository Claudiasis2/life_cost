import { UserMenu, useSession, WalletSelector } from '@/features/session';
import SearchInput from './SearchInput';
import './layout.css';

export default function Header({ isSidebarOpen, onAddMovement, onToggleSidebar }) {
  const { user, isLoading, isChangingWallet, error, selectWallet } = useSession();
  const wallet = user?.active_wallet;

  return (
    <header className="app-header">
      <div className="app-header__start">
        <button className="menu-toggle" type="button" aria-label="Mostrar navegación" aria-expanded={isSidebarOpen} onClick={onToggleSidebar}><span /><span /><span /></button>
        <a className="app-header__brand" href="/"><span className="app-header__brand-mark">$</span><span>Life Cost</span></a>
      </div>
      <div className="app-header__center">
        <SearchInput />
        {!isLoading && <WalletSelector wallets={user?.wallets} value={wallet?.id} onChange={selectWallet} disabled={isChangingWallet} />}
        {isChangingWallet && <span className="header-status" role="status">Actualizando…</span>}
        {error && <span className="header-status header-status--error" role="alert">No se pudo actualizar la cartera.</span>}
      </div>
      <div className="app-header__end">
        <button className="header-bell" type="button" aria-label="Notificaciones" title="Próximamente: notificaciones" disabled><span aria-hidden="true">🔔</span></button>
        <UserMenu user={user} />
        <button className="button button--primary app-header__add" type="button" onClick={onAddMovement}><span aria-hidden="true">＋</span> Añadir movimiento</button>
      </div>
    </header>
  );
}
