import { type Camera, MathUtils, PerspectiveCamera, Vector3 } from "three";
import { normalizeInBox } from "@/interaction/gesture";
import { getAnchor, type Rect, toViewportRect } from "@/runtime/scene/anchors";
import type { SceneKey } from "@/runtime/scene/scene-keys";

/**
 * DOM → world mapping.
 *
 * A DOM rect is projected onto a plane perpendicular to the camera's view
 * direction, `depth` world units in front of the camera. On that plane, one CSS
 * pixel is exactly `visibleHeight / viewportHeight` world units, so an object
 * scaled to `frame.width × frame.height` covers the element's box on screen.
 *
 * Exact only at the chosen depth: geometry in front of the plane renders larger,
 * geometry behind it smaller (perspective). Works for any fov, aspect and camera
 * orientation, but not for orthographic cameras or camera.setViewOffset.
 */

export interface AnchorFrame {
  /** World-space center of the element, on the projection plane. */
  position: Vector3;
  /** Element size in world units at the projection depth. */
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export function createAnchorFrame(): AnchorFrame {
  return { position: new Vector3(), width: 0, height: 0 };
}

const _origin = new Vector3();
const _forward = new Vector3();
const _ray = new Vector3();
const _rect: Rect = { left: 0, top: 0, width: 0, height: 0 };

/** Writes the projection of a viewport-space rect into `out`. Allocation-free. */
export function projectRect(
  rect: Rect,
  viewport: ViewportSize,
  camera: PerspectiveCamera,
  depth: number,
  out: AnchorFrame,
): AnchorFrame {
  camera.getWorldPosition(_origin);
  camera.getWorldDirection(_forward);

  const ndcX = ((rect.left + rect.width / 2) / viewport.width) * 2 - 1;
  const ndcY = -((rect.top + rect.height / 2) / viewport.height) * 2 + 1;
  _ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(_origin).normalize();

  // Scale the ray so its component along the view direction equals `depth`.
  out.position.copy(_origin).addScaledVector(_ray, depth / _ray.dot(_forward));

  const visibleHeight = (2 * depth * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / camera.zoom;
  const unitsPerPixel = visibleHeight / viewport.height;
  out.width = rect.width * unitsPerPixel;
  out.height = rect.height * unitsPerPixel;
  return out;
}

/** Distance along the view direction from the camera to the world origin plane. */
export function depthToOrigin(camera: Camera): number {
  camera.getWorldPosition(_origin);
  camera.getWorldDirection(_forward);
  return -_origin.dot(_forward);
}

/**
 * Samples a registered anchor for this frame. Returns false when the anchor is
 * not mounted (or the camera is not perspective), leaving `out` untouched so the
 * caller can keep its last pose or fall back to a free position.
 *
 * `depth` defaults to the plane through the world origin.
 */
export function sampleAnchor(
  scene: SceneKey,
  name: string,
  camera: Camera,
  viewport: ViewportSize,
  out: AnchorFrame,
  depth?: number,
): boolean {
  const anchor = getAnchor(scene, name);
  if (!anchor || !(camera instanceof PerspectiveCamera) || viewport.height === 0) return false;
  projectRect(toViewportRect(anchor, _rect), viewport, camera, depth ?? depthToOrigin(camera), out);
  return true;
}

/**
 * R3F's normalized pointer (viewport NDC) expressed relative to an anchor's
 * box: -1…1 on both axes (y up), clamped. Returns whether the pointer is inside
 * the box, or false when the anchor is not mounted.
 */
export function pointerInAnchor(
  scene: SceneKey,
  name: string,
  pointer: { x: number; y: number },
  viewport: ViewportSize,
  out: { x: number; y: number },
): boolean {
  const anchor = getAnchor(scene, name);
  if (!anchor) return false;
  const rect = toViewportRect(anchor, _rect);
  const clientX = ((pointer.x + 1) / 2) * viewport.width;
  const clientY = ((1 - pointer.y) / 2) * viewport.height;
  normalizeInBox(clientX, clientY, rect, out);
  return (
    clientX >= rect.left &&
    clientX <= rect.left + rect.width &&
    clientY >= rect.top &&
    clientY <= rect.top + rect.height
  );
}
