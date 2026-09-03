export default function TransferTag({ tag, onSelect }) {
  return <button className="transfer-tag" type="button" onClick={() => onSelect(tag)}>{tag.name}</button>;
}
