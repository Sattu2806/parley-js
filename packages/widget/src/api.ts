import { createSseParser } from "./sse";
import type { ChatEvent, WidgetConfig } from "./types";

export class WidgetError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function errorFrom(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return new WidgetError(body.error ?? `Request failed (HTTP ${res.status}).`, res.status);
}

export async function fetchConfig(apiUrl: string, botKey: string): Promise<WidgetConfig> {
  const res = await fetch(`${apiUrl}/api/widget/${encodeURIComponent(botKey)}/config`);
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as WidgetConfig;
}

export async function streamChat(options: {
  apiUrl: string;
  botKey: string;
  messages: { role: "user" | "assistant"; content: string }[];
  sessionId: string;
  signal?: AbortSignal;
  onEvent: (event: ChatEvent) => void;
}) {
  const res = await fetch(`${options.apiUrl}/api/widget/${encodeURIComponent(options.botKey)}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ messages: options.messages, sessionId: options.sessionId, pageUrl: location.href.slice(0, 500) }),
    signal: options.signal,
  });
  if (!res.ok || !res.body) throw await errorFrom(res);

  const parse = createSseParser(({ data }) => {
    try {
      options.onEvent(JSON.parse(data) as ChatEvent);
    } catch {
      // ignore malformed events
    }
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    parse(decoder.decode(value, { stream: true }));
  }
}

export async function sendLead(apiUrl: string, botKey: string, input: Record<string, string | undefined>) {
  const res = await fetch(`${apiUrl}/api/widget/${encodeURIComponent(botKey)}/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await errorFrom(res);
  return ((await res.json()) as { reference: string }).reference;
}
