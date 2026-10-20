import Lenis from "lenis";
import { onTick } from "@/runtime/ticker";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Smooth scrolling (Lenis) as a single module-level instance.
 *
 * - Driven by the shared ticker's "scroll" phase: no RAF loop of its own.
 * - Every Lenis scroll event updates ScrollTrigger in the same frame.
 * - Native scrolling stays in charge of touch input (syncTouch off), keyboard,
 *   find-in-page and hash links (anchors off); Lenis only smooths wheel input.
 *
 * Whether it runs at all is decided by AnimationRuntime from device
 * capabilities and the reduced-motion preference.
 */

let lenis: Lenis | null = null;
let teardown: (() => void) | null = null;

export function startSmoothScroll() {
  if (lenis) return; // one instance, ever
  const instance = new Lenis({ autoRaf: false, anchors: false, syncTouch: false });
  const offScroll = instance.on("scroll", ScrollTrigger.update);
  const offTick = onTick("scroll", (time) => instance.raf(time * 1000));
  // Lenis owns frame pacing; GSAP's lag smoothing would desync scrubbed timelines.
  gsap.ticker.lagSmoothing(0);

  lenis = instance;
  teardown = () => {
    offScroll();
    offTick();
    instance.destroy(); // removes its listeners and html classes: native scrolling resumes
    gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
  };
}

export function stopSmoothScroll() {
  teardown?.();
  teardown = null;
  lenis = null;
}

export function isSmoothScrollActive() {
  return lenis !== null;
}

/**
 * Re-syncs Lenis after the page was scrolled or resized from outside
 * (route change, scroll restoration), cancelling any in-flight smooth scroll.
 */
export function syncSmoothScroll() {
  if (!lenis) return;
  lenis.resize();
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
}
