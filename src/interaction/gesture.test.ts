import { describe, expect, it } from "vitest";
import { exceedsSlop, isTap, normalizeInBox, smoothVelocity } from "./gesture";

describe("tap detection", () => {
  it("treats small, short presses as taps", () => {
    expect(isTap(3, 4, 120)).toBe(true);
  });
  it("rejects drags and long presses", () => {
    expect(isTap(9, 0, 120)).toBe(false);
    expect(isTap(0, 0, 900)).toBe(false);
    expect(exceedsSlop(6, 6)).toBe(true);
  });
});

describe("normalizeInBox", () => {
  const box = { left: 100, top: 50, width: 200, height: 100 };
  it("maps center and corners to -1…1 with y up", () => {
    expect(normalizeInBox(200, 100, box, { x: 9, y: 9 })).toEqual({ x: 0, y: 0 });
    expect(normalizeInBox(100, 50, box, { x: 9, y: 9 })).toEqual({ x: -1, y: 1 });
    expect(normalizeInBox(300, 150, box, { x: 9, y: 9 })).toEqual({ x: 1, y: -1 });
  });
  it("clamps outside positions and survives empty boxes", () => {
    expect(normalizeInBox(1000, -1000, box, { x: 0, y: 0 })).toEqual({ x: 1, y: 1 });
    expect(normalizeInBox(5, 5, { ...box, width: 0, height: 0 }, { x: 9, y: 9 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("smoothVelocity", () => {
  it("moves toward the instantaneous velocity", () => {
    const v = smoothVelocity(0, 10, 10); // 1000 px/s instant
    expect(v).toBeCloseTo(250);
  });
  it("ignores zero-duration samples", () => {
    expect(smoothVelocity(42, 10, 0)).toBe(42);
  });
});
