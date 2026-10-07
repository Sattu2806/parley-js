export type Source = { n: number; title: string; url: string; heading: string };
export type LeadReceipt = { reference: string; name: string; preferredTime?: string; reason?: string };

/** Mirrors the server's ChatEvent union (server/src/agent/types.ts). */
export type ChatEvent =
  | { type: "session"; sessionId: string }
  | { type: "sources"; sources: Source[] }
  | { type: "delta"; text: string }
  | { type: "tool"; name: "search_knowledge" | "send_request"; status: "started" | "done" | "error"; data?: LeadReceipt; message?: string }
  | { type: "action"; action: "lead_form" }
  | { type: "done"; mode: "llm" | "offline"; citations: number[] }
  | { type: "error"; message: string };

export type WidgetConfig = {
  name: string;
  assistantName: string;
  businessName: string;
  greeting: string;
  suggestedQuestions: string[];
  brandColor: string;
  position: "right" | "left";
  theme: "light" | "dark" | "auto";
  leadCapture: { enabled: boolean; purpose: string };
  contact: string;
  mode: "llm" | "offline";
};

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "done" | "stopped" | "error";
  sources?: Source[];
  citations?: number[];
  lead?: LeadReceipt;
  activity?: string;
  leadForm?: "open" | "sent";
  error?: string;
  mode?: "llm" | "offline";
};

export type MountOptions = {
  botKey: string;
  apiUrl: string;
  mode?: "bubble" | "inline";
  /** Element to render into in inline mode (defaults to document.body). */
  container?: HTMLElement;
  /** Override settings without saving them — used by the dashboard's live preview. */
  overrides?: Partial<WidgetConfig>;
  /** Open the panel on load (bubble mode). */
  open?: boolean;
};
