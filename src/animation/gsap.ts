"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The only place GSAP plugins are registered. Import gsap, ScrollTrigger and
 * useGSAP from here so registration has always happened (enforced by ESLint).
 *
 * Registering is idempotent, so module re-evaluation under Fast Refresh is safe.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * matchMedia conditions shared by every motion-aware component.
 * Use with `gsap.matchMedia().add(MOTION_QUERIES, (ctx) => { ctx.conditions.reduced … })`;
 * the branch is rebuilt automatically when a condition changes.
 */
export const MOTION_QUERIES = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  finePointer: "(pointer: fine) and (hover: hover)",
  coarsePointer: "(pointer: coarse)",
} as const;

export type MotionConditions = Record<keyof typeof MOTION_QUERIES, boolean>;

export function readMotionConditions(context: gsap.Context): MotionConditions {
  return context.conditions as MotionConditions;
}

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  // Dev-only handle for inspecting triggers/timelines from devtools.
  (window as Window & { __gsap?: unknown }).__gsap = { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger, useGSAP };
