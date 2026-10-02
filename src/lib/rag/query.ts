/** Turns a free-text question into an FTS5 MATCH query: OR of its significant words, so any match counts. */
export function buildMatchQuery(question: string): string {
  const words = question.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const unique = Array.from(new Set(words)).slice(0, 12);
  if (unique.length === 0) return `"${question.replace(/"/g, '')}"`;
  return unique.map((w) => `"${w}"`).join(' OR ');
}
