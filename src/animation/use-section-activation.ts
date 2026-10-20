"use client";

import type { RefObject } from "react";
import { motionStore } from "@/stores/motion-store";
import { ScrollTrigger, useGSAP } from "./gsap";

/**
 * Marks `id` as the active section while the element spans the viewport
 * center. One ScrollTrigger per section, no per-frame work; the store only
 * changes when the active section does.
 */
export function useSectionActivation(ref: RefObject<HTMLElement | null>, id: string) {
  useGSAP(
    () => {
      if (!ref.current) return;
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top center",
        end: "bottom center",
        onToggle: ({ isActive }) => {
          if (isActive) motionStore.setState({ activeSection: id });
          else if (motionStore.getState().activeSection === id) {
            motionStore.setState({ activeSection: null });
          }
        },
      });
      return () => {
        if (motionStore.getState().activeSection === id) {
          motionStore.setState({ activeSection: null });
        }
      };
    },
    { dependencies: [id] },
  );
}
