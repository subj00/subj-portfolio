"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { lockScroll } from "@/animation/scroll-lock";
import { setMenuOpen, useUi } from "@/stores/ui-store";
import { TransitionLink } from "./TransitionLink";

export interface NavItem {
  href: Route;
  label: string;
}

/**
 * Disclosure-pattern menu: a real <button> with aria-expanded/aria-controls
 * and a list of links. Unstyled; visual design comes later.
 *
 * Open state lives in ui-store so other parts (scene dimming, transitions) can
 * react to it. While open, background scrolling is locked (released on close,
 * navigation and unmount). Closes on Escape (focus returns to the toggle), on a
 * pointer press outside, and on navigation.
 */
export function NavMenu({
  items,
  label = "Menu",
  lockBackgroundScroll = true,
}: {
  items: NavItem[];
  label?: string;
  lockBackgroundScroll?: boolean;
}) {
  const open = useUi((s) => s.menuOpen);
  const pathname = usePathname();
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Listeners exist only while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggle.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(
    () => (open && lockBackgroundScroll ? lockScroll() : undefined),
    [open, lockBackgroundScroll],
  );

  // The menu never survives the component (e.g. a cached route being hidden).
  useEffect(() => () => setMenuOpen(false), []);

  return (
    <div ref={root} data-nav-menu>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setMenuOpen(!open)}
        className="min-h-11 border px-3"
      >
        {label}
      </button>
      <ul id={listId} hidden={!open} className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <TransitionLink
              href={item.href}
              aria-current={item.href === pathname ? "page" : undefined}
              className="inline-flex min-h-11 items-center underline aria-[current=page]:font-bold"
            >
              {item.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
