"use client";

import { lazy, Suspense } from "react";
import { createRoot, type Root } from "react-dom/client";
import { type StageStatus, setStageStatus, useStage } from "@/stores/stage-store";

/**
 * The persistent WebGL stage lives in its own React root, outside the route tree.
 *
 * Why: the root layout is `app/[lang]/layout.tsx`, a dynamic segment. Next keys it
 * by the param, so /sr → /en renders a second app shell (the first is kept hidden
 * by cacheComponents). A Stage rendered inside the shell would be a second Canvas
 * (new context, environment, geometry, shaders): the sculpture vanishes until it
 * is ready. Owned here, the Canvas, its scenes and their animation state persist
 * across language switches; each shell's ExperienceRoot only holds a reference.
 *
 * Teardown is delayed: during a switch the hidden shell releases before the shown
 * shell acquires. Only when no shell has wanted the stage for a while is the root
 * unmounted (R3F then disposes scene, renderer and context, once).
 */

// The only route into the WebGL chunk (three, R3F, drei, scenes).
const Stage = lazy(() => import("@/webgl/Stage"));

const STAGE_MOUNTED: ReadonlySet<StageStatus> = new Set(["loading", "ready", "lost"]);
const TEARDOWN_DELAY_MS = 1000;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let owners = 0;
let teardownTimer: ReturnType<typeof setTimeout> | undefined;

function StageHost() {
  const status = useStage((s) => s.status);
  return STAGE_MOUNTED.has(status) ? (
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  ) : null;
}

/** Keeps the shared stage mounted until the returned release is called. */
export function acquireStage(): () => void {
  owners += 1;
  clearTimeout(teardownTimer);
  if (!root) {
    host = document.createElement("div");
    host.dataset.stageHost = "";
    document.body.append(host);
    root = createRoot(host, {
      onUncaughtError: (error) => {
        console.error("[stage] failed to load", error);
        setStageStatus("error");
      },
    });
    root.render(<StageHost />);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    owners -= 1;
    if (owners > 0) return;
    teardownTimer = setTimeout(() => {
      if (owners > 0 || !root) return;
      root.unmount();
      host?.remove();
      root = null;
      host = null;
    }, TEARDOWN_DELAY_MS);
  };
}
