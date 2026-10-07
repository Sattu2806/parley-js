# parley-js

Client SDKs for [Parley](https://github.com/Sattu2806) website assistants — the pieces that run on your customers' websites.

| Package | npm | What it is |
| --- | --- | --- |
| [`parley-widget`](packages/widget) | [![npm](https://img.shields.io/npm/v/parley-widget)](https://www.npmjs.com/package/parley-widget) | The embeddable chat widget (`widget.js`, ~15 KB gzipped, shadow DOM) |
| [`parley-react`](packages/react) | [![npm](https://img.shields.io/npm/v/parley-react)](https://www.npmjs.com/package/parley-react) | `<ParleyChat>` and `useParley()` for React and Next.js |

## Quick start

From the CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/parley-widget@1/dist/widget.js"
        data-bot="pk_your_bot_key" data-api="https://your-parley-api.example.com" defer></script>
```

In React:

```bash
npm install parley-react
```

```tsx
import { ParleyChat } from "parley-react";

<ParleyChat botKey="pk_your_bot_key" apiUrl="https://your-parley-api.example.com" />
```

Your bot key and the exact snippet are on the **Install** tab of your Parley dashboard.

## Development

```bash
npm install
npm run typecheck && npm test && npm run build
```

## Releasing

1. Bump `version` in the package's `package.json` (and `CHANGELOG.md`).
2. Merge to `main`, then create a GitHub release.
3. The **Release** workflow publishes every package whose version isn't on npm yet, with [provenance](https://docs.npmjs.com/generating-provenance-statements), via npm trusted publishing — no tokens or 2FA codes involved.

## License

MIT
