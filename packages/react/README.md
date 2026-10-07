# parley-react

React bindings for the Parley website assistant.

```bash
npm install parley-react
```

```tsx
import { ParleyChat, useParley } from "parley-react";

// Chat bubble on every page — render once, e.g. in your root layout:
<ParleyChat botKey="pk_…" apiUrl="https://api.example.com" />

// Or an embedded chat inside a page:
<ParleyChat botKey="pk_…" apiUrl="https://api.example.com" mode="inline" style={{ height: 640 }} />

// Open it from your own UI:
function HelpButton() {
  const parley = useParley();
  return <button onClick={() => parley.ask("What are your opening hours?")}>Ask us</button>;
}
```

The component loads `widget.js` from your Parley API once and mounts it in a shadow DOM, so it
works with any styling setup (Tailwind, CSS modules, styled-components) and with Next.js
(it's a client component). The domain you use it on must be in the bot's allowed domains.

Requires React 18+. Ships ESM with TypeScript types. MIT licensed.
