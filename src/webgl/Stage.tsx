"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { PerspectiveCamera } from "three";
import type { SceneKey } from "@/runtime/scene/scene-keys";
import { onTick } from "@/runtime/ticker";
import { setStageStatus, stageStore, useStage } from "@/stores/stage-store";
import { CAMERA_START_POSITION, applyCameraProjection, getCameraProjection } from "./camera";
import { QUALITY, stepTier } from "./quality";
import { SceneHost, isSceneVisible } from "./scenes/SceneHost";
import { StageErrorBoundary } from "./StageErrorBoundary";

/** After this many context losses in one session, stay on the DOM fallback. */
const MAX_CONTEXT_LOSSES = 2;
let contextLosses = 0;

/**
 * The persistent WebGL stage: one fixed, full-viewport canvas behind the DOM.
 * Mounted once by ExperienceRoot and kept across navigation. It is remounted
 * (via `key`) only to recover from a lost WebGL context.
 */
export default function Stage() {
  const tier = useStage((s) => s.tier);
  // Context-creation settings are fixed for the canvas lifetime.
  const [creation] = useState(() => ({
    antialias: QUALITY[stageStore.getState().tier].antialias,
    fov: getCameraProjection(window.innerWidth / window.innerHeight).fov,
  }));
  const [generation, setGeneration] = useState(0);
  const remount = useCallback(() => setGeneration((g) => g + 1), []);

  return (
    // lvh: sized to the largest mobile viewport so toolbar show/hide doesn't resize the canvas.
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
      <StageErrorBoundary
        onError={(error) => {
          console.error("[stage] renderer failed", error);
          setStageStatus("error");
        }}
      >
        <Canvas
          key={generation}
          frameloop="never"
          dpr={[1, QUALITY[tier].maxDpr]}
          gl={{
            antialias: creation.antialias,
            alpha: true,
            stencil: false,
            powerPreference: "high-performance",
          }}
          camera={{ fov: creation.fov, near: 0.1, far: 100, position: [...CAMERA_START_POSITION] }}
          eventSource={document.body}
          eventPrefix="client"
          onCreated={(state) => {
            if (process.env.NODE_ENV !== "production") {
              console.info(`[stage] canvas created (generation ${generation})`);
              // Dev-only handle for inspecting the scene from devtools.
              (window as Window & { __stage?: unknown }).__stage = state.get;
            }
            setStageStatus("ready");
          }}
        >
          <ContextLossGuard onRestored={remount} />
          <CameraProjectionSync />
          <QualityMonitor />
          <RenderLoop />
          <SceneHost />
        </Canvas>
      </StageErrorBoundary>
    </div>
  );
}

/**
 * Drives R3F from the shared ticker (frameloop="never"). Frames are skipped when
 * no active scene is in view; one extra frame is drawn after the last scene
 * leaves so the canvas is cleared rather than frozen.
 */
function RenderLoop() {
  const get = useThree((s) => s.get);

  useEffect(() => {
    let drewLastTick = false;
    return onTick("render", (time) => {
      const { status, sceneRefs } = stageStore.getState();
      if (status !== "ready") return;

      const state = get();
      let visible = false;
      for (const key in sceneRefs) {
        if (isSceneVisible(key as SceneKey, state.size)) {
          visible = true;
          break;
        }
      }
      // frameloop="never": advance() takes seconds, matching gsap.ticker's time.
      if (visible || drewLastTick) state.advance(time);
      drewLastTick = visible;
    });
  }, [get]);

  return null;
}

/** Recomputes the responsive projection on resize. Never moves the camera. */
function CameraProjectionSync() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      applyCameraProjection(camera, getCameraProjection(width / height));
    }
  }, [camera, width, height]);

  return null;
}

/**
 * Steps the quality tier on sustained frame-rate changes. Tier changes adjust
 * the DPR bound on the next render; they do not recreate the context.
 */
function QualityMonitor() {
  const step = (direction: -1 | 1) => {
    const { tier, maxTier } = stageStore.getState();
    const next = stepTier(tier, maxTier, direction);
    if (next !== tier) stageStore.setState({ tier: next });
  };

  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => step(-1)}
      onIncline={() => step(1)}
      onFallback={() => stageStore.setState({ tier: "low" })}
    />
  );
}

function ContextLossGuard({ onRestored }: { onRestored: () => void }) {
  const canvas = useThree((s) => s.gl.domElement);

  useEffect(() => {
    const handleLost = (event: Event) => {
      event.preventDefault(); // allows the browser to fire "webglcontextrestored"
      contextLosses += 1;
      console.warn(`[stage] WebGL context lost (${contextLosses})`);
      setStageStatus(contextLosses > MAX_CONTEXT_LOSSES ? "unsupported" : "lost");
    };
    // Remounting with a fresh canvas is more reliable than restoring resources in place.
    const handleRestored = () => onRestored();

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [canvas, onRestored]);

  return null;
}
