import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { streamChat, WidgetError } from "./api";
import { ChatIcon, CloseIcon, RefreshIcon, SendIcon, StopIcon } from "./icons";
import { LeadCard, LeadForm } from "./LeadForm";
import { linkProps, Markdown } from "./RichText";
import { stripCitations } from "./markdown";
import { conversationStore, newSessionId } from "./storage";
import type { ChatEvent, LeadReceipt, Source, UiMessage, WidgetConfig } from "./types";

const MAX_LENGTH = 1000;
const uid = () => Math.random().toString(36).slice(2, 10);

export type Command = { type: "open" | "close" | "toggle" } | { type: "ask"; question: string };

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AI"
  );
}

function citedSources(message: UiMessage): Source[] {
  const seen = new Set<string>();
  return (message.sources ?? [])
    .filter((s) => message.citations?.includes(s.n))
    .filter((s) => {
      const key = `${s.url}|${s.heading}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function Message(props: {
  message: UiMessage;
  avatar: string;
  apiUrl: string;
  botKey: string;
  sessionId: string;
  onRetry: () => void;
  onLeadSent: (receipt: LeadReceipt) => void;
}) {
  const { message: m } = props;
  if (m.role === "user") {
    return (
      <div class="row user">
        <div class="bubble user">{m.content}</div>
      </div>
    );
  }
  const sources = citedSources(m);
  return (
    <div class="row">
      <div class="bot-avatar" aria-hidden="true">
        {props.avatar}
      </div>
      <div class="stack">
        <div class="bubble bot">
          {m.content ? (
            <Markdown text={m.content} sources={m.sources ?? []} />
          ) : m.status === "streaming" ? (
            <span class="typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </span>
          ) : null}
          {m.status === "stopped" ? <p class="note">Stopped.</p> : null}
          {m.status === "error" ? (
            <>
              <p class="error-text" role="alert">
                {m.error ?? "Something went wrong."}
              </p>
              <button type="button" class="text-btn" onClick={props.onRetry}>
                Try again
              </button>
            </>
          ) : null}
        </div>
        {m.activity ? <p class="note">{m.activity}</p> : null}
        {m.lead ? <LeadCard receipt={m.lead} /> : null}
        {m.leadForm === "open" && !m.lead ? (
          <LeadForm apiUrl={props.apiUrl} botKey={props.botKey} sessionId={props.sessionId} onSent={props.onLeadSent} />
        ) : null}
        {sources.length ? (
          <div class="chips" aria-label="Sources">
            {sources.slice(0, 4).map((s) => {
              const label = s.heading && s.heading !== s.title ? s.heading : s.title.split(" · ")[0];
              const link = linkProps(s.url);
              return link ? (
                <a class="chip" {...link} title={s.title}>
                  <b>{s.n}</b>
                  <span>{label}</span>
                </a>
              ) : (
                <span class="chip" title={s.title}>
                  <b>{s.n}</b>
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function App(props: {
  botKey: string;
  apiUrl: string;
  mode: "bubble" | "inline";
  config: WidgetConfig;
  initialOpen: boolean;
  subscribe: (listener: (command: Command) => void) => () => void;
}) {
  const { config, mode, botKey, apiUrl } = props;
  const store = useMemo(() => conversationStore(botKey), [botKey]);
  const [saved] = useState(() => store.load());
  const [open, setOpen] = useState(() => mode === "inline" || props.initialOpen || store.loadOpen());
  const [sessionId, setSessionId] = useState(() => saved?.sessionId ?? newSessionId());
  const [messages, setMessages] = useState<UiMessage[]>(() => saved?.messages ?? []);
  const [input, setInput] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const controllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const stick = useRef(true);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const busy = messages.some((m) => m.status === "streaming");
  const avatar = initials(config.assistantName || config.businessName);

  useEffect(() => store.save(sessionId, messages), [store, sessionId, messages]);
  useEffect(() => {
    if (mode === "bubble") store.saveOpen(open);
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, open]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const update = (id: string, change: (m: UiMessage) => UiMessage) => setMessages((prev) => prev.map((m) => (m.id === id ? change(m) : m)));

  async function send(text: string, base: UiMessage[] = messagesRef.current) {
    const content = text.trim().slice(0, MAX_LENGTH);
    if (!content || base.some((m) => m.status === "streaming")) return;
    const user: UiMessage = { id: uid(), role: "user", content, status: "done" };
    const reply: UiMessage = { id: uid(), role: "assistant", content: "", status: "streaming", activity: "Searching…" };
    const history = [...base.filter((m) => m.content && (m.status === "done" || m.status === "stopped")), user]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.role === "assistant" ? stripCitations(m.content) : m.content }));

    setMessages([...base, user, reply]);
    setInput("");
    stick.current = true;

    const controller = new AbortController();
    controllerRef.current = controller;
    let replyText = "";
    const onEvent = (event: ChatEvent) => {
      switch (event.type) {
        case "sources":
          update(reply.id, (m) => ({ ...m, sources: event.sources }));
          break;
        case "delta":
          replyText += event.text;
          update(reply.id, (m) => ({ ...m, content: m.content + event.text, activity: undefined }));
          break;
        case "tool":
          update(reply.id, (m) => ({
            ...m,
            activity: event.status === "started" ? (event.name === "search_knowledge" ? "Looking that up…" : "Sending your request…") : undefined,
            ...(event.status === "done" && event.data ? { lead: event.data } : {}),
          }));
          break;
        case "action":
          update(reply.id, (m) => ({ ...m, leadForm: "open" }));
          break;
        case "done":
          setAnnouncement(stripCitations(replyText));
          update(reply.id, (m) => ({ ...m, status: "done", citations: event.citations, mode: event.mode, activity: undefined }));
          break;
        case "error":
          update(reply.id, (m) => ({ ...m, status: "error", error: event.message, activity: undefined }));
          break;
      }
    };

    try {
      await streamChat({ apiUrl, botKey, messages: history, sessionId, signal: controller.signal, onEvent });
      update(reply.id, (m) =>
        m.status === "streaming"
          ? { ...m, status: m.content ? "done" : "error", error: m.content ? undefined : "The connection was interrupted.", activity: undefined }
          : m,
      );
    } catch (err) {
      if (controller.signal.aborted) update(reply.id, (m) => ({ ...m, status: "stopped", activity: undefined }));
      else {
        const message = err instanceof WidgetError ? err.message : "We couldn't reach the assistant. Check your connection and try again.";
        update(reply.id, (m) => ({ ...m, status: "error", error: message, activity: undefined }));
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  // Commands from window.Parley (open / close / toggle / ask).
  useEffect(
    () =>
      props.subscribe((command) => {
        if (command.type === "open") setOpen(true);
        else if (command.type === "close") mode === "bubble" && setOpen(false);
        else if (command.type === "toggle") mode === "bubble" && setOpen((o) => !o);
        else if (command.type === "ask") {
          setOpen(true);
          void send(command.question);
        }
      }),
    [],
  );

  function retry(id: string) {
    const all = messagesRef.current;
    const index = all.findIndex((m) => m.id === id);
    const question = all[index - 1];
    if (index < 1 || question?.role !== "user") return;
    void send(question.content, all.slice(0, index - 1));
  }

  function newChat() {
    controllerRef.current?.abort();
    store.clear();
    setMessages([]);
    setSessionId(newSessionId());
    inputRef.current?.focus();
  }

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  const side = config.position === "left" ? "left" : "right";
  const subtitle = config.mode === "offline" ? "Answers from our website" : "AI assistant · usually replies instantly";

  return (
    <>
      {open ? (
        <section
          class={`panel ${mode === "inline" ? "inline" : `floating ${side}`}`}
          role={mode === "inline" ? "region" : "dialog"}
          aria-label={`Chat with ${config.assistantName}`}
          onKeyDown={(e) => mode === "bubble" && e.key === "Escape" && close()}
        >
          <header class="header">
            <div class="avatar" aria-hidden="true">
              {avatar}
              <span class="dot" />
            </div>
            <div class="title">
              <h2>{config.assistantName}</h2>
              <p>{subtitle}</p>
            </div>
            <button type="button" class="icon-btn" onClick={newChat} title="New conversation">
              <RefreshIcon />
              <span class="sr-only">Start a new conversation</span>
            </button>
            {mode === "bubble" ? (
              <button type="button" class="icon-btn" onClick={close} title="Close">
                <CloseIcon />
                <span class="sr-only">Close chat</span>
              </button>
            ) : null}
          </header>

          <div
            class="messages"
            ref={listRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            <div class="row">
              <div class="bot-avatar" aria-hidden="true">
                {avatar}
              </div>
              <div class="stack">
                <div class="bubble bot">{config.greeting}</div>
              </div>
            </div>
            {!messages.length && config.suggestedQuestions.length ? (
              <div class="suggestions">
                {config.suggestedQuestions.map((q) => (
                  <button type="button" class="suggestion" onClick={() => void send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((m) => (
              <Message
                key={m.id}
                message={m}
                avatar={avatar}
                apiUrl={apiUrl}
                botKey={botKey}
                sessionId={sessionId}
                onRetry={() => retry(m.id)}
                onLeadSent={(receipt) => update(m.id, (x) => ({ ...x, leadForm: "sent", lead: receipt }))}
              />
            ))}
          </div>

          <div class="sr-only" aria-live="polite">
            {announcement}
          </div>

          <form
            class="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div class="input-wrap">
              <label class="sr-only" for="parley-input">
                Your message
              </label>
              <textarea
                id="parley-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_LENGTH}
                placeholder="Ask a question…"
                onInput={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
              />
              {busy ? (
                <button type="button" class="send" onClick={() => controllerRef.current?.abort()} title="Stop">
                  <StopIcon />
                  <span class="sr-only">Stop generating</span>
                </button>
              ) : (
                <button type="submit" class="send" disabled={!input.trim()} title="Send">
                  <SendIcon />
                  <span class="sr-only">Send</span>
                </button>
              )}
            </div>
            <div class="footer">
              <span>AI can make mistakes. Check important details.</span>
              <span>Powered by Parley</span>
            </div>
          </form>
        </section>
      ) : null}

      {mode === "bubble" ? (
        <button
          ref={launcherRef}
          type="button"
          class={`launcher ${side}${open ? " hidden-mobile" : ""}`}
          aria-expanded={open}
          aria-label={open ? "Close chat" : `Chat with ${config.assistantName}`}
          onClick={() => (open ? close() : setOpen(true))}
        >
          {open ? <CloseIcon size={24} /> : <ChatIcon />}
        </button>
      ) : null}
    </>
  );
}
