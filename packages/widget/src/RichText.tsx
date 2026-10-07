import type { ComponentChildren } from "preact";
import { parseMarkdown, type Inline } from "./markdown";
import type { Source } from "./types";

/** Same-origin links navigate in place; anything else opens in a new tab. */
export function linkProps(href: string) {
  try {
    const url = new URL(href, location.href);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.origin === location.origin ? { href: url.toString() } : { href: url.toString(), target: "_blank", rel: "noopener noreferrer" };
  } catch {
    return null;
  }
}

function renderInline(nodes: Inline[], sources: Map<number, Source>): ComponentChildren[] {
  return nodes.map((node) => {
    switch (node.type) {
      case "text":
        return node.text;
      case "br":
        return <br />;
      case "strong":
        return <strong>{renderInline(node.children, sources)}</strong>;
      case "em":
        return <em>{renderInline(node.children, sources)}</em>;
      case "code":
        return <code>{node.text}</code>;
      case "link": {
        const props = linkProps(node.href);
        return props ? (
          <a class="link" {...props}>
            {renderInline(node.children, sources)}
          </a>
        ) : (
          renderInline(node.children, sources)
        );
      }
      case "cite": {
        const source = sources.get(node.n);
        if (!source) return null;
        const props = linkProps(source.url);
        return props ? (
          <a class="cite" {...props} aria-label={`Source ${node.n}: ${source.title}`}>
            {node.n}
          </a>
        ) : (
          <span class="cite" title={source.title}>
            {node.n}
          </span>
        );
      }
    }
  });
}

export function Markdown({ text, sources }: { text: string; sources: Source[] }) {
  const byNumber = new Map(sources.map((s) => [s.n, s]));
  return (
    <>
      {parseMarkdown(text).map((block) => {
        if (block.type === "p") return <p>{renderInline(block.children, byNumber)}</p>;
        const items = block.items.map((item) => <li>{renderInline(item, byNumber)}</li>);
        return block.type === "ul" ? <ul>{items}</ul> : <ol>{items}</ol>;
      })}
    </>
  );
}
