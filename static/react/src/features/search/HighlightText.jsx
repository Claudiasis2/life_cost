function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function HighlightText({ query, text }) {
  const content = typeof text === 'string' ? text : '';
  const term = typeof query === 'string' ? query.trim() : '';

  if (!content || !term) return content;

  const parts = content.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'));

  return parts.map((part, index) => (
    index % 2 === 1
      ? <mark className="search-highlight" key={`${index}-${part}`}>{part}</mark>
      : part
  ));
}
