const CHUNK_SIZE = 2000;

/** Splits text on paragraph boundaries into ~2000-char chunks, hard-splitting any single paragraph that's bigger. */
export function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);

    if (paragraph.length <= CHUNK_SIZE) {
      current = paragraph;
    } else {
      for (let i = 0; i < paragraph.length; i += CHUNK_SIZE) {
        chunks.push(paragraph.slice(i, i + CHUNK_SIZE));
      }
      current = '';
    }
  }
  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : text ? [text] : [];
}
