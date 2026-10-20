"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { lockScroll } from "@/animation/scroll-lock";
import { watchMedia } from "@/lib/device";
import { setMenuOpen, useUi } from "@/stores/ui-store";

/**
 * Mobile menu: a real <button> (disclosure pattern: aria-expanded,
 * aria-controls) that opens a full-screen panel. The caller provides the panel
 * content (navigation links, language switcher); this component owns behavior.
 *
 * Open state lives in ui-store so other parts (scene dimming, transitions) can
 * react to it. While open: background scrolling is locked, and the page behind
 * the panel is inert so Tab stays in the menu. Closes on Escape (focus returns
 * to the toggle), a press outside, navigation, unmount, and when the viewport
 * reaches `closeWhen` (the layout that no longer shows this menu).
 */
export function NavMenu({
  children,
  openLabel = "Open menu",
  closeLabel = "Close menu",
  closeWhen,
  footer,
  lockBackgroundScroll = true,
  className,
}: {
  /** Panel content, e.g. a <nav> of links. */
  children: ReactNode;
  openLabel?: string;
  closeLabel?: string;
  /** Media query at which the menu is not used (e.g. the wide layout). */
  closeWhen?: string;
  /** Panel content pinned to the bottom (e.g. the language switcher). */
  footer?: ReactNode;
  lockBackgroundScroll?: boolean;
  className?: string;
}) {
  const open = useUi((s) => s.menuOpen);
  const panelId = useId();
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

  // Content behind the full-screen panel is unreachable while it is open.
  useEffect(() => {
    if (!open) return;
    const mains = [...document.querySelectorAll("main")];
    for (const main of mains) main.inert = true;
    return () => {
      for (const main of mains) main.inert = false;
    };
  }, [open]);

  useEffect(() => {
    if (!closeWhen) return;
    return watchMedia(closeWhen, (matches) => {
      if (matches) setMenuOpen(false);
    });
  }, [closeWhen]);

  // The menu never survives the component (e.g. a cached route being hidden).
  useEffect(() => () => setMenuOpen(false), []);

  return (
    <div ref={root} data-nav-menu className={className}>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setMenuOpen(!open)}
        className="group relative z-10 -mr-2.5 grid size-11 place-items-center"
      >
        {/* Three hairlines; the outer two cross into an × when open. */}
        <span aria-hidden className="relative block h-3 w-[1.875rem]">
          {[
            "top-0 group-aria-expanded:top-1.5 group-aria-expanded:rotate-45",
            "top-1.5 group-aria-expanded:opacity-0",
            "top-3 group-aria-expanded:top-1.5 group-aria-expanded:-rotate-45",
          ].map((position) => (
            <span
              key={position}
              className={`absolute left-0 h-px w-full bg-paper transition-[top,transform,opacity] duration-300 motion-reduce:transition-none ${position}`}
            />
          ))}
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-0 flex flex-col justify-between overflow-y-auto bg-ink pt-[calc(var(--header-h)+env(safe-area-inset-top)+2rem)] pr-[var(--gutter-r)] pb-[calc(2rem+env(safe-area-inset-bottom))] pl-[var(--gutter-l)]"
      >
        {children}
        {footer}
      </div>
    </div>
  );
}
