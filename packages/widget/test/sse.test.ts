import { describe, expect, it } from "vitest";
import { createSseParser, type SseMessage } from "../src/sse";

describe("createSseParser", () => {
  it("emits complete events, buffering partial ones across chunks", () => {
    const seen: SseMessage[] = [];
    const feed = createSseParser((m) => seen.push(m));
    feed('event: delta\ndata: {"text":"Hel');
    expect(seen).toEqual([]);
    feed('lo"}\n\n: keep-alive\n\nevent: done\r\ndata: {}\r\n\r\n');
    expect(seen).toEqual([
      { event: "delta", data: '{"text":"Hello"}' },
      { event: "done", data: "{}" },
    ]);
  });

  it("joins multi-line data and defaults the event name", () => {
    const seen: SseMessage[] = [];
    createSseParser((m) => seen.push(m))("data: line one\ndata: line two\n\n");
    expect(seen).toEqual([{ event: "message", data: "line one\nline two" }]);
  });
});
