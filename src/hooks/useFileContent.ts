import { useCallback, useEffect, useState } from 'react';
import { StorageProvider } from '../lib/storage/StorageProvider';

/** Loads the text content of `uri` and exposes a way to save edits back to it. */
export function useFileContent(uri: string | null, extension?: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!uri) {
      setError('No file URI found.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fileString = await StorageProvider.readFile(uri, extension);
      setContent(fileString);
    } catch (e: any) {
      console.warn('Error reading file:', e);
      setError(`Could not read this file. Error: ${e.message || e}\nURI: ${uri}`);
    } finally {
      setLoading(false);
    }
  }, [uri, extension]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (newContent: string) => {
    if (!uri) return false;
    try {
      setIsSaving(true);
      await StorageProvider.writeFile(uri, newContent);
      setContent(newContent);
      return true;
    } catch (e: any) {
      console.warn('Error saving file:', e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [uri]);

  return { content, loading, error, isSaving, save, reload };
}
