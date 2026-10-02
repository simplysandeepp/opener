import { StorageProvider } from './storage/StorageProvider';
import { getDisplayName } from './fileKind';

function splitExtension(name: string): { base: string; ext: string } {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dotIndex), ext: name.slice(dotIndex + 1) };
}

async function uniqueNameIn(parentUri: string, desiredName: string): Promise<string> {
  const siblings = await StorageProvider.listDirectory(parentUri);
  const existingNames = new Set(siblings.map(getDisplayName));
  if (!existingNames.has(desiredName)) return desiredName;

  const { base, ext } = splitExtension(desiredName);
  let counter = 2;
  let candidate = ext ? `${base} ${counter}.${ext}` : `${base} ${counter}`;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = ext ? `${base} ${counter}.${ext}` : `${base} ${counter}`;
  }
  return candidate;
}

/** Creates a new file in `parentUri`, appending " 2", " 3", ... to `filename` if it already exists. */
export async function createNewFile(parentUri: string, filename: string): Promise<string> {
  const uniqueName = await uniqueNameIn(parentUri, filename);
  return StorageProvider.createFile(parentUri, uniqueName);
}

/** Creates a new folder in `parentUri`, appending " 2", " 3", ... to `name` if it already exists. */
export async function createNewFolder(parentUri: string, name: string): Promise<string> {
  const uniqueName = await uniqueNameIn(parentUri, name);
  return StorageProvider.createFolder(parentUri, uniqueName);
}

/**
 * SAF has no native rename/duplicate call, so both are implemented as
 * copy-then-(optionally)-delete: read the file's text content, create a
 * new file alongside it, write the content, then remove the original
 * when renaming. Fine for this app's scope (text files only).
 */
export async function duplicateFile(uri: string, parentUri: string): Promise<string> {
  const originalName = getDisplayName(uri);
  const { base, ext } = splitExtension(originalName);
  const desiredName = ext ? `${base} copy.${ext}` : `${base} copy`;
  const newName = await uniqueNameIn(parentUri, desiredName);

  const content = await StorageProvider.readFile(uri, ext);
  const newUri = await StorageProvider.createFile(parentUri, newName);
  await StorageProvider.writeFile(newUri, content);
  return newUri;
}

export async function renameFile(uri: string, parentUri: string, newName: string): Promise<string> {
  const originalName = getDisplayName(uri);
  if (newName === originalName) return uri;

  const { ext: originalExt } = splitExtension(originalName);
  const uniqueName = await uniqueNameIn(parentUri, newName);

  const content = await StorageProvider.readFile(uri, originalExt);
  const newUri = await StorageProvider.createFile(parentUri, uniqueName);
  await StorageProvider.writeFile(newUri, content);
  await StorageProvider.deleteEntry(uri);
  return newUri;
}

export async function deleteEntry(uri: string): Promise<void> {
  await StorageProvider.deleteEntry(uri);
}
