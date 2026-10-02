import { searchFilenames } from './search';

describe('searchFilenames', () => {
  const entries = ['content://x/document/Readme.md', 'content://x/document/notes.txt', 'content://x/document/report.pdf'];

  it('filters case-insensitively by display name', () => {
    const results = searchFilenames(entries, 'read');
    expect(results).toEqual([{ uri: entries[0], name: 'Readme.md' }]);
  });

  it('returns multiple matches', () => {
    const results = searchFilenames(entries, '.');
    expect(results).toHaveLength(3);
  });

  it('returns no matches when nothing fits', () => {
    expect(searchFilenames(entries, 'zzz')).toEqual([]);
  });
});
