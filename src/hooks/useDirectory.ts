import { useCallback, useEffect, useRef, useState } from 'react';
import { StorageProvider } from '../lib/storage/StorageProvider';
import { getDisplayName, isLikelyFile } from '../lib/fileKind';

function sortEntries(entries: string[]): string[] {
  return [...entries].sort((a, b) => {
    const nameA = getDisplayName(a);
    const nameB = getDisplayName(b);
    const isFileA = isLikelyFile(nameA);
    const isFileB = isLikelyFile(nameB);

    if (isFileA === isFileB) return nameA.localeCompare(nameB);
    return isFileA ? 1 : -1;
  });
}

/** Lists the contents of `uri`, re-fetching whenever it changes. Folders sort before files. */
export function useDirectory(uri: string | null) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Set by primeFiles so the refresh-on-uri-change effect doesn't immediately
  // re-fetch what the caller already has (e.g. from a folder-vs-file probe
  // it had to do anyway before changing `uri`).
  const skipNextRefreshRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!uri) return;
    try {
      setIsLoading(true);
      setError(null);
      const filesInDir = await StorageProvider.listDirectory(uri);
      setFiles(sortEntries(filesInDir));
    } catch (e) {
      console.warn('Failed to read directory', e);
      setError('Failed to read directory');
    } finally {
      setIsLoading(false);
    }
  }, [uri]);

  useEffect(() => {
    if (skipNextRefreshRef.current) {
      skipNextRefreshRef.current = false;
      return;
    }
    refresh();
  }, [refresh]);

  /** Seeds `files` from entries the caller already fetched, skipping the next automatic refresh. */
  const primeFiles = useCallback((entries: string[]) => {
    skipNextRefreshRef.current = true;
    setFiles(sortEntries(entries));
  }, []);

  return { files, error, isLoading, refresh, primeFiles };
}
