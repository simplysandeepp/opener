import { parseCSV } from './csv';

describe('parseCSV', () => {
  it('parses simple rows', () => {
    expect(parseCSV('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(parseCSV('a,b\n1,"two, three"')).toEqual([
      ['a', 'b'],
      ['1', 'two, three'],
    ]);
  });

  it('handles escaped quotes inside a quoted field', () => {
    expect(parseCSV('a\n"she said ""hi"""')).toEqual([['a'], ['she said "hi"']]);
  });

  it('handles embedded newlines inside a quoted field', () => {
    expect(parseCSV('a,b\n"line1\nline2",2')).toEqual([
      ['a', 'b'],
      ['line1\nline2', '2'],
    ]);
  });

  it('ignores a trailing blank line', () => {
    expect(parseCSV('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });
});
