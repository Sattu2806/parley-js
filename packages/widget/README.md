# parley-widget

The embeddable chat widget for [Parley](https://github.com/Sattu2806/parley-js) assistants. It's one script (~15 KB gzipped) that renders in a shadow DOM, so your site's CSS can't break it.

## From a CDN

```html
<script
  src="https://cdn.jsdelivr.net/npm/parley-widget@1/dist/widget.js"
  data-bot="pk_your_bot_key"
  data-api="https://your-parley-api.example.com"
  defer
></script>
```

`data-api` is required when loading from a CDN. When the script is served by your Parley API itself (`https://your-api/widget.js`), it's optional.

## Attributes

| Attribute | Meaning |
| --- | --- |
| `data-bot` | Your bot's public key (required) |
| `data-api` | Your Parley API URL |
| `data-mode="inline"` + `data-container="#chat"` | Render the chat inside an element instead of a bubble |
| `data-open` | Open the bubble on load |

## JavaScript API

`Parley.open()`, `Parley.close()`, `Parley.toggle()`, `Parley.ask("question")`, and `Parley.mount({ botKey, apiUrl, mode, container })`. Calls made before the script loads can be queued with `window.Parley = { q: [["open"]] }`.

For React, use [`parley-react`](https://www.npmjs.com/package/parley-react).
