"use client";

import { useRef } from "react";
import { play } from "@/animation/director";
import {
  gsap,
  MOTION_QUERIES,
  readMotionConditions,
  ScrollTrigger,
  useGSAP,
} from "@/animation/gsap";
import { useSectionActivation } from "@/animation/use-section-activation";
import { SceneAnchor } from "@/runtime/scene/SceneAnchor";
import { sceneRigs } from "@/runtime/scene/scene-rigs";

/**
 * TEMPORARY. One scrubbed timeline drives a DOM box and the lab rig, which
 * the 3D object reads every frame. Property ownership:
 *   scroll timeline   → box xPercent/rotation, rig.sync
 *   Director "pulse"  → box scale, rig.emphasis
 */
export function ScrollSyncDemo() {
  const section = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLOutputElement>(null);

  useSectionActivation(section, "sync");

  useGSAP(
    () => {
      const writeProgress = (self: ScrollTrigger) => {
        if (readout.current) readout.current.textContent = self.progress.toFixed(2);
      };
      const trigger = { trigger: section.current, start: "top top", end: "bottom bottom" };

      // Created inside useGSAP's context: reverted on unmount and rebuilt
      // whenever a condition (reduced motion, pointer type) changes.
      gsap.matchMedia().add(MOTION_QUERIES, (context) => {
        const { reduced } = readMotionConditions(context);

        if (reduced) {
          // Same information, no motion: a fixed pose and a live readout.
          gsap.set(sceneRigs.lab, { sync: 0.5 });
          ScrollTrigger.create({ ...trigger, onUpdate: writeProgress });
          return;
        }

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { ...trigger, scrub: true, onUpdate: writeProgress },
          })
          .fromTo(box.current, { xPercent: 0, rotation: 0 }, { xPercent: 250, rotation: 180 }, 0)
          .fromTo(sceneRigs.lab, { sync: 0 }, { sync: 1 }, 0);
      });
    },
    { scope: section },
  );

  // A cross-component sequence (DOM element + 3D rig): owned by the Director, not
  // this component. Clicking again mid-sequence interrupts and restarts from
  // current values instead of stacking tweens.
  const pulse = () => {
    const speed = window.matchMedia(MOTION_QUERIES.reduced).matches ? 0 : 1;
    play("lab-pulse", (timeline) => {
      timeline
        .to(box.current, { scale: 1.25, duration: 0.2 * speed, ease: "power2.out" }, 0)
        .to(sceneRigs.lab, { emphasis: 1, duration: 0.2 * speed, ease: "power2.out" }, 0)
        .to(box.current, { scale: 1, duration: 0.6 * speed, ease: "power2.inOut" })
        .to(sceneRigs.lab, { emphasis: 0, duration: 0.6 * speed, ease: "power2.inOut" }, "<");
    });
  };

  return (
    <section ref={section} aria-labelledby="sync-title" className="relative h-[300vh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center gap-6">
        <h2 id="sync-title" className="text-xl">
          Scroll sync
        </h2>
        <p>
          Progress: <output ref={readout}>0.00</output>
        </p>
        <div className="flex items-center gap-8">
          {/* Sticky element: `live` re-measures it every frame. */}
          <SceneAnchor scene="lab" name="sync" live className="size-40 border border-dashed" />
          <div ref={box} aria-hidden data-demo-box className="size-20 border border-current" />
        </div>
        <button type="button" onClick={pulse} className="self-start border px-3 py-1">
          Pulse (Director)
        </button>
      </div>
    </section>
  );
}
