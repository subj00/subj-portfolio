import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  createCoreGeometry,
  createShellGeometry,
  createSparkGeometry,
  createTrailGeometry,
  RIBBONS,
  SCULPTURE_DETAIL,
  seededRandom,
  TRAILS,
} from "./sculpture-geometry";

function maxRadius(positions: ArrayLike<number>) {
  let max = 0;
  const p = new Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    max = Math.max(max, p.set(positions[i]!, positions[i + 1]!, positions[i + 2]!).length());
  }
  return max;
}

describe("hero sculpture geometry", () => {
  it("builds an indexed, egg-shaped core of about unit radius", () => {
    const core = createCoreGeometry(SCULPTURE_DETAIL.low.coreDetail);
    expect(core.index).not.toBeNull();
    core.computeBoundingBox();
    const size = core.boundingBox!.getSize(new Vector3());
    expect(size.y).toBeGreaterThan(size.x); // taller than wide
    expect(maxRadius(core.getAttribute("position").array)).toBeLessThan(1.3);
    core.dispose();
  });

  it("merges every shell into one geometry hugging the core", () => {
    const detail = SCULPTURE_DETAIL.low;
    const shells = createShellGeometry(detail);
    const perRibbon = (detail.ribbonSegments + 1) * (detail.ribbonRows + 1);
    expect(shells.getAttribute("position").count).toBe(perRibbon * RIBBONS.length);
    const outermost = Math.max(...RIBBONS.map((r) => r.radius * (1 + r.wobble)));
    expect(maxRadius(shells.getAttribute("position").array)).toBeLessThanOrEqual(outermost + 1e-6);
    shells.dispose();
  });

  it("builds closed trails that reach beyond the core", () => {
    for (const spec of TRAILS) {
      const trail = createTrailGeometry(spec, 64);
      expect(maxRadius(trail.getAttribute("position").array)).toBeGreaterThan(1.1);
      trail.dispose();
    }
  });

  it("places sparks deterministically", () => {
    const a = createSparkGeometry(8).getAttribute("position").array;
    const b = createSparkGeometry(8).getAttribute("position").array;
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(seededRandom(1)()).toBe(seededRandom(1)());
  });

  it("scales detail down with the quality tier", () => {
    expect(SCULPTURE_DETAIL.low.coreDetail).toBeLessThan(SCULPTURE_DETAIL.high.coreDetail);
    expect(SCULPTURE_DETAIL.low.sparks).toBe(0);
  });
});
