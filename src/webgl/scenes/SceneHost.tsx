import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { Group } from "three";
import { isSceneInView } from "@/runtime/scene/anchors";
import type { SceneKey } from "@/runtime/scene/scene-keys";
import { selectActiveScenes, useStage } from "@/stores/stage-store";
import { StageErrorBoundary } from "../StageErrorBoundary";
import { sceneRegistry } from "./registry";

/** Extra margin (fraction of viewport height) so objects larger than their anchor don't pop. */
const VIEW_MARGIN = 0.25;

export function isSceneVisible(key: SceneKey, size: { width: number; height: number }) {
  return isSceneInView(key, size.width, size.height, size.height * VIEW_MARGIN);
}

/**
 * Mounts every scene that currently has at least one SceneAnchor. Re-renders
 * only when that set changes (navigation), never per frame.
 */
export function SceneHost() {
  const activeScenes = useStage(selectActiveScenes);
  return (
    <>
      {activeScenes.map((key) => (
        <SceneSlot key={key} sceneKey={key} />
      ))}
    </>
  );
}

function SceneSlot({ sceneKey }: { sceneKey: SceneKey }) {
  const group = useRef<Group>(null);
  const { Component } = sceneRegistry[sceneKey];

  // Off-screen scenes stay mounted but are not drawn.
  useFrame(({ size }) => {
    if (group.current) group.current.visible = isSceneVisible(sceneKey, size);
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[stage] scene "${sceneKey}" mounted`);
    return () => console.info(`[stage] scene "${sceneKey}" unmounted`);
  }, [sceneKey]);

  return (
    <group ref={group} name={`scene:${sceneKey}`}>
      <StageErrorBoundary onError={(error) => console.error(`[stage] scene "${sceneKey}"`, error)}>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </StageErrorBoundary>
    </group>
  );
}
