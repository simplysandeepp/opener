import { StorageAccessFramework, readAsStringAsync, copyAsync, cacheDirectory, deleteAsync } from 'expo-file-system/legacy';
import { getMimeType } from '../mimeTypes';

function splitExtension(filename: string): { base: string; ext: string } {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) return { base: filename, ext: '' };
  return { base: filename.slice(0, dotIndex), ext: filename.slice(dotIndex + 1) };
}

/**
 * Thin wrapper over the Storage Access Framework so the rest of the app
 * depends on this module instead of `expo-file-system/legacy` directly.
 */
export const StorageProvider = {
  async requestDirectoryPermission(): Promise<string | null> {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    return permissions.granted ? permissions.directoryUri : null;
  },

  async listDirectory(uri: string): Promise<string[]> {
    return StorageAccessFramework.readDirectoryAsync(uri);
  },

  /** SAF has no "is this a file" check, so we probe by trying to list it as a directory. */
  async isDirectory(uri: string): Promise<boolean> {
    return (await this.listDirectoryOrNull(uri)) !== null;
  },

  /** Like listDirectory, but returns null instead of throwing when `uri` is a file, not a folder. */
  async listDirectoryOrNull(uri: string): Promise<string[] | null> {
    try {
      return await StorageAccessFramework.readDirectoryAsync(uri);
    } catch {
      return null;
    }
  },

  async readFile(uri: string, extension?: string): Promise<string> {
    const tempFileUri = cacheDirectory + 'temp_' + Date.now() + (extension ? '.' + extension : '');
    try {
      await copyAsync({ from: uri, to: tempFileUri });
      return await readAsStringAsync(tempFileUri);
    } finally {
      await deleteAsync(tempFileUri, { idempotent: true });
    }
  },

  async writeFile(uri: string, content: string): Promise<void> {
    await StorageAccessFramework.writeAsStringAsync(uri, content);
  },

  /** `filename` may include its extension; SAF picks the actual extension from the MIME type. */
  async createFile(parentUri: string, filename: string): Promise<string> {
    const { base, ext } = splitExtension(filename);
    return StorageAccessFramework.createFileAsync(parentUri, base || filename, getMimeType(ext || 'txt'));
  },

  async createFolder(parentUri: string, name: string): Promise<string> {
    return StorageAccessFramework.makeDirectoryAsync(parentUri, name);
  },

  async deleteEntry(uri: string): Promise<void> {
    await deleteAsync(uri);
  },
};
