import {
  BufferGeometry,
  CatmullRomCurve3,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { QualityTier } from "@/lib/device";

/**
 * Procedural geometry for the hero sculpture. Pure functions (no React, no
 * renderer) so they are unit-testable and rebuilt only on mount.
 *
 * Units: the core has radius ≈ 1; the scene scales the whole sculpture to its
 * SceneAnchor box, so these numbers are proportions, not pixels.
 */

export interface SculptureDetail {
  /** Icosphere subdivision of the core. */
  coreDetail: number;
  /** Segments along each ribbon and rows across it. */
  ribbonSegments: number;
  ribbonRows: number;
  /** Tube segments along each energy trail. */
  trailSegments: number;
  /** Floating sparks (0 = none). */
  sparks: number;
}

export const SCULPTURE_DETAIL: Record<QualityTier, SculptureDetail> = {
  high: { coreDetail: 28, ribbonSegments: 220, ribbonRows: 10, trailSegments: 360, sparks: 56 },
  medium: { coreDetail: 20, ribbonSegments: 160, ribbonRows: 8, trailSegments: 260, sparks: 36 },
  low: { coreDetail: 12, ribbonSegments: 110, ribbonRows: 6, trailSegments: 180, sparks: 0 },
};

/**
 * Smooth organic scalar field: a few incommensurate, rotated sine waves. Cheap,
 * deterministic and seamless on a sphere (no texture or noise library needed).
 */
export function organicField(x: number, y: number, z: number): number {
  return (
    Math.sin(1.7 * x + 0.9 * y + 2.3) * Math.cos(1.3 * z - 0.6 * x) * 0.5 +
    Math.sin(2.9 * y - 1.1 * z + 0.4) * 0.3 +
    Math.sin(4.3 * z + 2.2 * x - 1.7 * y + 1.1) * 0.2
  );
}

/** Egg-shaped core with soft, rocky undulation (normals stay smooth). */
export function createCoreGeometry(detail: number): BufferGeometry {
  const base = new IcosahedronGeometry(1, detail);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const geometry = mergeVertices(base);
  base.dispose();

  const position = geometry.getAttribute("position");
  const p = new Vector3();
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i).normalize();
    const broad = organicField(p.x * 1.4, p.y * 1.4, p.z * 1.4);
    const fine = organicField(p.x * 4.2 + 3.1, p.y * 4.2 - 1.7, p.z * 4.2 + 0.6);
    const grain = organicField(p.x * 9.7 - 2.3, p.y * 9.7 + 0.8, p.z * 9.7 + 5.1);
    const radius = 1 + broad * 0.07 + fine * 0.035 + grain * 0.012;
    position.setXYZ(i, p.x * radius * 0.94, p.y * radius * 1.12, p.z * radius * 0.96);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export interface RibbonSpec {
  /** Radius of the shell the ribbon wraps (core ≈ 1). */
  radius: number;
  /** Orientation of the ribbon's sweep plane, radians. */
  tilt: [number, number, number];
  /** Start angle and sweep length of the arc, radians. */
  start: number;
  sweep: number;
  /** Half-width at the widest point, in shell units. */
  width: number;
  /** Out-of-plane undulation (makes the path organic rather than a circle). */
  lift: number;
  /** Radial breathing along the path. */
  wobble: number;
  phase: number;
}

/**
 * The shells: wide, tapered bands that wrap around the core. Each band is swept
 * along an undulating path and then PROJECTED ONTO A SPHERE of its radius, so it
 * curves like a fragment of a shell (convex across its width), not a flat strip.
 * Different radii keep the layers apart and leave openings onto the core.
 */
export const RIBBONS: readonly RibbonSpec[] = [
  // Two broad shells over the upper-left/front: the dominant red mass in the reference.
  {
    radius: 1.04,
    tilt: [0.5, 0.3, -0.75],
    start: 1.1,
    sweep: 3.1,
    width: 0.5,
    lift: 0.16,
    wobble: 0.02,
    phase: 0.3,
  },
  {
    radius: 1.09,
    tilt: [0.05, -0.35, -1.0],
    start: 1.5,
    sweep: 2.6,
    width: 0.36,
    lift: 0.2,
    wobble: 0.025,
    phase: 1.7,
  },
  // Narrower bands crossing the front, leaving openings onto the dark core.
  {
    radius: 1.13,
    tilt: [1.15, -0.2, 0.55],
    start: 2.2,
    sweep: 2.3,
    width: 0.16,
    lift: 0.14,
    wobble: 0.03,
    phase: 2.9,
  },
  {
    radius: 1.17,
    tilt: [-0.55, 0.95, -0.45],
    start: 0.9,
    sweep: 1.9,
    width: 0.09,
    lift: 0.24,
    wobble: 0.03,
    phase: 4.2,
  },
  // A thin outer blade sweeping past the silhouette.
  {
    radius: 1.24,
    tilt: [0.75, 0.5, -0.3],
    start: 1.4,
    sweep: 2.3,
    width: 0.045,
    lift: 0.28,
    wobble: 0.04,
    phase: 0.9,
  },
];

export function createRibbonGeometry(spec: RibbonSpec, segments: number, rows: number) {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const center = (theta: number, out: Vector3) => {
    const r = spec.radius * (1 + spec.wobble * Math.sin(3 * theta + spec.phase));
    out.set(Math.cos(theta), Math.sin(theta), spec.lift * Math.sin(2 * theta + spec.phase));
    return out.normalize().multiplyScalar(r);
  };

  const c = new Vector3();
  const ahead = new Vector3();
  const behind = new Vector3();
  const tangent = new Vector3();
  const across = new Vector3();
  const p = new Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = spec.start + spec.sweep * t;
    center(theta, c);
    tangent.subVectors(center(theta + 1e-3, ahead), center(theta - 1e-3, behind)).normalize();
    across.copy(tangent).cross(p.copy(c).normalize()).normalize();
    // Tapered ends: the shell grows out of nothing and thins away again.
    const halfWidth = spec.width * Math.pow(Math.sin(Math.PI * t), 0.65);
    const radius = c.length();

    for (let j = 0; j <= rows; j++) {
      const v = (j / rows) * 2 - 1;
      p.copy(c)
        .addScaledVector(across, v * halfWidth)
        .setLength(radius);
      vertices.push(p.x, p.y, p.z);
      uvs.push(t, j / rows);
    }
  }

  const stride = rows + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(...spec.tilt)));
  geometry.computeVertexNormals();
  return geometry;
}

/** All shells merged into one geometry: a single draw call. */
export function createShellGeometry(detail: SculptureDetail): BufferGeometry {
  const parts = RIBBONS.map((spec) =>
    createRibbonGeometry(spec, detail.ribbonSegments, detail.ribbonRows),
  );
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!merged) throw new Error("hero: could not merge shell geometry");
  return merged;
}

export interface TrailSpec {
  /** Semi-axes of the ellipse (core ≈ 1). */
  a: number;
  b: number;
  tilt: [number, number, number];
  /** Organic deviation from a perfect ellipse. */
  wobble: number;
  /** Tube radius: hairline trails read as light, not as rings. */
  thickness: number;
  /** Pulse speed (loops per second, signed) and brightness. */
  speed: number;
  intensity: number;
  phase: number;
}

/**
 * Energy trails: long, tilted, slightly irregular ellipses that pass around and
 * through the sculpture (as in the reference), not concentric planet orbits.
 */
export const TRAILS: readonly TrailSpec[] = [
  {
    a: 1.85,
    b: 0.62,
    tilt: [1.2, 0.25, -0.72],
    wobble: 0.05,
    thickness: 0.0055,
    speed: 0.045,
    intensity: 1,
    phase: 0,
  },
  {
    a: 1.6,
    b: 0.78,
    tilt: [-1.05, 0.5, 0.42],
    wobble: 0.07,
    thickness: 0.0045,
    speed: -0.035,
    intensity: 0.75,
    phase: 0.37,
  },
  {
    a: 1.22,
    b: 0.36,
    tilt: [0.4, -1.15, 1.25],
    wobble: 0.04,
    thickness: 0.0065,
    speed: 0.06,
    intensity: 0.9,
    phase: 0.71,
  },
];

export function createTrailGeometry(spec: TrailSpec, segments: number): TubeGeometry {
  const points: Vector3[] = [];
  const count = 72;
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const w = 1 + spec.wobble * Math.sin(3 * theta + spec.phase * 7);
    points.push(
      new Vector3(
        Math.cos(theta) * spec.a * w,
        Math.sin(theta) * spec.b * w,
        spec.wobble * 2 * Math.sin(2 * theta + spec.phase * 5),
      ),
    );
  }
  const curve = new CatmullRomCurve3(points, true, "centripetal");
  const geometry = new TubeGeometry(curve, segments, spec.thickness, 4, true);
  geometry.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(...spec.tilt)));
  return geometry;
}

/** Deterministic pseudo-random sequence (mulberry32), so sparks are stable across renders. */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sparse sparks in a shell around the sculpture: position + per-spark phase. */
export function createSparkGeometry(count: number): BufferGeometry {
  const random = seededRandom(7);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    p.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize();
    p.multiplyScalar(1.5 + random() * 1.8);
    positions.set([p.x * 1.3, p.y, p.z * 0.6], i * 3);
    phases[i] = random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("phase", new Float32BufferAttribute(phases, 1));
  return geometry;
}
