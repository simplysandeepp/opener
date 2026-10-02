import { StorageProvider } from './storage/StorageProvider';
import { getDisplayName } from './fileKind';

export interface SearchMatch {
  uri: string;
  name: string;
}

interface SearchOptions {
  maxResults?: number;
  isCancelled?: () => boolean;
}

/** Filename search over the already-loaded entries of a single folder. */
export function searchFilenames(entries: string[], query: string): SearchMatch[] {
  const q = query.toLowerCase();
  return entries
    .map((uri) => ({ uri, name: getDisplayName(uri) }))
    .filter((entry) => entry.name.toLowerCase().includes(q));
}

/** Depth-first filename search starting at `rootUri`, descending into subfolders. */
export async function searchDirectoryRecursive(
  rootUri: string,
  query: string,
  { maxResults = 200, isCancelled }: SearchOptions = {}
): Promise<SearchMatch[]> {
  const q = query.toLowerCase();
  const results: SearchMatch[] = [];

  async function walk(uri: string) {
    if (isCancelled?.() || results.length >= maxResults) return;

    const children = await StorageProvider.listDirectoryOrNull(uri);
    if (children === null) return; // uri is a file, nothing to descend into

    for (const child of children) {
      if (isCancelled?.() || results.length >= maxResults) return;

      const name = getDisplayName(child);
      if (name.toLowerCase().includes(q)) {
        results.push({ uri: child, name });
      }
      await walk(child);
    }
  }

  await walk(rootUri);
  return results;
}
