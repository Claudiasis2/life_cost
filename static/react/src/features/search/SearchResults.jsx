import { useNavigate } from 'react-router-dom';
import { useActiveCurrency } from '@/features/session';
import { formatMoney, formatServerDateTime, toLocalDateString, toServerDate } from '@/shared/utils';
import HighlightText from './HighlightText';
import { useSearch } from './SearchProvider';
import './search.css';

export default function SearchResults({ onClose }) {
  const { clearSearch, error, isLoading, query, results } = useSearch();
  const currency = useActiveCurrency();
  const navigate = useNavigate();

  const openResult = (transfer) => {
    const resultDate = toServerDate(transfer.created_at);
    if (!resultDate) return;

    clearSearch();
    onClose?.();
    navigate(`/movimientos?date=${toLocalDateString(resultDate)}&highlight=1`);
  };

  const hasResults = results.length > 0;

  return (
    <div className="header-search__results" id="header-search-results" aria-label="Resultados de búsqueda">
      {isLoading && (
        <p className="header-search__status" role="status">
          <span className="header-search__spinner" aria-hidden="true" />
          Buscando movimientos…
        </p>
      )}

      {!isLoading && error && (
        <p className="header-search__status header-search__status--error" role="alert">
          No se pudieron buscar los movimientos.
        </p>
      )}

      {!isLoading && !error && !hasResults && (
        <p className="header-search__status">No se encontraron movimientos.</p>
      )}

      {!isLoading && !error && hasResults && (
        <>
          <p className="header-search__summary">
            {results.length} {results.length === 1 ? 'movimiento' : 'movimientos'}
          </p>
          <div className="header-search__list" role="listbox">
            {results.map((transfer) => (
              <button
                className="header-search__result"
                key={transfer.id}
                type="button"
                role="option"
                onClick={() => openResult(transfer)}
              >
                <span className="header-search__result-main">
                  <span className="header-search__description">
                    <HighlightText query={query} text={transfer.description} />
                  </span>
                  <span className="header-search__meta">
                    <span>{formatServerDateTime(transfer.created_at)}</span>
                    <span className="header-search__tags">
                      {transfer.tags?.length
                        ? transfer.tags.map((tag) => (
                          <span className="header-search__tag" key={tag.id}>{tag.name}</span>
                        ))
                        : <span className="header-search__tag header-search__tag--empty">Sin tag</span>}
                    </span>
                  </span>
                </span>
                <span className={`header-search__amount ${transfer.amount < 0 ? 'money--expense' : 'money--income'}`}>
                  {formatMoney(transfer.amount, currency)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
