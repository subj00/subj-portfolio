"use client";

import { PerformanceMonitor } from "@react-three/drei";
import {
  Canvas,
  events as createPointerEvents,
  type FilterFunction,
  useThree,
} from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NeutralToneMapping, type Object3D, PerspectiveCamera, type WebGLRenderer } from "three";
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

/** Canvases whose context we released on purpose (hidden shell): not a failure. */
const releasedCanvases = new WeakSet<HTMLCanvasElement>();

function isEffectivelyVisible(object: Object3D) {
  for (let o: Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * R3F's pointer events, minus hits on hidden objects. three.js raycasting ignores
 * `visible`, so without this an object hidden because its anchor is absent (or
 * its scene is off-screen) would still intercept and stop events meant for
 * visible objects behind it.
 */
const stageEvents = (store: Parameters<typeof createPointerEvents>[0]) => ({
  ...createPointerEvents(store),
  filter: ((hits) =>
    hits.filter((hit) => isEffectivelyVisible(hit.object))) satisfies FilterFunction,
});

/**
 * The persistent WebGL stage: one fixed, full-viewport canvas behind the DOM.
 * Mounted once by ExperienceRoot and kept across navigation. It is remounted
 * (via `key`) only to recover from a lost WebGL context, or when its app shell
 * becomes visible again after being hidden.
 *
 * Hidden shells: after a language switch Next keeps the previous locale's shell
 * mounted but hidden (cacheComponents / Activity), Stage included. Its effects
 * clean up on hide, so the WebGL context is released there (GPU memory back)
 * and a fresh canvas is created if that shell is shown again (Back).
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
  const renderer = useRef<WebGLRenderer | null>(null);
  const released = useRef(false);

  useEffect(() => {
    if (released.current) {
      released.current = false;
      remount();
    }
    return () => {
      const gl = renderer.current;
      if (!gl) return; // nothing created yet (e.g. Strict Mode's dev re-run)
      releasedCanvases.add(gl.domElement);
      gl.forceContextLoss();
      renderer.current = null;
      released.current = true;
    };
  }, [remount]);

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
          events={stageEvents}
          eventSource={document.body}
          eventPrefix="client"
          onCreated={(state) => {
            // Khronos PBR Neutral keeps saturated reds red. ACES (R3F's default)
            // pushes bright reds toward orange and white.
            state.gl.toneMapping = NeutralToneMapping;
            renderer.current = state.gl;
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
      if (releasedCanvases.has(canvas)) return; // released on purpose, not a failure
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
