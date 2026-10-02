import { useCallback, useState } from 'react';
import { chat, GroqError, type GroqMessage, type GroqRateLimit } from '../lib/llm/groq';

// Conservative fixed cap (not per-model), so a huge file doesn't produce a huge/slow request.
const MAX_CONTEXT_CHARS = 12000;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
}

export function useFileChat(fileName: string, fileContent: string, apiKey: string | null, model: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<GroqRateLimit | null>(null);

  const truncated = fileContent.length > MAX_CONTEXT_CHARS;
  const contextContent = truncated ? fileContent.slice(0, MAX_CONTEXT_CHARS) : fileContent;

  const send = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!apiKey || !trimmed || isLoading) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: trimmed };
    const history = messages.filter((m) => m.role !== 'error');
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const systemPrompt =
        `You are OpenerAi, the AI assistant built into the Opener file viewer app, currently helping ` +
        `with a file named "${fileName}". Answer using only the file content provided below - if the ` +
        `answer isn't in it, say so plainly instead of guessing. When relevant, quote or reference the ` +
        `specific part of the file (a heading, function/variable name, or short excerpt) your answer is ` +
        `based on, so the user can verify it. Use markdown where it helps readability - headings, bullet ` +
        `lists, and fenced code blocks for code - it renders properly here. Be concise by default: a few ` +
        `sentences or a short list is usually enough. Only give a longer, structured answer when the user ` +
        `explicitly asks for more detail, a full explanation, or a step-by-step walkthrough.` +
        (truncated ? ' The file content below was truncated to fit the context window; mention that if it seems relevant.' : '') +
        `\n\n---\n${contextContent}\n---`;

      const apiMessages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: trimmed },
      ];

      const { content: reply, rateLimit: nextRateLimit } = await chat(apiMessages, model, { apiKey, timeoutMs: 30000 });
      setRateLimit(nextRateLimit);
      setMessages((prev) => [...prev, { id: `${Date.now()}-assistant`, role: 'assistant', content: reply }]);
    } catch (e) {
      if (e instanceof GroqError && e.kind === 'rate_limited') {
        // Headers are present on error responses too; a 429 is itself the most up-to-date usage signal.
        setRateLimit((prev) => prev ?? { remainingRequests: 0 });
      }
      const message = e instanceof GroqError ? e.message : 'Something went wrong.';
      setMessages((prev) => [...prev, { id: `${Date.now()}-error`, role: 'error', content: message }]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, model, fileName, contextContent, truncated, messages, isLoading]);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, isLoading, truncated, rateLimit, send, reset };
}
