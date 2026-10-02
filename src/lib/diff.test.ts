import { diffWords } from './diff';

describe('diffWords', () => {
  it('returns a single equal part when nothing changed', () => {
    expect(diffWords('hello world', 'hello world')).toEqual([{ type: 'equal', text: 'hello world' }]);
  });

  it('detects an added word', () => {
    const parts = diffWords('hello world', 'hello brave world');
    expect(parts.some((p) => p.type === 'add' && p.text.includes('brave'))).toBe(true);
  });

  it('detects a removed word', () => {
    const parts = diffWords('hello brave world', 'hello world');
    expect(parts.some((p) => p.type === 'remove' && p.text.includes('brave'))).toBe(true);
  });

  it('reconstructs the new text by concatenating equal+add parts', () => {
    const oldText = 'the quick fox';
    const newText = 'the quick brown fox';
    const parts = diffWords(oldText, newText);
    const reconstructed = parts
      .filter((p) => p.type !== 'remove')
      .map((p) => p.text)
      .join('');
    expect(reconstructed).toBe(newText);
  });

  it('handles an empty old text (pure addition)', () => {
    expect(diffWords('', 'new content')).toEqual([{ type: 'add', text: 'new content' }]);
  });
});
