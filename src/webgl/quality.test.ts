import { describe, expect, it } from "vitest";
import { stepTier } from "./quality";

describe("stepTier", () => {
  it("steps down and stops at low", () => {
    expect(stepTier("high", "high", -1)).toBe("medium");
    expect(stepTier("low", "high", -1)).toBe("low");
  });

  it("steps up but never above the device ceiling", () => {
    expect(stepTier("low", "high", 1)).toBe("medium");
    expect(stepTier("medium", "medium", 1)).toBe("medium");
  });
});
