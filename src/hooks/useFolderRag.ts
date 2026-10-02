import { useCallback, useState } from 'react';
import { chat, GroqError } from '../lib/llm/groq';
import { searchFolder } from '../lib/rag/db';
import { buildMatchQuery } from '../lib/rag/query';

export interface FolderRagSource {
  uri: string;
  name: string;
}

export interface FolderRagAnswer {
  answer: string;
  sources: FolderRagSource[];
}

/** Folder-level "RAG": retrieve matching chunks via SQLite FTS5, then ask Groq using only that context. */
export function useFolderRag(folderRoot: string | null, apiKey: string | null, model: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<FolderRagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!folderRoot || !apiKey || !trimmed) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const matches = await searchFolder(folderRoot, buildMatchQuery(trimmed), 6);

      if (matches.length === 0) {
        setAnswer({ answer: "I couldn't find anything relevant to that in this folder's index.", sources: [] });
        return;
      }

      const context = matches.map((m, i) => `[${i + 1}] ${m.name}\n${m.content}`).join('\n\n---\n\n');
      const systemPrompt =
        "Answer the question using ONLY the excerpts below, each labeled with its source file. " +
        "Cite which file(s) you used. If the excerpts don't contain the answer, say so.\n\n" + context;

      const reply = await chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: trimmed },
        ],
        model,
        { apiKey, timeoutMs: 30000 }
      );

      const sources = Array.from(new Map(matches.map((m) => [m.uri, { uri: m.uri, name: m.name }])).values());
      setAnswer({ answer: reply, sources });
    } catch (e) {
      setError(e instanceof GroqError ? e.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, [folderRoot, apiKey, model]);

  const reset = useCallback(() => {
    setAnswer(null);
    setError(null);
  }, []);

  return { isLoading, answer, error, ask, reset };
}
