const BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Groq's catalog changes often - llama-3.3-70b-versatile (this app's original default) was
 * removed from the API entirely (confirmed live: GET /models no longer lists it, and chat
 * completions against it now 404 with "model_not_found"). openai/gpt-oss-120b is the strongest
 * current general-purpose chat model, verified against a live listModels()/chat() call.
 * The model picker lets users switch to any model from listModels() regardless.
 */
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

export type GroqErrorKind = 'unauthorized' | 'rate_limited' | 'network' | 'timeout' | 'unknown';

export class GroqError extends Error {
  kind: GroqErrorKind;

  constructor(kind: GroqErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'GroqError';
  }
}

export interface GroqModel {
  id: string;
  ownedBy: string;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestOptions {
  apiKey: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function groqFetch(path: string, apiKey: string, init: RequestInit, externalSignal?: AbortSignal, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 401) throw new GroqError('unauthorized', 'Invalid Groq API key.');
      if (response.status === 429) throw new GroqError('rate_limited', 'Groq rate limit reached. Try again shortly.');

      let apiMessage: string | undefined;
      try {
        apiMessage = JSON.parse(body)?.error?.message;
      } catch {
        // body wasn't JSON; fall through to the raw-text message below
      }
      throw new GroqError('unknown', apiMessage || `Groq API error (${response.status}): ${body || response.statusText}`);
    }

    return response;
  } catch (e) {
    if (e instanceof GroqError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new GroqError(externalSignal?.aborted ? 'unknown' : 'timeout', 'Request timed out.');
    }
    throw new GroqError('network', 'Could not reach Groq. Check your internet connection.');
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function listModels({ apiKey, signal, timeoutMs }: RequestOptions): Promise<GroqModel[]> {
  const response = await groqFetch('/models', apiKey, { method: 'GET' }, signal, timeoutMs);
  const json = await response.json();
  const data: any[] = json.data ?? [];
  return data
    .map((m) => ({ id: m.id as string, ownedBy: m.owned_by as string }))
    .filter((m) => !m.id.includes('whisper')) // chat UI only; speech-to-text models don't apply here
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function chat(
  messages: GroqMessage[],
  model: string,
  { apiKey, signal, timeoutMs }: RequestOptions
): Promise<string> {
  const response = await groqFetch(
    '/chat/completions',
    apiKey,
    { method: 'POST', body: JSON.stringify({ model, messages, stream: false }) },
    signal,
    timeoutMs
  );
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new GroqError('unknown', 'Unexpected response from Groq.');
  return content;
}
