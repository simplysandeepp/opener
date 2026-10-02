import { chunkText } from './chunk';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    expect(chunkText('hello world')).toEqual(['hello world']);
  });

  it('keeps every chunk at or under the size limit', () => {
    const longParagraph = 'word '.repeat(1000);
    const chunks = chunkText(longParagraph);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    }
  });

  it('does not lose content when hard-splitting an oversized paragraph', () => {
    const longParagraph = 'x'.repeat(5000);
    const chunks = chunkText(longParagraph);
    expect(chunks.join('')).toBe(longParagraph);
  });

  it('returns an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('packs multiple short paragraphs into one chunk', () => {
    const text = 'para one\n\npara two\n\npara three';
    expect(chunkText(text)).toEqual([text]);
  });
});
