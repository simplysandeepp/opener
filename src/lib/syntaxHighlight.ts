export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'plain';

export interface Token {
  text: string;
  type: TokenType;
}

// A broad, language-agnostic keyword set. Good enough for readable highlighting
// without pulling in a per-language grammar/parser dependency.
const KEYWORDS = new Set([
  'if', 'else', 'elif', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'function', 'func', 'fn', 'def', 'class', 'struct', 'interface', 'enum', 'impl', 'trait',
  'const', 'let', 'var', 'public', 'private', 'protected', 'static', 'final', 'readonly', 'abstract',
  'async', 'await', 'yield', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'delete', 'typeof',
  'instanceof', 'import', 'export', 'from', 'as', 'default', 'extends', 'implements', 'package',
  'namespace', 'using', 'use', 'mod', 'pub', 'void', 'int', 'float', 'double', 'bool', 'boolean',
  'char', 'string', 'String', 'self', 'this', 'super', 'null', 'None', 'nil', 'undefined', 'true',
  'false', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'lambda', 'with', 'global', 'nonlocal',
  'match', 'type', 'module', 'end', 'then', 'begin', 'where', 'go', 'defer', 'chan', 'select',
]);

const TOKEN_REGEX =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), type: 'plain' });
    }

    const [full, comment, string, number, word] = match;
    if (comment !== undefined) tokens.push({ text: full, type: 'comment' });
    else if (string !== undefined) tokens.push({ text: full, type: 'string' });
    else if (number !== undefined) tokens.push({ text: full, type: 'number' });
    else if (word !== undefined) tokens.push({ text: full, type: KEYWORDS.has(word) ? 'keyword' : 'plain' });

    lastIndex = match.index + full.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), type: 'plain' });
  }

  return tokens;
}

export function tokenColor(type: TokenType, isDark: boolean): string {
  switch (type) {
    case 'comment': return isDark ? '#6a9955' : '#008000';
    case 'string': return isDark ? '#ce9178' : '#a31515';
    case 'number': return isDark ? '#b5cea8' : '#098658';
    case 'keyword': return isDark ? '#569cd6' : '#0000ff';
    default: return isDark ? '#d4d4d4' : '#333333';
  }
}

export const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py', 'java', 'c', 'h', 'cpp', 'cc', 'hpp', 'cs', 'go',
  'rb', 'php', 'rs', 'swift', 'kt', 'kts', 'sh', 'bash', 'zsh', 'yml', 'yaml', 'xml', 'css', 'scss',
  'less', 'sql', 'lua', 'pl', 'r', 'dart', 'm', 'mm', 'vue', 'graphql', 'gql', 'toml', 'ini', 'conf',
  'gradle', 'properties', 'bat', 'ps1',
]);
