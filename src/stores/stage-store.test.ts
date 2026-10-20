import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestScene, stageStore } from "./stage-store";

describe("requestScene", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stageStore.setState({ sceneRefs: {} });
  });
  afterEach(() => vi.useRealTimers());

  it("activates immediately and deactivates after the release delay", () => {
    const release = requestScene("lab");
    expect(stageStore.getState().sceneRefs.lab).toBe(1);

    release();
    expect(stageStore.getState().sceneRefs.lab).toBe(1);
    vi.runAllTimers();
    expect(stageStore.getState().sceneRefs.lab).toBeUndefined();
  });

  it("never drops to zero when a new request arrives before the old one is released", () => {
    const seen: (number | undefined)[] = [];
    const unsubscribe = stageStore.subscribe((s) => seen.push(s.sceneRefs.lab));

    const releaseOld = requestScene("lab");
    releaseOld(); // outgoing route hidden
    const releaseNew = requestScene("lab"); // incoming route mounts later
    vi.runAllTimers();

    expect(seen).not.toContain(undefined);
    expect(stageStore.getState().sceneRefs.lab).toBe(1);
    releaseNew();
    unsubscribe();
  });

  it("ignores repeated release calls", () => {
    const release = requestScene("lab");
    release();
    release();
    vi.runAllTimers();
    expect(stageStore.getState().sceneRefs.lab).toBeUndefined();
  });
});
