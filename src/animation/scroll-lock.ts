import { pauseSmoothScroll, resumeSmoothScroll } from "./smooth-scroll";

/**
 * Background scroll lock for overlays (menu, dialogs). Counted, so nested
 * overlays release correctly.
 *
 * - `overflow: hidden` on <html> stops page scrolling but keeps the scroll
 *   position, so nothing has to be restored and ScrollTrigger/anchors stay valid.
 * - The scrollbar gutter stays reserved (when there is a classic scrollbar), so
 *   content does not shift and the fixed WebGL canvas is not resized.
 * - Lenis is paused so wheel input is not smoothed toward a target it cannot reach.
 *
 * Scrollable areas inside the overlay keep working (mark them `data-lenis-prevent`
 * when Lenis is active).
 */

let locks = 0;
let saved: { overflow: string; scrollbarGutter: string } | null = null;

export function lockScroll(): () => void {
  if (locks++ === 0) {
    const html = document.documentElement;
    const hasScrollbar = window.innerWidth - html.clientWidth > 0;
    saved = { overflow: html.style.overflow, scrollbarGutter: html.style.scrollbarGutter };
    if (hasScrollbar) html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    html.dataset.scrollLocked = "";
    pauseSmoothScroll();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks > 0) return;
    const html = document.documentElement;
    html.style.overflow = saved?.overflow ?? "";
    html.style.scrollbarGutter = saved?.scrollbarGutter ?? "";
    delete html.dataset.scrollLocked;
    saved = null;
    resumeSmoothScroll();
  };
}

export function isScrollLocked() {
  return locks > 0;
}
