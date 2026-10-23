import Greeting from '@/features/dashboard/components/Greeting';

export default function HomeIntro({ onAddMovement, username, walletName }) {
  return (
    <div className="home-intro">
      <Greeting username={username} walletName={walletName} />
      <button className="home-intro__add" type="button" onClick={onAddMovement}>
        <span aria-hidden="true">＋</span> Añadir movimiento
      </button>
    </div>
  );
}
