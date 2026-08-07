import { useAppConfig } from '@/app/AppProviders';
import './layout.css';

export default function Header() {
  const { isAuthenticated, user } = useAppConfig();
  return <header className="app-header"><a className="app-header__brand" href="/">Gastos de la vida</a>{isAuthenticated && user && <div className="app-header__user"><span>{user.username}</span>{user.picture && <img src={user.picture} alt="Perfil" />}<a href="/logout">Cerrar sesión</a></div>}</header>;
}
