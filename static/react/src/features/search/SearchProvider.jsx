import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/features/session';
import { searchTransfers } from '@/features/transfers/api';

const SearchContext = createContext(null);
const SEARCH_DELAY_MS = 300;

export function SearchProvider({ children }) {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { walletDataVersion } = useSession();

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setDebouncedQuery('');
      return undefined;
    }

    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;
    setResults([]);
    setError(null);
    setIsLoading(true);

    searchTransfers(debouncedQuery, { signal: controller.signal })
      .then((nextResults) => {
        if (isActive) setResults(Array.isArray(nextResults) ? nextResults : []);
      })
      .catch((nextError) => {
        if (!isActive) return;
        if (nextError?.name === 'AbortError' || nextError?.cause?.name === 'AbortError') return;
        setError(nextError);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedQuery, walletDataVersion]);

  const setQuery = useCallback((value) => setQueryState(value), []);
  const clearSearch = useCallback(() => setQueryState(''), []);
  const isSearching = query.trim().length > 0;
  const isSearchLoading = isSearching && (isLoading || query.trim() !== debouncedQuery);

  const value = useMemo(() => ({
    query,
    setQuery,
    clearSearch,
    debouncedQuery,
    results,
    error,
    isLoading: isSearchLoading,
    isSearching,
  }), [clearSearch, debouncedQuery, error, isSearchLoading, isSearching, query, results, setQuery]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const search = useContext(SearchContext);
  if (!search) throw new Error('useSearch must be used within SearchProvider.');
  return search;
}
