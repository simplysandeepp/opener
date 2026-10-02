import { getDisplayName, getExtension, isLikelyFile, getFileIcon } from './fileKind';

describe('getDisplayName', () => {
  it('returns the last path segment', () => {
    expect(getDisplayName('content://com.android.externalstorage.documents/document/primary%3ADownload%2Fnotes.md')).toBe('notes.md');
  });

  it('strips a provider id prefix before a colon', () => {
    expect(getDisplayName('content://com.example/tree/primary:notes.txt')).toBe('notes.txt');
  });

  it('falls back to a default on malformed input', () => {
    expect(getDisplayName('%')).toBe('Selected Folder');
  });
});

describe('getExtension', () => {
  it('lowercases and returns the extension', () => {
    expect(getExtension('Readme.MD')).toBe('md');
  });

  it('returns the whole lowercased name when there is no dot (callers check isLikelyFile first)', () => {
    expect(getExtension('Makefile')).toBe('makefile');
  });
});

describe('isLikelyFile', () => {
  it('treats a short non-numeric extension as a file', () => {
    expect(isLikelyFile('notes.txt')).toBe(true);
  });

  it('treats a name with no dot as a folder', () => {
    expect(isLikelyFile('Documents')).toBe(false);
  });

  it('treats a version-like numeric suffix as a folder', () => {
    expect(isLikelyFile('v1.0.0')).toBe(false);
  });

  it('treats an overly long extension as a folder', () => {
    expect(isLikelyFile('archive.tarball')).toBe(false);
  });
});

describe('getFileIcon', () => {
  it('returns a folder icon for non-file names', () => {
    expect(getFileIcon('Documents', false)).toEqual({ icon: 'folder', color: '#fbc02d' });
  });

  it('returns a code icon for recognized code extensions', () => {
    expect(getFileIcon('index.ts', false).icon).toBe('code');
  });

  it('returns a json icon for .json files', () => {
    expect(getFileIcon('data.json', false).icon).toBe('data-object');
  });
});
