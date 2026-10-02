import { StorageAccessFramework, readAsStringAsync, copyAsync, cacheDirectory, deleteAsync } from 'expo-file-system/legacy';

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
    try {
      await StorageAccessFramework.readDirectoryAsync(uri);
      return true;
    } catch {
      return false;
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
};
