import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  beginNavigation,
  endNavigation,
  interactionsLocked,
  lockInteractions,
  setMenuOpen,
  toggleSelection,
  uiStore,
} from "./ui-store";

beforeEach(() => {
  vi.useFakeTimers();
  uiStore.setState({ menuOpen: false, navigating: false, selection: null, locks: 0 });
});
afterEach(() => vi.useRealTimers());

describe("interaction locks", () => {
  it("stays locked until every overlapping lock is released", () => {
    const a = lockInteractions();
    const b = lockInteractions();
    a();
    a(); // double release is ignored
    expect(interactionsLocked()).toBe(true);
    b();
    expect(interactionsLocked()).toBe(false);
  });
});

describe("navigation state", () => {
  it("locks interactions and closes the menu while navigating", () => {
    setMenuOpen(true);
    beginNavigation();
    expect(uiStore.getState()).toMatchObject({ navigating: true, menuOpen: false });
    expect(interactionsLocked()).toBe(true);
    endNavigation();
    expect(interactionsLocked()).toBe(false);
  });

  it("recovers by itself if a navigation never commits", () => {
    beginNavigation();
    vi.advanceTimersByTime(10_000);
    expect(uiStore.getState().navigating).toBe(false);
  });

  it("clears page-level selection on route change", () => {
    toggleSelection("lab:interact");
    expect(uiStore.getState().selection).toBe("lab:interact");
    endNavigation();
    expect(uiStore.getState().selection).toBeNull();
  });
});
