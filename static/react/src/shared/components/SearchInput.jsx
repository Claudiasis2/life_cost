import { useEffect, useRef, useState } from 'react';
import { useSearch } from '@/features/search';
import SearchResults from '@/features/search/SearchResults';
import '@/features/search/search.css';

export default function SearchInput() {
  const { query, setQuery } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isSearching = query.trim().length > 0;
  const showResults = isOpen && isSearching;

  useEffect(() => {
    if (!isSearching) setIsOpen(false);
  }, [isSearching]);

  useEffect(() => {
    if (!showResults) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults]);

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(nextQuery.trim().length > 0);
  };

  return (
    <div className="header-search" ref={containerRef}>
      <label className="header-search__field">
        <span className="visually-hidden">Buscar movimientos</span>
        <input
          aria-autocomplete="list"
          aria-controls={showResults ? 'header-search-results' : undefined}
          aria-expanded={showResults}
          aria-haspopup="listbox"
          autoComplete="off"
          placeholder="Buscar movimientos por descripción…"
          type="search"
          value={query}
          onChange={handleChange}
          onClick={() => { if (isSearching) setIsOpen(true); }}
          onFocus={() => { if (isSearching) setIsOpen(true); }}
        />
      </label>
      {showResults && <SearchResults onClose={() => setIsOpen(false)} />}
    </div>
  );
}
