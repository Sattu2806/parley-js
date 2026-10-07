"use client";

import { useEffect, useRef } from "react";

type Instance = { update(overrides: Record<string, unknown>): void; destroy(): void };
type ParleyGlobal = {
  version?: string;
  mount?: (options: Record<string, unknown>) => Promise<Instance>;
  open?: () => void;
  close?: () => void;
  toggle?: () => void;
  ask?: (question: string) => void;
  q?: unknown[][];
};

declare global {
  interface Window {
    Parley?: ParleyGlobal;
  }
}

const loaders = new Map<string, Promise<ParleyGlobal>>();

/** Load widget.js from your Parley API once per page. */
function loadWidget(apiUrl: string): Promise<ParleyGlobal> {
  const src = `${apiUrl.replace(/\/+$/, "")}/widget.js`;
  let loader = loaders.get(src);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      if (window.Parley?.mount) return resolve(window.Parley);
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => (window.Parley?.mount ? resolve(window.Parley) : reject(new Error("Parley widget failed to start")));
      script.onerror = () => {
        loaders.delete(src);
        reject(new Error(`Couldn't load ${src}`));
      };
      document.head.appendChild(script);
    });
    loaders.set(src, loader);
  }
  return loader;
}

export type ParleyChatProps = {
  /** Your bot's public key (pk_…), from Install in the Parley dashboard. */
  botKey: string;
  /** Your Parley API URL, e.g. https://api.example.com */
  apiUrl: string;
  /** "bubble" (default) shows the launcher; "inline" renders the chat inside this component. */
  mode?: "bubble" | "inline";
  /** Open the chat panel on load (bubble mode). */
  defaultOpen?: boolean;
  /** Size of the inline chat container. */
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Adds the Parley assistant to a React app. Render it once (e.g. in your root layout) for the
 * chat bubble, or with mode="inline" where you want an embedded chat.
 */
export function ParleyChat({ botKey, apiUrl, mode = "bubble", defaultOpen, className, style }: ParleyChatProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: Instance | null = null;
    let cancelled = false;
    loadWidget(apiUrl)
      .then((parley) =>
        parley.mount!({ botKey, apiUrl, mode, open: defaultOpen, container: mode === "inline" ? container.current : undefined }),
      )
      .then((mounted) => {
        if (cancelled) mounted.destroy();
        else instance = mounted;
      })
      .catch((err: Error) => console.warn(`[Parley] ${err.message}`));
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [botKey, apiUrl, mode, defaultOpen]);

  return mode === "inline" ? <div ref={container} className={className} style={{ height: 600, ...style }} /> : null;
}

function call(method: "open" | "close" | "toggle" | "ask", ...args: unknown[]) {
  const parley = (window.Parley ??= { q: [] });
  const fn = parley[method] as ((...a: unknown[]) => void) | undefined;
  if (fn) fn(...args);
  else (parley.q ??= []).push([method, ...args]);
}

/** Control the chat from your own buttons. Calls made before the widget loads are queued. */
export function useParley() {
  return {
    open: () => call("open"),
    close: () => call("close"),
    toggle: () => call("toggle"),
    ask: (question: string) => call("ask", question),
  };
}
