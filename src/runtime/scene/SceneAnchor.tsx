"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { requestScene } from "@/stores/stage-store";
import { type AnchorOptions, registerAnchor } from "./anchors";
import type { SceneKey } from "./scene-keys";

interface SceneAnchorProps extends AnchorOptions {
  /** Scene this anchor belongs to. The scene is mounted while any of its anchors are. */
  scene: SceneKey;
  /** Anchor name, unique within the scene. 3D objects look it up by scene + name. */
  name: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Declares, from DOM/server code, that a scene is needed here, and gives its 3D
 * objects a DOM element to follow. Renders a plain div; the content inside stays
 * server-rendered.
 *
 * Effects run on mount and also when a cached route is hidden or shown (Next.js
 * Activity), so registration is symmetric and idempotent.
 */
export function SceneAnchor({ scene, name, live, className, style, children }: SceneAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const release = requestScene(scene);
    const unregister = registerAnchor(scene, name, element, { live });
    return () => {
      unregister();
      release();
    };
  }, [scene, name, live]);

  return (
    <div ref={ref} data-scene-anchor={`${scene}/${name}`} className={className} style={style}>
      {children}
    </div>
  );
}
