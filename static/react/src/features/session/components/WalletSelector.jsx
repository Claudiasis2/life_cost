export default function WalletSelector({ wallets, value, onChange, disabled }) {
  if (!wallets?.length) return null;

  return (
    <label className="wallet-selector">
      <span className="wallet-selector__label">Cartera activa</span>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
      </select>
    </label>
  );
}
