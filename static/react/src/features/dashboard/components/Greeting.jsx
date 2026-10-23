import './dashboard.css';

export default function Greeting({ username, walletName }) {
  const firstName = username?.split(' ').filter(Boolean)[0] ?? '…';

  return (
    <div className="dash-greeting">
      <h2>Hola, {firstName}</h2>
      {walletName && <p>Aquí tienes el resumen de tu cartera {walletName}.</p>}
    </div>
  );
}
