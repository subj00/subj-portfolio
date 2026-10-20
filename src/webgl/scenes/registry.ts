import { type ComponentType, type LazyExoticComponent, lazy } from "react";
import type { SceneKey } from "@/runtime/scene/scene-keys";

export interface SceneDefinition {
  /** Lazily loaded: each scene is its own chunk, fetched the first time it is requested. */
  Component: LazyExoticComponent<ComponentType>;
}

/**
 * SceneKey → scene module. A scene component owns everything it creates and
 * must release it on unmount; declarative R3F children are disposed
 * automatically, shared resources go through useDisposable.
 */
export const sceneRegistry = {
  hero: { Component: lazy(() => import("./hero/HeroScene")) },
  lab: { Component: lazy(() => import("./lab/LabScene")) },
} satisfies Record<SceneKey, SceneDefinition>;
