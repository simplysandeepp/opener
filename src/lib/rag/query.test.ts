import { buildMatchQuery } from './query';

describe('buildMatchQuery', () => {
  it('ORs together significant words, lowercased', () => {
    expect(buildMatchQuery('What does the README say?')).toBe('"what" OR "does" OR "the" OR "readme" OR "say"');
  });

  it('drops short words below the 3-character minimum', () => {
    const query = buildMatchQuery('is it ok to do this');
    expect(query).not.toContain('"is"');
    expect(query).not.toContain('"it"');
    expect(query).not.toContain('"ok"');
  });

  it('de-duplicates repeated words', () => {
    const query = buildMatchQuery('test test test');
    expect(query).toBe('"test"');
  });

  it('falls back to a quoted literal when there are no word-like terms', () => {
    expect(buildMatchQuery('!!!')).toBe('"!!!"');
  });
});
