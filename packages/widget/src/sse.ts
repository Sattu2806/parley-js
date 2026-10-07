export type SseMessage = { event: string; data: string };

/**
 * Incremental parser for a text/event-stream body. Feed it decoded chunks in order; it
 * calls `onMessage` for every complete event and keeps partial events buffered.
 */
export function createSseParser(onMessage: (message: SseMessage) => void) {
  let buffer = "";
  return (chunk: string) => {
    buffer = (buffer + chunk).replace(/\r\n?/g, "\n");
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of raw.split("\n")) {
        if (!line || line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const field = colon === -1 ? line : line.slice(0, colon);
        let value = colon === -1 ? "" : line.slice(colon + 1);
        if (value.startsWith(" ")) value = value.slice(1);
        if (field === "event") event = value;
        else if (field === "data") data.push(value);
      }
      if (data.length) onMessage({ event, data: data.join("\n") });
    }
  };
}
