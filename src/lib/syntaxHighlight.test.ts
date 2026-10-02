import { tokenizeLine, tokenColor, CODE_EXTENSIONS } from './syntaxHighlight';

describe('tokenizeLine', () => {
  it('classifies keywords, strings, numbers, and comments', () => {
    const tokens = tokenizeLine('const x = "hi"; // note');
    expect(tokens).toEqual([
      { text: 'const', type: 'keyword' },
      { text: ' ', type: 'plain' },
      { text: 'x', type: 'plain' },
      { text: ' = ', type: 'plain' },
      { text: '"hi"', type: 'string' },
      { text: '; ', type: 'plain' },
      { text: '// note', type: 'comment' },
    ]);
  });

  it('classifies numbers', () => {
    const tokens = tokenizeLine('return 1 + 2.5');
    expect(tokens.find((t) => t.text === '1')?.type).toBe('number');
    expect(tokens.find((t) => t.text === '2.5')?.type).toBe('number');
  });

  it('does not misclassify a non-keyword identifier', () => {
    const tokens = tokenizeLine('myVariable');
    expect(tokens).toEqual([{ text: 'myVariable', type: 'plain' }]);
  });

  it('handles an empty line', () => {
    expect(tokenizeLine('')).toEqual([]);
  });
});

describe('tokenColor', () => {
  it('returns distinct colors for dark and light themes', () => {
    expect(tokenColor('keyword', true)).not.toBe(tokenColor('keyword', false));
  });
});

describe('CODE_EXTENSIONS', () => {
  it('includes common source extensions', () => {
    expect(CODE_EXTENSIONS.has('ts')).toBe(true);
    expect(CODE_EXTENSIONS.has('py')).toBe(true);
  });

  it('excludes extensions handled by dedicated viewers', () => {
    expect(CODE_EXTENSIONS.has('md')).toBe(false);
    expect(CODE_EXTENSIONS.has('json')).toBe(false);
  });
});
