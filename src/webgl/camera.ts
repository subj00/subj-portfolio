import { MathUtils, type PerspectiveCamera } from "three";

/**
 * The Stage owns a single perspective camera. Responsibilities are split:
 * - projection (fov, near, far) is responsive and recomputed on resize here;
 * - position/orientation belong to whoever animates the camera (Phase 2 camera rig).
 *   Resizing never moves the camera.
 */

export const CAMERA_START_POSITION = [0, 0, 10] as const;

const BASE_FOV = 35;
/** Narrow (portrait) viewports widen the vertical fov so the horizontal fov never drops below this. */
const MIN_HORIZONTAL_FOV = 28;
const MAX_FOV = 60;

export interface CameraProjection {
  fov: number;
  near: number;
  far: number;
}

export function getCameraProjection(aspect: number): CameraProjection {
  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const halfMinHorizontal = MathUtils.degToRad(MIN_HORIZONTAL_FOV) / 2;
  const verticalForMinHorizontal = MathUtils.radToDeg(
    2 * Math.atan(Math.tan(halfMinHorizontal) / safeAspect),
  );
  return {
    fov: MathUtils.clamp(verticalForMinHorizontal, BASE_FOV, MAX_FOV),
    near: 0.1,
    far: 100,
  };
}

export function applyCameraProjection(camera: PerspectiveCamera, projection: CameraProjection) {
  camera.fov = projection.fov;
  camera.near = projection.near;
  camera.far = projection.far;
  camera.updateProjectionMatrix();
}
