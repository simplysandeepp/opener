import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'opener_recents';
const MAX_RECENTS = 20;

export interface RecentFile {
  uri: string;
  name: string;
  openedAt: number;
}

/** Tracks the most recently opened files (not folders), newest first, de-duplicated by uri. */
export function useRecents() {
  const [recents, setRecents] = useState<RecentFile[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setRecents(JSON.parse(raw));
    });
  }, []);

  const addRecent = useCallback((uri: string, name: string) => {
    setRecents((prev) => {
      const next = [{ uri, name, openedAt: Date.now() }, ...prev.filter((r) => r.uri !== uri)].slice(0, MAX_RECENTS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recents, addRecent, clearRecents };
}
