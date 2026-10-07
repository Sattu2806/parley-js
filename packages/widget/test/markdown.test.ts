import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, stripCitations } from "../src/markdown";

describe("parseInline", () => {
  it("handles bold, italics, code and citations", () => {
    expect(parseInline("A **check-up** is *only* `$129` [2][3, 4].")).toEqual([
      { type: "text", text: "A " },
      { type: "strong", children: [{ type: "text", text: "check-up" }] },
      { type: "text", text: " is " },
      { type: "em", children: [{ type: "text", text: "only" }] },
      { type: "text", text: " " },
      { type: "code", text: "$129" },
      { type: "text", text: " " },
      { type: "cite", n: 2 },
      { type: "cite", n: 3 },
      { type: "cite", n: 4 },
      { type: "text", text: "." },
    ]);
  });

  it("only links safe URLs", () => {
    expect(parseInline("[Pricing](/pricing)")).toEqual([{ type: "link", href: "/pricing", children: [{ type: "text", text: "Pricing" }] }]);
    expect(parseInline("[x](javascript:alert)")).toEqual([{ type: "text", text: "x" }]);
    expect(parseInline("[x](//evil.test)")).toEqual([{ type: "text", text: "x" }]);
  });

  it("leaves lone asterisks and maths alone", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ type: "text", text: "2 * 3 = 6" }]);
  });
});

describe("parseMarkdown", () => {
  it("builds paragraphs with line breaks and lists", () => {
    const blocks = parseMarkdown("Here are options:\nRead below.\n\n- Pay per visit\n* Care Plan\n1. First\n2) Second\n\n### Note\nDone");
    expect(blocks.map((b) => b.type)).toEqual(["p", "ul", "ol", "p"]);
    expect(blocks[0]).toEqual({
      type: "p",
      children: [{ type: "text", text: "Here are options:" }, { type: "br" }, { type: "text", text: "Read below." }],
    });
    expect(blocks[1]).toMatchObject({ type: "ul", items: [[{ text: "Pay per visit" }], [{ text: "Care Plan" }]] });
    expect(blocks[3]).toMatchObject({ type: "p", children: [{ type: "strong" }, { type: "br" }, { type: "text", text: "Done" }] });
  });
});

describe("stripCitations", () => {
  it("removes citation markers before replies are sent back as history", () => {
    expect(stripCitations("It is $129 [1]. Hours vary [2, 3].")).toBe("It is $129. Hours vary.");
  });
});
