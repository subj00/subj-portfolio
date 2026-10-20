"use client";

import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { exceedsSlop, isTap, smoothVelocity } from "./gesture";

/**
 * x    – horizontal drags; vertical touch swipes still scroll the page (touch-action: pan-y)
 * y    – vertical drags; horizontal swipes pan natively (touch-action: pan-x)
 * both – free drags; the element blocks touch scrolling (touch-action: none). Use sparingly.
 */
export type DragAxis = "x" | "y" | "both";

const TOUCH_ACTION: Record<DragAxis, string> = { x: "pan-y", y: "pan-x", both: "none" };

export interface DragInfo {
  /** Total movement since pointerdown, CSS px. */
  dx: number;
  dy: number;
  /** Smoothed velocity at the last move, px/s. */
  vx: number;
  vy: number;
  pointerType: string;
}

export interface DragEnd extends DragInfo {
  /** True when the browser took over (scroll, pointercancel) or capture was lost. */
  cancelled: boolean;
}

export interface DragOptions {
  axis?: DragAxis;
  disabled?: () => boolean;
  onStart?: (info: DragInfo) => void;
  onMove?: (info: DragInfo) => void;
  onEnd?: (info: DragEnd) => void;
  /** Press released without exceeding the tap slop. */
  onTap?: (info: DragInfo) => void;
}

/**
 * Pointer-Events drag for one element: pointer capture, slop before a drag
 * starts, cancellation, and suppression of the click that follows a drag.
 * touch-action is applied to this element only, never globally.
 */
export function useDrag(ref: RefObject<HTMLElement | null>, options: DragOptions) {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const axis = options.axis ?? "x";

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const previousTouchAction = element.style.touchAction;
    element.style.touchAction = TOUCH_ACTION[axis];

    let pointerId: number | null = null;
    let dragging = false;
    let suppressClick = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    const info: DragInfo = { dx: 0, dy: 0, vx: 0, vy: 0, pointerType: "mouse" };

    const finish = (cancelled: boolean) => {
      if (pointerId !== null && element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
      if (dragging) {
        suppressClick = !cancelled;
        latest.current.onEnd?.({ ...info, cancelled });
      }
      pointerId = null;
      dragging = false;
    };

    const onDown = (event: PointerEvent) => {
      if (pointerId !== null || latest.current.disabled?.()) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      startTime = lastTime = event.timeStamp;
      Object.assign(info, { dx: 0, dy: 0, vx: 0, vy: 0, pointerType: event.pointerType });
      suppressClick = false;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      info.dx = event.clientX - startX;
      info.dy = event.clientY - startY;
      const dt = event.timeStamp - lastTime;
      info.vx = smoothVelocity(info.vx, event.clientX - lastX, dt);
      info.vy = smoothVelocity(info.vy, event.clientY - lastY, dt);
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = event.timeStamp;

      if (!dragging && exceedsSlop(info.dx, info.dy)) {
        dragging = true;
        // Capture only once it is a drag: capturing on pointerdown would retarget
        // the click of a plain tap to this element, breaking buttons/links inside it.
        element.setPointerCapture(event.pointerId);
        latest.current.onStart?.(info);
      }
      if (dragging) latest.current.onMove?.(info);
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const tapped = !dragging && isTap(info.dx, info.dy, event.timeStamp - startTime);
      finish(false);
      if (tapped) latest.current.onTap?.(info);
    };

    const onCancel = (event: PointerEvent) => {
      if (event.pointerId === pointerId) finish(true);
    };

    // Capture phase: swallow the click generated at the end of a drag before
    // any handler (links, buttons) inside the element sees it.
    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove, { passive: true });
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onCancel);
    element.addEventListener("lostpointercapture", onCancel);
    element.addEventListener("click", onClickCapture, true);
    return () => {
      finish(true);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onCancel);
      element.removeEventListener("lostpointercapture", onCancel);
      element.removeEventListener("click", onClickCapture, true);
      element.style.touchAction = previousTouchAction;
    };
  }, [ref, axis]);
}
