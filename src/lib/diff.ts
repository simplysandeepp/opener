export type DiffPart = { type: 'equal' | 'add' | 'remove'; text: string };

// Above this, the O(n*m) LCS table gets too large/slow for a UI diff; callers fall back to plain before/after.
export const MAX_DIFF_TOKENS = 600;

function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/** Word-level LCS diff. Quadratic in token count; only meant for short, user-selected passages. */
export function diffWords(oldText: string, newText: string): DiffPart[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (type: DiffPart['type'], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('remove', a[i]);
      i++;
    } else {
      push('add', b[j]);
      j++;
    }
  }
  while (i < n) push('remove', a[i++]);
  while (j < m) push('add', b[j++]);

  return parts;
}
