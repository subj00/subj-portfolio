"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { gsap, MOTION_QUERIES, readMotionConditions, useGSAP } from "@/animation/gsap";
import { lockScroll } from "@/animation/scroll-lock";
import { watchMedia } from "@/lib/device";
import { lockInteractions, setMenuOpen, uiStore, useUi } from "@/stores/ui-store";

/**
 * Mobile menu: a real <button> (disclosure pattern: aria-expanded,
 * aria-controls) that opens a full-screen navigation overlay. The caller
 * provides the panel content (navigation links, footer); this component owns
 * behavior and the reveal.
 *
 * Open state lives in ui-store. While open: background scrolling is locked,
 * everything outside the menu is inert (Tab and screen readers stay in the
 * menu, which acts as a modal), 3D interactions behind it are locked, and focus
 * moves into the panel. Closes on Escape (focus returns to the toggle), a press
 * outside, navigation (links, Back/Forward), unmount, and when the viewport
 * reaches `closeWhen` (the layout that no longer shows this menu).
 *
 * Reveal: one GSAP timeline, played forward to open and reversed (faster) to
 * close, so a tap mid-animation simply changes direction. Panel content opts in
 * with data attributes:
 *   data-menu-reveal    – masked line that rises into place (staggered)
 *   data-menu-meta      – small details that fade in with their line
 *   data-menu-rule      – hairlines that draw from the left
 *   data-menu-secondary – secondary content, revealed last
 */

const CLOSE_SPEED = 1.6;

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
  const panel = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  /** Opened with Enter/Space (click detail 0) rather than a pointer. */
  const openedWithKeyboard = useRef(false);

  // Built once per motion preference; rebuilt (keeping the open state) if it changes.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES, (context) => {
        const element = panel.current;
        const icon = toggle.current;
        if (!element || !icon) return;
        const tl = buildMenuTimeline(element, icon, readMotionConditions(context).reduced);
        tl.eventCallback("onReverseComplete", () => {
          if (!uiStore.getState().menuOpen) element.hidden = true;
        });
        if (uiStore.getState().menuOpen) tl.progress(1);
        timeline.current = tl;
        return () => {
          timeline.current = null;
        };
      });
    },
    { scope: root },
  );

  // Drive the reveal from the store.
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const tl = timeline.current;
    if (open) {
      element.hidden = false;
      element.inert = false;
      tl?.timeScale(1).play();
    } else {
      // Closed with focus inside (Back, outside press, …): return it to the toggle
      // rather than losing it to <body>. Section links move it on afterwards.
      if (element.contains(document.activeElement)) toggle.current?.focus({ preventScroll: true });
      element.inert = true; // no focus or clicks while it closes
      if (tl && tl.progress() > 0) tl.timeScale(CLOSE_SPEED).reverse();
      else element.hidden = true;
    }
  }, [open]);

  // Listeners exist only while the menu is open.
  useEffect(() => {
    if (!open) return;
    const close = () => setMenuOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      toggle.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    // Back/Forward while open: let the navigation happen, without the menu.
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("popstate", close);
    };
  }, [open]);

  useEffect(
    () => (open && lockBackgroundScroll ? lockScroll() : undefined),
    [open, lockBackgroundScroll],
  );

  // Modal while open: nothing outside the menu is reachable and the 3D scene
  // behind ignores pointers. Focus moves into the menu: onto the current (or
  // first) link when opened from the keyboard, otherwise onto the panel itself.
  // Script focus after a tap can match :focus-visible in some browsers (Safari,
  // Firefox), which would paint a focus indicator nobody asked for.
  useEffect(() => {
    if (!open || !root.current) return;
    const restoreInert = inertOutside(root.current);
    const unlock = lockInteractions();
    const target = openedWithKeyboard.current
      ? (panel.current?.querySelector<HTMLElement>("a[aria-current='true']") ??
        panel.current?.querySelector<HTMLElement>("a, button"))
      : panel.current;
    target?.focus({ preventScroll: true });
    return () => {
      unlock();
      restoreInert();
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
        onClick={(event) => {
          openedWithKeyboard.current = event.detail === 0;
          setMenuOpen(!open);
        }}
        className="relative z-10 -mr-2.5 grid size-11 place-items-center rounded-full focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
      >
        {/* Three hairlines 6px apart; the timeline folds them into an ×. */}
        <span aria-hidden className="relative block h-3 w-[1.875rem]">
          <span data-menu-line="top" className="absolute top-0 left-0 h-px w-full bg-paper" />
          <span data-menu-line="mid" className="absolute top-1.5 right-0 h-px w-2/3 bg-paper" />
          <span data-menu-line="bottom" className="absolute top-3 left-0 h-px w-full bg-paper" />
        </span>
      </button>

      <div
        ref={panel}
        id={panelId}
        hidden
        tabIndex={-1}
        data-lenis-prevent
        className="fixed inset-0 overflow-y-auto overscroll-contain [clip-path:inset(0_0_100%_0)]"
      >
        {/* Deep black: the sculpture (upper half) glows faintly through, the hero text
            below is fully covered. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(110%_60%_at_100%_0%,rgb(150_0_14/0.26),transparent_62%),radial-gradient(90%_55%_at_0%_100%,rgb(110_0_10/0.16),transparent_68%),linear-gradient(rgb(5_5_5/0.95),rgb(5_5_5/0.97)_38%,rgb(5_5_5)_58%)]"
        />
        {/* Red light riding the reveal edge. */}
        <div data-menu-sweep aria-hidden className="pointer-events-none fixed inset-0 opacity-0">
          <span className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-accent-bright)_18%,var(--color-accent-bright)_82%,transparent)] shadow-[0_0_1.25rem_0.2rem_rgb(255_42_51/0.5)]" />
        </div>

        <div className="relative flex min-h-full flex-col justify-between gap-[clamp(1.5rem,5svh,3rem)] pt-[calc(var(--header-h)+env(safe-area-inset-top)+clamp(0.5rem,3svh,2rem))] pr-[var(--gutter-r)] pb-[calc(clamp(1rem,4svh,2rem)+env(safe-area-inset-bottom))] pl-[var(--gutter-l)]">
          {children}
          {footer ? (
            <div data-menu-secondary className="relative pt-[clamp(1rem,3svh,1.5rem)]">
              <span
                data-menu-rule
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left bg-line"
              />
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Open ≈ 0.65s: icon folds into an × while the overlay is revealed top-down
 * with a red light on its edge; lines rise in sequence, then details and the
 * secondary content. Close is the same timeline reversed at CLOSE_SPEED.
 * Reduced motion: a short cross-fade, no movement.
 */
function buildMenuTimeline(panel: HTMLElement, icon: HTMLElement, reduced: boolean) {
  const q = gsap.utils.selector(panel);
  const line = (name: string) => icon.querySelector(`[data-menu-line='${name}']`);
  const tl = gsap.timeline({ paused: true });

  if (reduced) {
    tl.fromTo(panel, { clipPath: "inset(0 0 0% 0)", opacity: 0 }, { opacity: 1, duration: 0.18 })
      .set(line("top"), { y: 6, rotate: 45 }, 0)
      .set(line("mid"), { opacity: 0 }, 0)
      .set(line("bottom"), { y: -6, rotate: -45 }, 0);
    return tl;
  }

  const ease = "power3.inOut";
  tl.to(line("top"), { y: 6, rotate: 45, duration: 0.42, ease }, 0)
    .to(line("mid"), { scaleX: 0, opacity: 0, transformOrigin: "right", duration: 0.24 }, 0)
    .to(line("bottom"), { y: -6, rotate: -45, duration: 0.42, ease }, 0)
    .fromTo(
      panel,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 0.5, ease },
      0,
    )
    // The sweep layer's bottom edge tracks the clip edge (same duration and ease).
    .fromTo(q("[data-menu-sweep]"), { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease }, 0)
    .fromTo(q("[data-menu-sweep]"), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0)
    .to(q("[data-menu-sweep]"), { opacity: 0, duration: 0.18 }, 0.4)
    .fromTo(
      q("[data-menu-reveal]"),
      { yPercent: 110 },
      { yPercent: 0, duration: 0.38, ease: "power3.out", stagger: 0.045 },
      0.15,
    )
    .fromTo(
      q("[data-menu-rule]"),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.4, ease: "power2.out", stagger: 0.04 },
      0.2,
    )
    .fromTo(
      q("[data-menu-meta]"),
      { opacity: 0 },
      { opacity: 1, duration: 0.25, stagger: 0.045 },
      0.3,
    )
    .fromTo(
      q("[data-menu-secondary]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.26, ease: "power2.out" },
      0.38,
    );
  return tl;
}

/**
 * Makes everything outside `element` inert (siblings of it and of each
 * ancestor up to <body>). Returns a restore function that only clears what it
 * set, so elements inert for other reasons stay inert.
 */
function inertOutside(element: HTMLElement): () => void {
  const changed: HTMLElement[] = [];
  for (let node: HTMLElement | null = element; node && node !== document.body;) {
    const parent: HTMLElement | null = node.parentElement;
    for (const sibling of parent?.children ?? []) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      sibling.inert = true;
      changed.push(sibling);
    }
    node = parent;
  }
  return () => {
    for (const sibling of changed) sibling.inert = false;
  };
}
