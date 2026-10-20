/**
 * Pure gesture math shared by DOM hooks and 3D interaction handlers.
 */

/** Movement (CSS px) below which a press still counts as a tap/click, not a drag. */
export const TAP_SLOP_PX = 8;
/** Presses held longer than this are not taps. */
export const TAP_MAX_MS = 500;

export function exceedsSlop(dx: number, dy: number, slop = TAP_SLOP_PX) {
  return dx * dx + dy * dy > slop * slop;
}

export function isTap(dx: number, dy: number, durationMs: number) {
  return !exceedsSlop(dx, dy) && durationMs <= TAP_MAX_MS;
}

/** Maps a position inside a box to -1…1 on both axes (y up), clamped. */
export function normalizeInBox(
  x: number,
  y: number,
  box: { left: number; top: number; width: number; height: number },
  out: { x: number; y: number },
) {
  const nx = box.width > 0 ? ((x - box.left) / box.width) * 2 - 1 : 0;
  const ny = box.height > 0 ? 1 - ((y - box.top) / box.height) * 2 : 0;
  out.x = Math.max(-1, Math.min(1, nx));
  out.y = Math.max(-1, Math.min(1, ny));
  return out;
}

/**
 * Exponentially smoothed velocity in px/s. Smoothing keeps a single jittery
 * event from spiking the value; `dtMs <= 0` (coalesced events) keeps the old value.
 */
export function smoothVelocity(previous: number, delta: number, dtMs: number, smoothing = 0.25) {
  if (dtMs <= 0) return previous;
  const instant = (delta / dtMs) * 1000;
  return previous + (instant - previous) * smoothing;
}
