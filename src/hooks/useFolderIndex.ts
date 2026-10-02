import { useCallback, useEffect, useRef, useState } from 'react';
import { getFolderIndexStatus, type FolderIndexStatus } from '../lib/rag/db';
import { indexFolder, type IndexProgress } from '../lib/rag/indexer';

export function useFolderIndex(folderRoot: string | null) {
  const [status, setStatus] = useState<FolderIndexStatus | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState<IndexProgress | null>(null);
  const cancelledRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (!folderRoot) {
      setStatus(null);
      return;
    }
    setStatus(await getFolderIndexStatus(folderRoot));
  }, [folderRoot]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const startIndexing = useCallback(async () => {
    if (!folderRoot) return;
    cancelledRef.current = false;
    setIsIndexing(true);
    setProgress({ done: 0, total: 0 });
    try {
      await indexFolder(folderRoot, setProgress, () => cancelledRef.current);
      await refreshStatus();
    } finally {
      setIsIndexing(false);
    }
  }, [folderRoot, refreshStatus]);

  const cancelIndexing = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return { status, isIndexing, progress, startIndexing, cancelIndexing };
}
