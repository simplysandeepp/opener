import { useCallback, useEffect, useState } from 'react';
import { StorageProvider } from '../lib/storage/StorageProvider';
import { getDisplayName, isLikelyFile } from '../lib/fileKind';

/** Lists the contents of `uri`, re-fetching whenever it changes. Folders sort before files. */
export function useDirectory(uri: string | null) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uri) return;
    try {
      setError(null);
      const filesInDir = await StorageProvider.listDirectory(uri);

      filesInDir.sort((a, b) => {
        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);
        const isFileA = isLikelyFile(nameA);
        const isFileB = isLikelyFile(nameB);

        if (isFileA === isFileB) return nameA.localeCompare(nameB);
        return isFileA ? 1 : -1;
      });
      setFiles(filesInDir);
    } catch (e) {
      console.warn('Failed to read directory', e);
      setError('Failed to read directory');
    }
  }, [uri]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { files, error, refresh };
}
