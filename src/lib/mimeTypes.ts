/**
 * SAF's createFile takes a MIME type, not an extension, and the OS appends
 * whatever extension it maps that MIME type to. We only need this to be
 * right for the extensions this app creates by default; anything else
 * falls back to text/plain (".txt") and can be renamed afterwards.
 */
const MIME_TYPES: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  html: 'text/html',
  htm: 'text/html',
  json: 'application/json',
  csv: 'text/csv',
  xml: 'text/xml',
  js: 'text/javascript',
  jsx: 'text/javascript',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  css: 'text/css',
  yml: 'text/yaml',
  yaml: 'text/yaml',
};

export function getMimeType(extension: string): string {
  return MIME_TYPES[extension.toLowerCase()] ?? 'text/plain';
}
