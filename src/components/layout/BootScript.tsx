"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * An inline script that must run before first paint (e.g. the intro gate).
 *
 * Rendered in the server HTML (so the browser runs it while parsing, before
 * anything is painted) and kept during hydration (matching the server markup).
 * It is NOT rendered by a client-side render, such as a locale's app shell
 * created on a language switch: a script element created by React never runs,
 * and React warns about it. (The hydrated element stays in the DOM; it has
 * already run, so that is harmless.)
 *
 * (next/script `beforeInteractive` is not a substitute: in the App Router an
 * inline one is queued and only executed once Next's runtime has loaded, i.e.
 * after first paint.)
 */
export function BootScript({ code }: { code: string }) {
  const serverOrHydrating = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return serverOrHydrating ? <script dangerouslySetInnerHTML={{ __html: code }} /> : null;
}
