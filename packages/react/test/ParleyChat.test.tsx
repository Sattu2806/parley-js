// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParleyChat, useParley } from "../src/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  delete window.Parley;
  document.body.innerHTML = "";
});

describe("ParleyChat", () => {
  it("mounts the widget with its props and destroys it on unmount", async () => {
    const destroy = vi.fn();
    const mount = vi.fn(async () => ({ update: vi.fn(), destroy }));
    window.Parley = { version: "test", mount };

    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<ParleyChat botKey="pk_test" apiUrl="https://api.example.com/" mode="inline" />));

    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ botKey: "pk_test", apiUrl: "https://api.example.com/", mode: "inline" }));
    const options = (mount.mock.calls[0] as unknown[])[0] as { container: HTMLElement };
    expect(el.contains(options.container)).toBe(true);

    await act(async () => root.unmount());
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("queues commands until the widget loads, then calls it directly", () => {
    const parley = useParley();
    parley.open();
    parley.ask("Hours?");
    expect(window.Parley?.q).toEqual([["open"], ["ask", "Hours?"]]);

    const open = vi.fn();
    window.Parley = { open };
    parley.open();
    expect(open).toHaveBeenCalledOnce();
  });
});
