import { CODE_EXTENSIONS } from './syntaxHighlight';

export function getDisplayName(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const parts = decoded.split('/');
    let lastPart = parts.pop() || decoded;
    if (lastPart.includes(':')) {
      lastPart = lastPart.split(':').pop() || lastPart;
    }
    return lastPart || 'Selected Folder';
  } catch {
    return 'Selected Folder';
  }
}

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * SAF gives no file/folder flag, so we guess from the name: a short,
 * non-numeric extension (e.g. "v1.0.0" is not one) is treated as a file.
 */
export function isLikelyFile(filename: string): boolean {
  if (!filename.includes('.')) return false;
  const ext = getExtension(filename);
  return ext.length > 0 && ext.length <= 4 && !/\d/.test(ext);
}

export function getFileIcon(filename: string, isDark: boolean): { icon: string; color: string } {
  if (!isLikelyFile(filename)) return { icon: 'folder', color: '#fbc02d' };

  switch (getExtension(filename)) {
    case 'html':
    case 'htm':
      return { icon: 'language', color: '#e44d26' }; // HTML5 Orange
    case 'md':
    case 'markdown':
      return { icon: 'article', color: isDark ? '#fff' : '#333' };
    case 'txt':
      return { icon: 'text-snippet', color: '#9e9e9e' };
    case 'csv':
      return { icon: 'table-chart', color: '#4caf50' };
    case 'json':
      return { icon: 'data-object', color: '#f9a825' };
    default:
      if (CODE_EXTENSIONS.has(getExtension(filename))) {
        return { icon: 'code', color: '#7e57c2' };
      }
      return { icon: 'insert-drive-file', color: isDark ? '#aaa' : '#666' };
  }
}
