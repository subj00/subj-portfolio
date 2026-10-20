import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { createAnchorFrame, depthToOrigin, projectRect } from "./anchor-projection";

const viewport = { width: 1200, height: 800 };

function makeCamera(position: [number, number, number], fov = 35) {
  const camera = new PerspectiveCamera(fov, viewport.width / viewport.height, 0.1, 100);
  camera.position.set(...position);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

describe("projectRect", () => {
  it("maps the viewport center to the point the camera looks at", () => {
    const camera = makeCamera([0, 0, 10]);
    const frame = projectRect(
      { left: 500, top: 300, width: 200, height: 200 },
      viewport,
      camera,
      depthToOrigin(camera),
      createAnchorFrame(),
    );
    expect(frame.position.x).toBeCloseTo(0, 6);
    expect(frame.position.y).toBeCloseTo(0, 6);
    expect(frame.position.z).toBeCloseTo(0, 6);
  });

  it("maps a full-viewport rect to the visible frustum size at that depth", () => {
    const camera = makeCamera([0, 0, 10]);
    const frame = projectRect(
      { left: 0, top: 0, ...viewport },
      viewport,
      camera,
      10,
      createAnchorFrame(),
    );
    const visibleHeight = 2 * 10 * Math.tan(MathUtils.degToRad(35) / 2);
    expect(frame.height).toBeCloseTo(visibleHeight, 6);
    expect(frame.width).toBeCloseTo(visibleHeight * (viewport.width / viewport.height), 6);
  });

  it("puts top-left DOM corners at negative x, positive y", () => {
    const camera = makeCamera([0, 0, 10]);
    const frame = projectRect(
      { left: 0, top: 0, width: 10, height: 10 },
      viewport,
      camera,
      10,
      createAnchorFrame(),
    );
    expect(frame.position.x).toBeLessThan(0);
    expect(frame.position.y).toBeGreaterThan(0);
  });

  it("round-trips through camera projection for a rotated camera", () => {
    const camera = makeCamera([4, 3, 8], 50);
    const rect = { left: 900, top: 150, width: 120, height: 80 };
    const frame = projectRect(rect, viewport, camera, depthToOrigin(camera), createAnchorFrame());

    const ndc = new Vector3().copy(frame.position).project(camera);
    expect((ndc.x + 1) * 0.5 * viewport.width).toBeCloseTo(rect.left + rect.width / 2, 3);
    expect((1 - ndc.y) * 0.5 * viewport.height).toBeCloseTo(rect.top + rect.height / 2, 3);
  });
});
