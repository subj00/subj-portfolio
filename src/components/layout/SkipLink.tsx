"use client";

import type { MouseEvent } from "react";

/**
 * First focusable element: jumps keyboard users past the header to the page's
 * <main>. With cacheComponents, previously visited pages stay in the DOM
 * (hidden), so several elements can share id="main"; a plain hash jump would
 * target whichever comes first. With JavaScript we focus the visible one; without
 * it, the #main link still works.
 */
export function SkipLink({ label }: { label: string }) {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = [...document.querySelectorAll<HTMLElement>("main")].find(
      (element) => element.getClientRects().length > 0,
    );
    if (!main) return;
    event.preventDefault();
    main.focus();
  };

  return (
    <a
      href="#main"
      onClick={skip}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[Canvas] focus:px-3 focus:py-2 focus:text-[CanvasText]"
    >
      {label}
    </a>
  );
}
