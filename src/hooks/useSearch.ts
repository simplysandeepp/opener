import { useCallback, useMemo, useRef, useState } from 'react';
import { searchDirectoryRecursive, searchFilenames, type SearchMatch } from '../lib/search';

export function useSearch(currentFolderUri: string | null, currentFolderFiles: string[]) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recursiveResults, setRecursiveResults] = useState<SearchMatch[] | null>(null);
  const cancelledRef = useRef(false);

  const localResults = useMemo(
    () => (query ? searchFilenames(currentFolderFiles, query) : []),
    [query, currentFolderFiles]
  );

  const searchEverywhere = useCallback(async () => {
    if (!currentFolderUri || !query) return;
    cancelledRef.current = false;
    setIsSearching(true);
    setRecursiveResults(null);
    try {
      const results = await searchDirectoryRecursive(currentFolderUri, query, {
        isCancelled: () => cancelledRef.current,
      });
      setRecursiveResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [currentFolderUri, query]);

  const cancelSearch = useCallback(() => {
    cancelledRef.current = true;
    setIsSearching(false);
  }, []);

  const resetSearch = useCallback(() => {
    cancelledRef.current = true;
    setQuery('');
    setRecursiveResults(null);
    setIsSearching(false);
  }, []);

  return { query, setQuery, localResults, recursiveResults, isSearching, searchEverywhere, cancelSearch, resetSearch };
}
