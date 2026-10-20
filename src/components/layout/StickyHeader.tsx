"use client";

import { type ReactNode, useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/animation/gsap";

/** Scroll distance (px) after which the header gains its backdrop. */
const SCROLLED_AFTER = 24;

/**
 * The fixed site header shell. Fixed (not sticky): it sits over the hero and
 * every section, needs no scroll container, and no ancestor has a transform,
 * filter or overflow that would affect it. Keep it that way: no
 * backdrop-filter/transform here either, since they would also become the
 * containing block of the mobile menu's fixed overlay inside it.
 *
 * `data-scrolled` (set once past SCROLLED_AFTER, through ScrollTrigger so it
 * follows Lenis) gives the header a translucent dark backdrop and makes it
 * slightly more compact. Set before paint on mount, so a language switch (a
 * new app shell) shows the right state immediately.
 */
export function StickyHeader({ className, children }: { className: string; children: ReactNode }) {
  const header = useRef<HTMLElement>(null);

  useGSAP(() => {
    const element = header.current;
    if (!element) return;
    const sync = (scroll: number) =>
      element.toggleAttribute("data-scrolled", scroll > SCROLLED_AFTER);
    // Initial state without transitions (data-settling), so a shell shown
    // mid-page doesn't animate from the unscrolled look.
    element.setAttribute("data-settling", "");
    sync(window.scrollY);
    // Reading computed styles commits the state before transitions come back.
    void getComputedStyle(element).height;
    void getComputedStyle(element, "::before").opacity;
    const settle = requestAnimationFrame(() => element.removeAttribute("data-settling"));
    ScrollTrigger.create({ onUpdate: (self) => sync(self.scroll()) });
    return () => cancelAnimationFrame(settle);
  });

  return (
    <header ref={header} className={className}>
      {children}
    </header>
  );
}
