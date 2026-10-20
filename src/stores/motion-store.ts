import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/**
 * Low-frequency scroll/motion state for UI that reacts to it (navigation
 * highlighting, debug readouts). Scroll position and progress are NOT stored
 * here: read them from ScrollTrigger or Lenis inside callbacks.
 */
export interface MotionState {
  /** id of the section currently crossing the viewport center, if any. */
  activeSection: string | null;
  /** True while Lenis smooth scrolling is running. */
  smoothScroll: boolean;
}

export const motionStore = createStore<MotionState>()(() => ({
  activeSection: null,
  smoothScroll: false,
}));

export function useMotion<T>(selector: (state: MotionState) => T): T {
  return useStore(motionStore, selector);
}
