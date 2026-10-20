import { gsap } from "gsap";

/**
 * The single animation clock. Every per-frame task runs from one gsap.ticker
 * callback, in phase order, so DOM measurement, scroll and rendering can never
 * drift apart across separate requestAnimationFrame loops.
 *
 *   layout  – read DOM geometry that changed (anchor rects)
 *   render  – advance the R3F root (useFrame subscribers, then draw)
 *
 * Phase 2 adds a "scroll" phase before "layout" for Lenis.
 */
export type TickPhase = "layout" | "render";

/** time: seconds since the ticker started. deltaMs: milliseconds since last tick. */
export type TickCallback = (time: number, deltaMs: number) => void;

const PHASES: readonly TickPhase[] = ["layout", "render"];

const callbacks: Record<TickPhase, Set<TickCallback>> = {
  layout: new Set(),
  render: new Set(),
};

let subscriberCount = 0;

function tick(time: number, deltaMs: number) {
  for (const phase of PHASES) {
    for (const callback of callbacks[phase]) callback(time, deltaMs);
  }
}

/** Runs `callback` every frame in the given phase. Returns an unsubscribe function. */
export function onTick(phase: TickPhase, callback: TickCallback): () => void {
  callbacks[phase].add(callback);
  if (subscriberCount++ === 0) gsap.ticker.add(tick);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    callbacks[phase].delete(callback);
    if (--subscriberCount === 0) gsap.ticker.remove(tick);
  };
}
