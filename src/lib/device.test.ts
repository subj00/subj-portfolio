import { describe, expect, it } from "vitest";
import { type DeviceProfile, initialQualityTier } from "./device";

const desktop: DeviceProfile = { coarsePointer: false, cores: 8, memoryGb: 8, saveData: false };

describe("initialQualityTier", () => {
  it("rates a capable desktop as high", () => {
    expect(initialQualityTier(desktop)).toBe("high");
  });

  it("rates mid-range desktops as medium", () => {
    expect(initialQualityTier({ ...desktop, cores: 4 })).toBe("medium");
  });

  it("caps touch devices at medium regardless of reported cores", () => {
    expect(initialQualityTier({ ...desktop, coarsePointer: true, cores: 12 })).toBe("medium");
    expect(
      initialQualityTier({ ...desktop, coarsePointer: true, cores: 4, memoryGb: undefined }),
    ).toBe("medium");
  });

  it("drops to low for data saver or low memory", () => {
    expect(initialQualityTier({ ...desktop, saveData: true })).toBe("low");
    expect(initialQualityTier({ ...desktop, coarsePointer: true, memoryGb: 2 })).toBe("low");
    expect(initialQualityTier({ ...desktop, cores: 2 })).toBe("low");
  });
});
