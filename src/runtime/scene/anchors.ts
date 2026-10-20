import { onTick } from "@/runtime/ticker";
import type { SceneKey } from "./scene-keys";

/**
 * Registry of DOM elements that 3D content can attach to.
 *
 * Rects are stored in document space and only re-measured when layout may have
 * changed (element or document resize, font load). Each frame, consumers
 * subtract the current scroll offset instead of calling getBoundingClientRect,
 * so following an anchor while scrolling costs no layout reads.
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AnchorOptions {
  /**
   * Re-measure every frame. Needed for position: fixed/sticky elements or
   * anchors moved by CSS transforms; costs one layout read per frame.
   */
  live?: boolean;
}

export interface Anchor {
  readonly scene: SceneKey;
  readonly name: string;
  readonly element: HTMLElement;
  readonly live: boolean;
  /** Document-space rect (viewport rect + scroll offset at measure time). */
  readonly rect: Rect;
}

interface MutableAnchor extends Anchor {
  rect: Rect;
}

const anchors = new Map<string, MutableAnchor>();
let dirty = true;
let resizeObserver: ResizeObserver | undefined;
let stopTicking: (() => void) | undefined;

const keyOf = (scene: SceneKey, name: string) => `${scene}/${name}`;

export function registerAnchor(
  scene: SceneKey,
  name: string,
  element: HTMLElement,
  options: AnchorOptions = {},
): () => void {
  const key = keyOf(scene, name);
  if (process.env.NODE_ENV !== "production" && anchors.has(key)) {
    console.warn(`[anchors] "${key}" registered twice; the newest element wins.`);
  }

  const anchor: MutableAnchor = {
    scene,
    name,
    element,
    live: options.live ?? false,
    rect: { left: 0, top: 0, width: 0, height: 0 },
  };
  anchors.set(key, anchor);
  measure(anchor);

  if (anchors.size === 1) start();
  resizeObserver?.observe(element);

  return () => {
    if (anchors.get(key) !== anchor) return;
    anchors.delete(key);
    resizeObserver?.unobserve(element);
    if (anchors.size === 0) stop();
  };
}

export function getAnchor(scene: SceneKey, name: string): Anchor | undefined {
  return anchors.get(keyOf(scene, name));
}

/** Forces a re-measure on the next frame (e.g. after a layout change the observers cannot see). */
export function invalidateAnchors() {
  dirty = true;
}

/** Writes the anchor's current viewport-space rect into `out`. */
export function toViewportRect(anchor: Anchor, out: Rect): Rect {
  out.left = anchor.rect.left - window.scrollX;
  out.top = anchor.rect.top - window.scrollY;
  out.width = anchor.rect.width;
  out.height = anchor.rect.height;
  return out;
}

const scratch: Rect = { left: 0, top: 0, width: 0, height: 0 };

/** True when any anchor of `scene` intersects the viewport, expanded by `margin` px. */
export function isSceneInView(
  scene: SceneKey,
  viewportWidth: number,
  viewportHeight: number,
  margin = 0,
): boolean {
  for (const anchor of anchors.values()) {
    if (anchor.scene !== scene) continue;
    const r = toViewportRect(anchor, scratch);
    if (
      r.left + r.width > -margin &&
      r.left < viewportWidth + margin &&
      r.top + r.height > -margin &&
      r.top < viewportHeight + margin
    ) {
      return true;
    }
  }
  return false;
}

function measure(anchor: MutableAnchor) {
  const r = anchor.element.getBoundingClientRect();
  anchor.rect.left = r.left + window.scrollX;
  anchor.rect.top = r.top + window.scrollY;
  anchor.rect.width = r.width;
  anchor.rect.height = r.height;
}

function measureIfNeeded() {
  for (const anchor of anchors.values()) {
    if (dirty || anchor.live) measure(anchor);
  }
  dirty = false;
}

function start() {
  dirty = true;
  // Observing the root catches layout shifts that move an anchor without resizing it
  // (content above it growing, viewport width changes).
  resizeObserver = new ResizeObserver(invalidateAnchors);
  resizeObserver.observe(document.documentElement);
  window.addEventListener("resize", invalidateAnchors);
  void document.fonts.ready.then(invalidateAnchors);
  stopTicking = onTick("layout", measureIfNeeded);
}

function stop() {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  window.removeEventListener("resize", invalidateAnchors);
  stopTicking?.();
  stopTicking = undefined;
}
