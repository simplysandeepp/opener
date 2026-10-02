import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'opener_favorites';

export interface FavoriteEntry {
  uri: string;
  name: string;
  isFolder: boolean;
}

/** Tracks pinned files/folders, most-recently-pinned first. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  const isFavorite = useCallback(
    (uri: string) => favorites.some((f) => f.uri === uri),
    [favorites]
  );

  const toggleFavorite = useCallback((entry: FavoriteEntry) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.uri === entry.uri);
      const next = exists ? prev.filter((f) => f.uri !== entry.uri) : [entry, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
