import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { exceedsSlop, TAP_SLOP_PX } from "@/interaction/gesture";
import { interactionsLocked, selectInteractionsLocked, uiStore } from "@/stores/ui-store";

/**
 * Interaction for one R3F object, built on R3F's own raycasting and events
 * (no second raycaster). Spread `handlers` onto a mesh or group.
 *
 * - Hover is mouse/pen only: touch never "hovers".
 * - Activation = click/tap that did not move more than the tap slop (R3F's
 *   `delta`), so finishing a drag never activates.
 * - The nearest object wins: handled events stop propagation.
 * - Everything is ignored while interactions are locked (navigation,
 *   transitions); a lock arriving mid-drag cancels the drag.
 * - State lives in a ref; read it in useFrame. No React state, no rerenders.
 *
 * Touch dragging needs a touch-action on the DOM element over the object
 * (its SceneAnchor), e.g. `touch-pan-y` for horizontal drags. Without it the
 * browser scrolls and the drag is cancelled, which is the safe default.
 */

export interface ObjectInteractionState {
  hovered: boolean;
  pressed: boolean;
  dragging: boolean;
}

export interface DragCallbacks {
  onStart?: () => void;
  /** Movement since press, CSS px. */
  onMove?: (dx: number, dy: number) => void;
  onEnd?: (cancelled: boolean) => void;
}

export interface ObjectInteractionOptions {
  /** Extra gate on top of the global interaction lock. */
  enabled?: () => boolean;
  onActivate?: () => void;
  onHoverChange?: (hovered: boolean) => void;
  /** Enables pointer-captured dragging on this object. */
  drag?: DragCallbacks;
}

interface CaptureTarget {
  setPointerCapture(id: number): void;
  releasePointerCapture(id: number): void;
  hasPointerCapture(id: number): boolean;
}

type PointerHandler = (event: ThreeEvent<PointerEvent>) => void;

export interface ObjectInteractionHandlers {
  onPointerOver: PointerHandler;
  onPointerOut: PointerHandler;
  onPointerDown: PointerHandler;
  onPointerMove: PointerHandler;
  onPointerUp: PointerHandler;
  onPointerCancel: PointerHandler;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

export function useObjectInteraction(options: ObjectInteractionOptions) {
  const state = useRef<ObjectInteractionState>({ hovered: false, pressed: false, dragging: false });
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const press = useRef({ pointerId: -1, x: 0, y: 0, target: null as CaptureTarget | null });
  const ownsCursor = useRef(false);

  // Created once; handlers read the latest options through refs at event time.
  const [api] = useState(() => {
    const allowed = () => !interactionsLocked() && (latest.current.enabled?.() ?? true);

    const setHovered = (hovered: boolean) => {
      if (state.current.hovered === hovered) return;
      state.current.hovered = hovered;
      if (hovered !== ownsCursor.current) {
        document.body.style.cursor = hovered ? "pointer" : "";
        ownsCursor.current = hovered;
      }
      latest.current.onHoverChange?.(hovered);
    };

    const endPress = (cancelled: boolean) => {
      const s = state.current;
      const p = press.current;
      if (p.target?.hasPointerCapture(p.pointerId)) p.target.releasePointerCapture(p.pointerId);
      if (s.dragging) latest.current.drag?.onEnd?.(cancelled);
      s.pressed = s.dragging = false;
      p.pointerId = -1;
      p.target = null;
    };

    /** Drops hover and cancels any press/drag (lock started, unmount). */
    const reset = () => {
      setHovered(false);
      endPress(true);
    };

    const handlers: ObjectInteractionHandlers = {
      onPointerOver(event) {
        event.stopPropagation();
        if (event.pointerType === "touch" || !allowed()) return;
        setHovered(true);
      },
      onPointerOut() {
        setHovered(false);
      },
      onPointerDown(event) {
        if (!allowed() || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.stopPropagation();
        const p = press.current;
        p.pointerId = event.pointerId;
        p.x = event.clientX;
        p.y = event.clientY;
        state.current.pressed = true;
      },
      onPointerMove(event) {
        const s = state.current;
        const p = press.current;
        if (!s.pressed || event.pointerId !== p.pointerId || !latest.current.drag) return;
        // Released outside the object before a drag began: we never saw pointerup.
        if (event.buttons === 0 || !allowed()) return endPress(true);
        const dx = event.clientX - p.x;
        const dy = event.clientY - p.y;
        if (!s.dragging && exceedsSlop(dx, dy)) {
          s.dragging = true;
          // Capture only once it is a drag, so a plain tap keeps its normal click
          // target (links/buttons inside the anchor element keep working).
          p.target = event.target as unknown as CaptureTarget;
          p.target.setPointerCapture(event.pointerId);
          latest.current.drag.onStart?.();
        }
        if (s.dragging) latest.current.drag.onMove?.(dx, dy);
      },
      onPointerUp(event) {
        if (event.pointerId === press.current.pointerId) endPress(false);
      },
      onPointerCancel(event) {
        if (event.pointerId === press.current.pointerId) endPress(true);
      },
      onClick(event) {
        if (event.delta > TAP_SLOP_PX || !allowed()) return;
        event.stopPropagation();
        latest.current.onActivate?.();
      },
    };

    return { handlers, reset };
  });

  // A lock (navigation, transition) takes effect immediately, not on the next
  // pointer event: no lingering hover/cursor, no drag continuing underneath.
  useEffect(
    () =>
      uiStore.subscribe((s, prev) => {
        if (selectInteractionsLocked(s) && !selectInteractionsLocked(prev)) api.reset();
      }),
    [api],
  );

  // Unmount: never leave a pointer cursor or a captured pointer behind.
  useEffect(() => api.reset, [api]);

  return { state, handlers: api.handlers };
}
