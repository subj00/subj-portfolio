"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect } from "react";
import { detectWebGL2, initialQualityTier, readDeviceProfile, watchMedia } from "@/lib/device";
import { type StageStatus, setStageStatus, stageStore, useStage } from "@/stores/stage-store";

// The only route into the WebGL chunk (three, R3F, drei, scenes).
const Stage = dynamic(() => import("@/webgl/Stage"), { ssr: false });

const STAGE_MOUNTED: ReadonlySet<StageStatus> = new Set(["loading", "ready", "lost"]);

/**
 * App-wide client runtime, mounted once in the root layout so it survives
 * navigation. Server-rendered `children` pass through untouched.
 *
 * Stage lifecycle:
 *   idle -> (WebGL2 supported, a scene is requested, browser idle) -> loading
 *   loading -> ready (renderer created) <-> lost (context loss, remount on restore)
 *   any -> unsupported | error  (Stage unmounts; DOM content is the fallback)
 *
 * The Stage is never unmounted once loaded, so the GL context, compiled shaders
 * and uploaded assets persist across routes.
 */
export function ExperienceRoot({ children }: { children: ReactNode }) {
  const status = useStage((s) => s.status);
  const wantsStage = useStage((s) => Object.keys(s.sceneRefs).length > 0);

  // Device profile and motion preference.
  useEffect(() => {
    const tier = initialQualityTier(readDeviceProfile());
    stageStore.setState({ tier, maxTier: tier });
    if (!detectWebGL2()) setStageStatus("unsupported");
    return watchMedia("(prefers-reduced-motion: reduce)", (reducedMotion) =>
      stageStore.setState({ reducedMotion }),
    );
  }, []);

  // Load the WebGL chunk the first time a page asks for a scene, once the main
  // thread is idle, so it never competes with hydration or LCP.
  useEffect(() => {
    if (!wantsStage || status !== "idle") return;
    const start = () => {
      if (stageStore.getState().status === "idle") setStageStatus("loading");
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 200);
    return () => clearTimeout(id);
  }, [wantsStage, status]);

  // Exposed for CSS: `html[data-webgl="unsupported"]` can reveal static fallbacks.
  useEffect(() => {
    document.documentElement.dataset.webgl = status;
  }, [status]);

  return (
    <>
      {/* Content stacks above the fixed canvas. */}
      <div className="relative z-[1]">{children}</div>
      {STAGE_MOUNTED.has(status) && <Stage />}
    </>
  );
}
