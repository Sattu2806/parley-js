export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "cite"; n: number }
  | { type: "br" };

export type Block = { type: "p"; children: Inline[] } | { type: "ul" | "ol"; items: Inline[][] };

const INLINE =
  /\*\*([^*]+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\[(\d+(?:\s*,\s*\d+)*)\]|(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])/g;

function safeHref(href: string) {
  return /^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i.test(href) ? href : null;
}

/** Inline markdown subset: **bold**, *italic*, `code`, [links](url) and [n] citations. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pushText = (t: string) => {
    if (!t) return;
    const last = out[out.length - 1];
    if (last?.type === "text") last.text += t;
    else out.push({ type: "text", text: t });
  };
  let cursor = 0;
  for (const m of text.matchAll(INLINE)) {
    pushText(text.slice(cursor, m.index));
    cursor = m.index + m[0].length;
    if (m[1] !== undefined) out.push({ type: "strong", children: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ type: "code", text: m[2] });
    else if (m[3] !== undefined) {
      const href = safeHref(m[4]!);
      if (href) out.push({ type: "link", href, children: parseInline(m[3]) });
      else pushText(m[3]);
    } else if (m[5] !== undefined) {
      for (const n of m[5].split(",")) out.push({ type: "cite", n: Number(n.trim()) });
    } else if (m[6] !== undefined) out.push({ type: "em", children: parseInline(m[6]) });
  }
  pushText(text.slice(cursor));
  return out;
}

/** Block-level subset: paragraphs (single newlines become line breaks) and bulleted/numbered lists. */
export function parseMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const children: Inline[] = [];
    paragraph.forEach((line, i) => {
      if (i) children.push({ type: "br" });
      children.push(...parseInline(line));
    });
    blocks.push({ type: "p", children });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items.map(parseInline) });
    list = null;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((bullet ?? numbered)![1]!);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.replace(/^#{1,6}\s+(.*)$/, "**$1**"));
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Remove [n] markers, e.g. before sending old replies back as history (their numbers are stale). */
export function stripCitations(text: string) {
  return text.replace(/\s?\[\d+(?:\s*,\s*\d+)*\]/g, "");
}
