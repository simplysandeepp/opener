import { useCallback, useState } from 'react';
import { chat, GroqError } from '../lib/llm/groq';

interface RunParams {
  instruction: string;
  text: string;
  apiKey: string;
  model: string;
}

/** One-shot (non-conversational) text transform: instruction + selected text in, replacement text out. */
export function useInlineAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async ({ instruction, text, apiKey, model }: RunParams) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const reply = await chat(
        [
          {
            role: 'system',
            content: 'You rewrite text exactly as instructed. Reply with ONLY the resulting text - no explanations, quotes, or preamble.',
          },
          { role: 'user', content: `${instruction}\n\n---\n${text}\n---` },
        ],
        model,
        { apiKey, timeoutMs: 30000 }
      );
      setResult(reply.trim());
    } catch (e) {
      setError(e instanceof GroqError ? e.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isLoading, result, error, run, reset };
}
