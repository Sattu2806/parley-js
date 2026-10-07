// Scoped inside the widget's shadow root, so nothing here leaks into (or is affected by) the host page.
export const styles = /* css */ `
:host {
  all: initial;
  --p-brand: #0284c7;
  --p-on-brand: #ffffff;
  --p-bg: #ffffff;
  --p-fg: #18181b;
  --p-muted: #71717a;
  --p-subtle: #a1a1aa;
  --p-surface: #f4f4f5;
  --p-border: #e4e4e7;
  --p-input: #ffffff;
  --p-success-bg: #ecfdf5;
  --p-success-fg: #065f46;
  --p-success-border: #a7f3d0;
  --p-danger: #b91c1c;
  --p-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.04);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--p-fg);
  -webkit-font-smoothing: antialiased;
}
:host([data-theme="dark"]) {
  --p-bg: #18181b;
  --p-fg: #f4f4f5;
  --p-muted: #a1a1aa;
  --p-subtle: #71717a;
  --p-surface: #27272a;
  --p-border: #3f3f46;
  --p-input: #09090b;
  --p-success-bg: #022c22;
  --p-success-fg: #a7f3d0;
  --p-success-border: #065f46;
  --p-danger: #fca5a5;
  --p-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06);
}
@media (prefers-color-scheme: dark) {
  :host([data-theme="auto"]) {
    --p-bg: #18181b;
    --p-fg: #f4f4f5;
    --p-muted: #a1a1aa;
    --p-subtle: #71717a;
    --p-surface: #27272a;
    --p-border: #3f3f46;
    --p-input: #09090b;
    --p-success-bg: #022c22;
    --p-success-fg: #a7f3d0;
    --p-success-border: #065f46;
    --p-danger: #fca5a5;
    --p-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06);
  }
}
*, *::before, *::after { box-sizing: border-box; }
button, input, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: inherit; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.launcher {
  position: fixed; bottom: 20px; z-index: 2147483000;
  width: 56px; height: 56px; border-radius: 999px; border: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--p-brand); color: var(--p-on-brand);
  box-shadow: 0 10px 30px -6px rgba(15, 23, 42, 0.35);
  transition: transform 0.15s ease, filter 0.15s ease;
}
.launcher:hover { transform: scale(1.05); filter: brightness(1.05); }
.launcher:focus-visible { outline: 3px solid var(--p-brand); outline-offset: 3px; }
.right { right: 20px; }
.left { left: 20px; }

.panel {
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--p-bg); color: var(--p-fg);
}
.panel.floating {
  position: fixed; bottom: 88px; z-index: 2147483000;
  width: 390px; height: min(640px, calc(100vh - 112px));
  border-radius: 22px; box-shadow: var(--p-shadow);
  animation: p-pop 0.18s ease-out;
}
.panel.inline { width: 100%; height: 100%; min-height: 360px; }
@keyframes p-pop { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
@media (max-width: 640px) {
  .panel.floating { inset: 0; width: 100%; height: 100%; border-radius: 0; }
  .launcher.hidden-mobile { display: none; }
}

.header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--p-brand); color: var(--p-on-brand); }
.avatar { position: relative; flex: none; width: 36px; height: 36px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; background: rgba(255,255,255,0.2); }
.avatar .dot { position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border-radius: 999px; background: #22c55e; border: 2px solid var(--p-brand); }
.title { flex: 1; min-width: 0; }
.title h2 { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.3; }
.title p { margin: 0; font-size: 12px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon-btn { flex: none; border: 0; background: transparent; color: inherit; padding: 7px; border-radius: 999px; display: flex; opacity: 0.85; }
.icon-btn:hover { background: rgba(255,255,255,0.18); opacity: 1; }
.icon-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }

.messages { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; gap: 8px; }
.row.user { justify-content: flex-end; }
.bot-avatar { flex: none; width: 26px; height: 26px; margin-top: 2px; border-radius: 999px; background: var(--p-brand); color: var(--p-on-brand); font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.stack { min-width: 0; max-width: 86%; }
.bubble { padding: 9px 13px; border-radius: 18px; word-wrap: break-word; overflow-wrap: anywhere; }
.bubble.user { max-width: 84%; background: var(--p-brand); color: var(--p-on-brand); border-bottom-right-radius: 6px; white-space: pre-wrap; }
.bubble.bot { background: var(--p-surface); border-top-left-radius: 6px; }
.bubble p { margin: 0; }
.bubble p + p, .bubble p + ul, .bubble p + ol, .bubble ul + p, .bubble ol + p { margin-top: 8px; }
.bubble ul, .bubble ol { margin: 0; padding-left: 20px; }
.bubble li + li { margin-top: 3px; }
.bubble code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.88em; background: var(--p-border); border-radius: 4px; padding: 0 4px; }
.bubble a.link { color: var(--p-brand); font-weight: 500; text-underline-offset: 2px; }
.cite { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 4px; margin-left: 2px; border-radius: 999px; font-size: 10px; font-weight: 600; text-decoration: none; vertical-align: super; line-height: 1; background: color-mix(in srgb, var(--p-brand) 16%, transparent); color: var(--p-brand); }
.cite:hover { background: color-mix(in srgb, var(--p-brand) 28%, transparent); }
.note { margin: 4px 0 0 4px; font-size: 12px; color: var(--p-muted); }
.error-text { color: var(--p-danger); }
.text-btn { border: 0; background: none; padding: 0; color: var(--p-brand); font-size: 12px; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }

.typing { display: inline-flex; gap: 4px; padding: 4px 0; }
.typing span { width: 6px; height: 6px; border-radius: 999px; background: var(--p-subtle); animation: p-bounce 1.2s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes p-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-4px); opacity: 1; } }

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; padding: 4px 10px; border: 1px solid var(--p-border); border-radius: 999px; font-size: 12px; text-decoration: none; color: var(--p-muted); background: var(--p-bg); }
.chip b { color: var(--p-brand); }
.chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
a.chip:hover { border-color: var(--p-brand); color: var(--p-fg); }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; padding-left: 34px; }
.suggestion { border: 1px solid color-mix(in srgb, var(--p-brand) 35%, transparent); background: color-mix(in srgb, var(--p-brand) 8%, transparent); color: var(--p-fg); border-radius: 999px; padding: 6px 12px; font-size: 13px; text-align: left; }
.suggestion:hover { background: color-mix(in srgb, var(--p-brand) 16%, transparent); }

.card { margin-top: 10px; border-radius: 14px; padding: 12px; font-size: 13px; }
.card.success { background: var(--p-success-bg); color: var(--p-success-fg); border: 1px solid var(--p-success-border); }
.card.success strong { display: block; margin-bottom: 2px; font-size: 14px; }
.form { margin-top: 10px; display: grid; gap: 8px; padding: 12px; border: 1px solid var(--p-border); border-radius: 14px; background: var(--p-bg); }
.form .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.field { width: 100%; border: 1px solid var(--p-border); background: var(--p-input); border-radius: 10px; padding: 8px 10px; font-size: 13px; outline: none; }
.field:focus { border-color: var(--p-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-brand) 20%, transparent); }
.primary { border: 0; border-radius: 999px; padding: 9px 14px; font-weight: 600; font-size: 13px; background: var(--p-brand); color: var(--p-on-brand); }
.primary:disabled { opacity: 0.6; cursor: default; }

.composer { border-top: 1px solid var(--p-border); padding: 12px 12px 8px; }
.input-wrap { display: flex; align-items: flex-end; gap: 8px; padding: 8px 8px 8px 12px; border: 1px solid var(--p-border); border-radius: 18px; background: var(--p-input); }
.input-wrap:focus-within { border-color: var(--p-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-brand) 18%, transparent); }
.input-wrap textarea { flex: 1; resize: none; border: 0; outline: none; background: transparent; max-height: 120px; min-height: 22px; padding: 2px 0; font-size: 14px; field-sizing: content; }
.input-wrap textarea::placeholder { color: var(--p-subtle); }
.send { flex: none; width: 32px; height: 32px; border: 0; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: var(--p-brand); color: var(--p-on-brand); }
.send:disabled { background: var(--p-border); color: var(--p-subtle); cursor: default; }
.footer { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; padding: 0 4px; font-size: 11px; color: var(--p-subtle); }
.banner { margin: 12px 16px 0; padding: 8px 12px; border-radius: 12px; font-size: 12px; background: var(--p-surface); color: var(--p-muted); }
`;
