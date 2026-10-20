import { MathUtils } from "three";
import { describe, expect, it } from "vitest";
import { getCameraProjection } from "./camera";

const horizontalFov = (verticalFov: number, aspect: number) =>
  MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(verticalFov) / 2) * aspect));

describe("getCameraProjection", () => {
  it("keeps the base fov on landscape viewports", () => {
    expect(getCameraProjection(16 / 9).fov).toBe(35);
  });

  it("widens the vertical fov on portrait viewports to preserve horizontal framing", () => {
    const aspect = 390 / 844;
    const { fov } = getCameraProjection(aspect);
    expect(fov).toBeGreaterThan(35);
    expect(horizontalFov(fov, aspect)).toBeCloseTo(28, 5);
  });

  it("clamps extreme aspect ratios", () => {
    expect(getCameraProjection(0.1).fov).toBe(60);
    expect(getCameraProjection(0).fov).toBe(35);
    expect(getCameraProjection(Number.NaN).fov).toBe(35);
  });
});
