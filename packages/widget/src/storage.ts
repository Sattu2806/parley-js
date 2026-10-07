import type { UiMessage } from "./types";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
type Saved = { sessionId: string; messages: UiMessage[]; savedAt: number };

/** RFC 4122 v4 id; works on plain-http pages where crypto.randomUUID is unavailable. */
export function newSessionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Per-bot conversation storage. Every access is guarded: storage can be blocked or full. */
export function conversationStore(botKey: string) {
  const key = `parley:${botKey}`;
  return {
    load(): Saved | null {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Saved | null;
        if (!saved?.sessionId || !Array.isArray(saved.messages) || Date.now() - saved.savedAt > MAX_AGE_MS) return null;
        saved.messages = saved.messages.map((m) => (m.status === "streaming" ? { ...m, status: "stopped", activity: undefined } : m));
        return saved;
      } catch {
        return null;
      }
    },
    save(sessionId: string, messages: UiMessage[]) {
      try {
        localStorage.setItem(key, JSON.stringify({ sessionId, messages: messages.slice(-40), savedAt: Date.now() }));
      } catch {
        // the chat still works for this page view
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
    loadOpen() {
      try {
        return sessionStorage.getItem(`${key}:open`) === "1";
      } catch {
        return false;
      }
    },
    saveOpen(open: boolean) {
      try {
        sessionStorage.setItem(`${key}:open`, open ? "1" : "0");
      } catch {
        // ignore
      }
    },
  };
}

/** Readable text colour (white or near-black) on top of a brand colour. */
export function contrastColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.45 ? "#111827" : "#ffffff";
}
