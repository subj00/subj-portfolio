import { MOTION_QUERIES } from "./gsap";
import { getSmoothScroll } from "./smooth-scroll";

/**
 * Scrolls the page so `target` starts at the top of the viewport, through
 * whichever scroller is in charge: Lenis (smoothed, keeps ScrollTrigger and the
 * WebGL stage in sync) or native smooth scrolling. Reduced motion jumps.
 */
export function scrollToElement(target: HTMLElement) {
  const immediate = window.matchMedia(MOTION_QUERIES.reduced).matches;
  const lenis = getSmoothScroll();
  if (lenis) {
    lenis.scrollTo(target, { immediate, force: true });
    return;
  }
  target.scrollIntoView({ behavior: immediate ? "instant" : "smooth", block: "start" });
}

/**
 * The visible element with this id. Previously visited pages stay in the DOM
 * (hidden) under cacheComponents, so ids are not unique document-wide.
 */
export function visibleElementById(id: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)) {
    if (element.getClientRects().length > 0) return element;
  }
  return null;
}
