import { getMimeType } from './mimeTypes';

describe('getMimeType', () => {
  it('maps known extensions', () => {
    expect(getMimeType('md')).toBe('text/markdown');
    expect(getMimeType('json')).toBe('application/json');
    expect(getMimeType('csv')).toBe('text/csv');
  });

  it('is case-insensitive', () => {
    expect(getMimeType('MD')).toBe('text/markdown');
  });

  it('falls back to text/plain for unknown extensions', () => {
    expect(getMimeType('xyz')).toBe('text/plain');
  });
});
