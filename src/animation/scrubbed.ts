import type { ScrollTrigger } from "./gsap";

/**
 * onRefresh handler for scrubbed timelines that use `invalidateOnRefresh`.
 *
 * Invalidation re-records every tween, and tweens the playhead has not reached
 * yet (notably later items of a stagger) are left at their natural, final-
 * looking values instead of their `from` state, so content that should still
 * be hidden shows until the playhead passes it. Rendering to the end and back
 * to the current progress, without callbacks, re-applies every tween's start
 * values in place, in the same tick (nothing is painted in between).
 */
export function resettleOnRefresh(self: ScrollTrigger) {
  const animation = self.animation;
  if (!animation) return;
  const progress = animation.progress();
  animation.progress(1, true).progress(progress, true);
}
