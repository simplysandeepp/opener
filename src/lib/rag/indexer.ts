import { StorageProvider } from '../storage/StorageProvider';
import { getDisplayName, getExtension } from '../fileKind';
import { CODE_EXTENSIONS } from '../syntaxHighlight';
import { chunkText } from './chunk';
import { clearFolderIndex, insertChunks, setFolderIndexed } from './db';

const TEXT_EXTENSIONS = new Set([...CODE_EXTENSIONS, 'txt', 'md', 'markdown', 'html', 'htm', 'json', 'csv']);
const MAX_FILES = 500;

export interface IndexProgress {
  done: number;
  total: number;
}

/** Recursively collects indexable files under `folderRoot`, same single-call-per-node walk as src/lib/search.ts. */
async function collectFiles(uri: string, out: { uri: string; name: string }[], isCancelled?: () => boolean): Promise<void> {
  if (out.length >= MAX_FILES || isCancelled?.()) return;
  const children = await StorageProvider.listDirectoryOrNull(uri);
  if (children === null) return;

  for (const child of children) {
    if (out.length >= MAX_FILES || isCancelled?.()) return;
    const name = getDisplayName(child);
    if (TEXT_EXTENSIONS.has(getExtension(name))) {
      out.push({ uri: child, name });
    }
    await collectFiles(child, out, isCancelled);
  }
}

export async function indexFolder(
  folderRoot: string,
  onProgress?: (progress: IndexProgress) => void,
  isCancelled?: () => boolean
): Promise<number> {
  const files: { uri: string; name: string }[] = [];
  await collectFiles(folderRoot, files, isCancelled);

  await clearFolderIndex(folderRoot);

  let done = 0;
  for (const file of files) {
    if (isCancelled?.()) break;
    try {
      const content = await StorageProvider.readFile(file.uri, getExtension(file.name));
      const chunks = chunkText(content);
      if (chunks.length > 0) await insertChunks(folderRoot, file.uri, file.name, chunks);
    } catch (e) {
      console.warn('Failed to index file', file.uri, e);
    }
    done++;
    onProgress?.({ done, total: files.length });
  }

  await setFolderIndexed(folderRoot, done);
  return done;
}
