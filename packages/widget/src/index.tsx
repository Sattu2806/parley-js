import { render } from "preact";
import { fetchConfig } from "./api";
import { App, type Command } from "./App";
import { contrastColor } from "./storage";
import { styles } from "./styles";
import type { MountOptions, WidgetConfig } from "./types";

const VERSION = "1.0.0";

export type Instance = {
  /** Re-render with different (unsaved) settings — the dashboard's live preview. */
  update(overrides: Partial<WidgetConfig>): void;
  command(command: Command): void;
  destroy(): void;
};

type ParleyApi = {
  version: string;
  mount(options: MountOptions): Promise<Instance>;
  open(): void;
  close(): void;
  toggle(): void;
  ask(question: string): void;
};

declare global {
  interface Window {
    Parley?: Partial<ParleyApi> & { q?: [keyof ParleyApi, ...unknown[]][] };
  }
}

const instances = new Set<Instance & { mode: "bubble" | "inline" }>();
let pending: Command[] = [];

/**
 * Page-level commands (Parley.open(), Parley.ask()…) go to one widget: the bubble if there is
 * one, otherwise the most recently mounted inline chat — never to every instance on the page.
 */
function dispatch(command: Command) {
  const all = [...instances];
  const target = all.filter((i) => i.mode === "bubble").pop() ?? all.pop();
  if (target) target.command(command);
  else pending.push(command);
}

async function mount(options: MountOptions): Promise<Instance> {
  const mode = options.mode ?? "bubble";
  const apiUrl = options.apiUrl.replace(/\/+$/, "");
  const host = document.createElement("div");
  host.setAttribute("data-parley", VERSION);
  host.setAttribute("data-chatbot-ignore", ""); // never index the widget itself
  if (mode === "inline") host.style.cssText = "display:block;height:100%;width:100%";
  (mode === "inline" ? (options.container ?? document.body) : document.body).appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  const root = document.createElement("div");
  if (mode === "inline") root.style.cssText = "height:100%";
  shadow.append(style, root);

  let base: WidgetConfig;
  try {
    base = await fetchConfig(apiUrl, options.botKey);
  } catch (err) {
    const message = (err as Error).message;
    console.warn(`[Parley] ${message}`);
    if (mode === "inline") root.innerHTML = `<p class="banner"></p>`, (root.firstChild as HTMLElement).textContent = message;
    else host.remove();
    throw err;
  }

  const listeners = new Set<(command: Command) => void>();
  const subscribe = (listener: (command: Command) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  let overrides = options.overrides ?? {};
  const draw = () => {
    const config = { ...base, ...overrides };
    host.dataset.theme = config.theme;
    host.style.setProperty("--p-brand", config.brandColor);
    host.style.setProperty("--p-on-brand", contrastColor(config.brandColor));
    render(
      <App botKey={options.botKey} apiUrl={apiUrl} mode={mode} config={config} initialOpen={Boolean(options.open)} subscribe={subscribe} />,
      root,
    );
  };
  draw();

  const instance: Instance & { mode: "bubble" | "inline" } = {
    mode,
    update(next) {
      overrides = next;
      draw();
    },
    command(command) {
      listeners.forEach((l) => l(command));
    },
    destroy() {
      render(null, root);
      host.remove();
      instances.delete(instance);
    },
  };
  instances.add(instance);
  // Commands issued before the widget finished loading (e.g. Parley.open() in page code).
  const queued = pending;
  pending = [];
  setTimeout(() => queued.forEach((c) => instance.command(c)), 0);
  return instance;
}

if (!window.Parley?.version) {
  const queue = window.Parley?.q ?? [];
  const api: ParleyApi = {
    version: VERSION,
    mount,
    open: () => dispatch({ type: "open" }),
    close: () => dispatch({ type: "close" }),
    toggle: () => dispatch({ type: "toggle" }),
    ask: (question: string) => dispatch({ type: "ask", question }),
  };
  window.Parley = api;

  // <script src=".../widget.js" data-bot="pk_…" [data-mode="inline"] [data-container="#chat"] [data-api="…"] [data-open]>
  const script = document.currentScript as HTMLScriptElement | null;
  const botKey = script?.dataset.bot;
  // Served from a public CDN (jsDelivr/unpkg), the script's own origin isn't the API.
  const fromCdn = script ? /(^|\.)(jsdelivr\.net|unpkg\.com)$/.test(new URL(script.src).hostname) : false;
  if (script && botKey && fromCdn && !script.dataset.api) {
    console.warn('[Parley] Loaded from a CDN: add data-api="https://your-parley-api" to the script tag.');
  } else if (script && botKey) {
    const start = () => {
      const container = script.dataset.container ? document.querySelector<HTMLElement>(script.dataset.container) : null;
      mount({
        botKey,
        apiUrl: script.dataset.api ?? new URL(script.src).origin,
        mode: script.dataset.mode === "inline" ? "inline" : "bubble",
        container: container ?? undefined,
        open: script.hasAttribute("data-open"),
      }).catch(() => undefined);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  for (const [method, ...args] of queue) {
    const fn = api[method] as ((...a: unknown[]) => unknown) | undefined;
    if (typeof fn === "function") fn(...args);
  }
}
