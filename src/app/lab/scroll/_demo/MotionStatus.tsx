"use client";

import { useMotion } from "@/stores/motion-store";
import { useStage } from "@/stores/stage-store";

/** TEMPORARY. Re-renders only when one of these low-frequency values changes. */
export function MotionStatus() {
  const activeSection = useMotion((s) => s.activeSection);
  const smoothScroll = useMotion((s) => s.smoothScroll);
  const reducedMotion = useStage((s) => s.reducedMotion);

  return (
    <dl
      data-motion-status
      className="fixed right-4 bottom-4 z-10 grid grid-cols-[auto_auto] gap-x-3 border bg-white px-3 py-2 text-sm"
    >
      <dt>Active section</dt>
      <dd data-active-section>{activeSection ?? "none"}</dd>
      <dt>Smooth scroll</dt>
      <dd>{smoothScroll ? "Lenis" : "native"}</dd>
      <dt>Reduced motion</dt>
      <dd>{reducedMotion ? "yes" : "no"}</dd>
    </dl>
  );
}
