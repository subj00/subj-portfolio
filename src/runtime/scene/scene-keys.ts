/**
 * Every scene the Stage can render. Adding a key here forces a matching entry in
 * the WebGL scene registry (enforced by `satisfies` there).
 *
 * This module is import-safe from server and DOM code: it carries no three.js.
 */
export const SCENE_KEYS = ["lab"] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];
