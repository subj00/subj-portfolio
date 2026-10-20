import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/**
 * Shared UI and navigation state. Ownership rules:
 *  - Route, project slug, query and hash belong to the URL. Never mirror them here.
 *  - Active section belongs to motion-store (scroll-derived).
 *  - Hover, press and drag state stay local to the component that owns them.
 *  - Pointer coordinates never enter a store; they live in refs/mutable objects.
 */
export interface UiState {
  menuOpen: boolean;
  /** A client navigation started by TransitionLink has not committed yet. */
  navigating: boolean;
  /** Globally relevant selection (e.g. a focused 3D object), by id. */
  selection: string | null;
  /** Outstanding interaction locks (transitions in progress). */
  locks: number;
}

export const uiStore = createStore<UiState>()(() => ({
  menuOpen: false,
  navigating: false,
  selection: null,
  locks: 0,
}));

export function useUi<T>(selector: (state: UiState) => T): T {
  return useStore(uiStore, selector);
}

export const selectInteractionsLocked = (s: UiState) => s.navigating || s.locks > 0;

/** For event handlers and frame loops: no subscription, no rerender. */
export function interactionsLocked() {
  return selectInteractionsLocked(uiStore.getState());
}

/**
 * Disables interactive 3D/DOM objects until the returned function is called.
 * Locks are counted, so overlapping transitions cannot unlock each other early.
 */
export function lockInteractions(): () => void {
  uiStore.setState((s) => ({ locks: s.locks + 1 }));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    uiStore.setState((s) => ({ locks: Math.max(0, s.locks - 1) }));
  };
}

export function setMenuOpen(menuOpen: boolean) {
  uiStore.setState({ menuOpen });
}

export function select(id: string | null) {
  uiStore.setState({ selection: id });
}

export function toggleSelection(id: string) {
  uiStore.setState((s) => ({ selection: s.selection === id ? null : id }));
}

/** A navigation that never commits (cancelled, failed) must not lock the UI forever. */
const NAVIGATION_FAILSAFE_MS = 8000;
let failsafe: ReturnType<typeof setTimeout> | undefined;

export function beginNavigation() {
  clearTimeout(failsafe);
  uiStore.setState({ navigating: true, menuOpen: false });
  failsafe = setTimeout(endNavigation, NAVIGATION_FAILSAFE_MS);
}

/** Called when the route commits (including back/forward, which never began). */
export function endNavigation() {
  clearTimeout(failsafe);
  uiStore.setState({ navigating: false, menuOpen: false, selection: null });
}
