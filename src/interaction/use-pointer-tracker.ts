"use client";

import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { normalizeInBox, smoothVelocity } from "./gesture";

export interface PointerSample {
  inside: boolean;
  pressed: boolean;
  pointerType: string;
  /** Element-local position in CSS px. */
  x: number;
  y: number;
  /** -1…1 within the element, y up. */
  nx: number;
  ny: number;
  /** Smoothed velocity, px/s. Decays only through new events; read it alongside timeStamp. */
  vx: number;
  vy: number;
  timeStamp: number;
}

export interface PointerCallbacks {
  onEnter?: (sample: PointerSample, event: PointerEvent) => void;
  onLeave?: (sample: PointerSample, event: PointerEvent) => void;
  onDown?: (sample: PointerSample, event: PointerEvent) => void;
  onUp?: (sample: PointerSample, event: PointerEvent) => void;
}

/**
 * Tracks the pointer over one element. Listeners live on that element only,
 * values are written into the returned ref (never React state), and reading
 * them is free: use them in a ticker/useFrame callback or an event handler.
 *
 * Enter/leave fire for touch as well (on contact/lift), so components must not
 * treat `inside` as hover. Check `pointerType` or `(hover: hover)` for that.
 */
export function usePointerTracker(
  ref: RefObject<HTMLElement | null>,
  callbacks: PointerCallbacks = {},
): RefObject<PointerSample> {
  const sample = useRef<PointerSample>({
    inside: false,
    pressed: false,
    pointerType: "mouse",
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    vx: 0,
    vy: 0,
    timeStamp: 0,
  });

  // Latest callbacks without re-subscribing listeners on every render.
  const latest = useRef(callbacks);
  useLayoutEffect(() => {
    latest.current = callbacks;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const s = sample.current;
    let rect = element.getBoundingClientRect();
    let measuredScroll = window.scrollY;
    const normalized = { x: 0, y: 0 };

    const update = (event: PointerEvent) => {
      // Re-measure only when the page scrolled since the last measure (no per-move layout reads).
      if (window.scrollY !== measuredScroll) {
        rect = element.getBoundingClientRect();
        measuredScroll = window.scrollY;
      }
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dt = event.timeStamp - s.timeStamp;
      s.vx = smoothVelocity(s.vx, x - s.x, dt);
      s.vy = smoothVelocity(s.vy, y - s.y, dt);
      s.x = x;
      s.y = y;
      normalizeInBox(event.clientX, event.clientY, rect, normalized);
      s.nx = normalized.x;
      s.ny = normalized.y;
      s.pointerType = event.pointerType;
      s.timeStamp = event.timeStamp;
    };

    const onEnter = (event: PointerEvent) => {
      rect = element.getBoundingClientRect();
      measuredScroll = window.scrollY;
      s.inside = true;
      s.vx = s.vy = 0;
      s.timeStamp = event.timeStamp;
      update(event);
      latest.current.onEnter?.(s, event);
    };
    const onLeave = (event: PointerEvent) => {
      update(event);
      s.inside = false;
      s.pressed = false;
      latest.current.onLeave?.(s, event);
    };
    const onDown = (event: PointerEvent) => {
      update(event);
      s.pressed = true;
      latest.current.onDown?.(s, event);
    };
    const onUp = (event: PointerEvent) => {
      update(event);
      s.pressed = false;
      latest.current.onUp?.(s, event);
    };

    const passive = { passive: true } as const;
    element.addEventListener("pointerenter", onEnter, passive);
    element.addEventListener("pointerleave", onLeave, passive);
    element.addEventListener("pointermove", update, passive);
    element.addEventListener("pointerdown", onDown, passive);
    element.addEventListener("pointerup", onUp, passive);
    element.addEventListener("pointercancel", onUp, passive);
    return () => {
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointermove", update);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      s.inside = s.pressed = false;
    };
  }, [ref]);

  return sample;
}
