import { useCallback, useState } from 'react';
import { chat, GroqError, type GroqMessage } from '../lib/llm/groq';

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
        `You are helping the user understand and edit a file named "${fileName}". ` +
        `Answer using only the content below; say so if the answer isn't in it. ` +
        `Be concise by default - a few sentences is usually enough. Only give a longer, ` +
        `detailed answer if the user explicitly asks for more detail or a full explanation.` +
        (truncated ? ' The content was truncated to fit the context window.' : '') +
        `\n\n---\n${contextContent}\n---`;

      const apiMessages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: trimmed },
      ];

      const reply = await chat(apiMessages, model, { apiKey, timeoutMs: 30000 });
      setMessages((prev) => [...prev, { id: `${Date.now()}-assistant`, role: 'assistant', content: reply }]);
    } catch (e) {
      const message = e instanceof GroqError ? e.message : 'Something went wrong.';
      setMessages((prev) => [...prev, { id: `${Date.now()}-error`, role: 'error', content: message }]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, model, fileName, contextContent, truncated, messages, isLoading]);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, isLoading, truncated, send, reset };
}
