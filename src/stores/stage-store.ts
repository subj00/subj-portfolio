import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createStore } from "zustand/vanilla";
import type { QualityTier } from "@/lib/device";
import type { SceneKey } from "@/runtime/scene/scene-keys";

/**
 * Low-frequency Stage state only: values that change on navigation, device
 * events or failures. Never per-frame values; those live in mutable objects
 * read inside the render loop.
 */
export type StageStatus =
  | "idle" // not needed yet, or capability check pending
  | "loading" // WebGL chunk requested
  | "ready" // renderer created
  | "lost" // context lost, waiting for restore
  | "unsupported" // no hardware WebGL2, or repeated context loss
  | "error"; // renderer or scene crashed

export interface StageState {
  status: StageStatus;
  /** Current quality tier; can only step down from `maxTier`. */
  tier: QualityTier;
  /** Starting tier from device heuristics: the ceiling for runtime upgrades. */
  maxTier: QualityTier;
  reducedMotion: boolean;
  /** Reference counts of mounted SceneAnchors per scene. */
  sceneRefs: Partial<Record<SceneKey, number>>;
  /**
   * Scenes that have rendered at least one frame (set once per mount, cleared on
   * unmount): their setup and first shader compilation are done, so animating
   * them no longer risks a main-thread stall. The hero intro waits for this.
   */
  presented: Partial<Record<SceneKey, boolean>>;
}

export const stageStore = createStore<StageState>()(() => ({
  status: "idle",
  tier: "medium",
  maxTier: "medium",
  reducedMotion: false,
  sceneRefs: {},
  presented: {},
}));

export function setScenePresented(key: SceneKey, presented: boolean) {
  stageStore.setState((s) => ({ presented: { ...s.presented, [key]: presented } }));
}

export function setStageStatus(status: StageStatus) {
  stageStore.setState({ status });
}

/**
 * Releases are deferred so a scene used by both the outgoing and incoming route
 * stays mounted while the new route loads (the old route is hidden first).
 * A released scene has no anchors, so it is not drawn while it lingers.
 */
const SCENE_RELEASE_DELAY_MS = 1000;

/**
 * Marks a scene as needed while the caller is mounted. Returns the release
 * function; the scene unmounts once no request has been held for
 * SCENE_RELEASE_DELAY_MS.
 */
export function requestScene(key: SceneKey): () => void {
  updateSceneRef(key, 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    setTimeout(() => updateSceneRef(key, -1), SCENE_RELEASE_DELAY_MS);
  };
}

function updateSceneRef(key: SceneKey, delta: 1 | -1) {
  stageStore.setState((state) => {
    const count = (state.sceneRefs[key] ?? 0) + delta;
    const sceneRefs = { ...state.sceneRefs };
    if (count > 0) sceneRefs[key] = count;
    else delete sceneRefs[key];
    return { sceneRefs };
  });
}

export const selectActiveScenes = (state: StageState) => Object.keys(state.sceneRefs) as SceneKey[];

/** React binding. Selectors returning new arrays/objects are compared shallowly. */
export function useStage<T>(selector: (state: StageState) => T): T {
  return useStore(stageStore, useShallow(selector));
}
