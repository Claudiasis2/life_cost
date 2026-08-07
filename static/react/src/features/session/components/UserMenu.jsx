import { useState } from 'react';

function UserAvatar({ user }) {
  if (user.picture) return <img className="user-menu__avatar" src={user.picture} alt="" />;
  return <span className="user-menu__avatar user-menu__avatar--fallback" aria-hidden="true">{user.username?.slice(0, 1).toUpperCase()}</span>;
}

export default function UserMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return <a className="button button--primary" href="/google_login">Iniciar sesión</a>;

  return (
    <div className="user-menu">
      <button className="user-menu__trigger" type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        <UserAvatar user={user} />
        <span className="user-menu__name">{user.username}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen && <div className="user-menu__panel"><strong>{user.username}</strong>{user.email && <span>{user.email}</span>}<a href="/logout">Cerrar sesión</a></div>}
    </div>
  );
}
