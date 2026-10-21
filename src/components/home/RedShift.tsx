"use client";

import { useRef } from "react";
import {
  gsap,
  MOTION_QUERIES,
  readMotionConditions,
  ScrollTrigger,
  useGSAP,
} from "@/animation/gsap";
import { resettleOnRefresh } from "@/animation/scrubbed";
import { sceneRigs } from "@/runtime/scene/scene-rigs";

/**
 * "The Red Shift": the Hero → About transition. One scrubbed ScrollTrigger
 * timeline over the single screen of scrolling between the two sections
 * (About's top entering the viewport → reaching its top). No pinning, no scroll
 * locking: it follows native/Lenis scrolling both ways, and the section links
 * simply land on its ends (Home = 0, About = 1, the approved final layout).
 *
 * Progress (desktop; mobile has its own, more vertical choreography):
 *   A 0.00–0.25  the sculpture charges (energy surge, extra spin); the hero
 *                text starts lifting away
 *   B 0.20–0.70  it travels toward the About portrait (the "portal" anchor),
 *                trails stretching toward it, energy peaking, growing smaller
 *   C 0.50–0.85  it dissolves into the portrait as the photo is uncovered from
 *                that point by a circular reveal with a red ring on its edge
 *   D 0.70–1.00  heading, statement, introduction, CV action, then the
 *                timeline rows settle into the final layout
 *
 * Ownership: the scene's transition rig values (travel, presence, surge,
 * spin, stretch) and the elements marked data-shift belong to this timeline
 * alone. Reduced motion: no timeline (everything static and visible). Without
 * WebGL the DOM part still plays and the content always ends fully visible.
 */
export function RedShift() {
  const marker = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const main = marker.current?.closest("main");
    const about = main?.querySelector<HTMLElement>("[data-section='about']");
    const heroContent = main?.querySelector<HTMLElement>("[data-shift='hero-content']");
    // The scroll hint's own opacity belongs to the intro: fade its children instead.
    const scrollHint = main?.querySelectorAll("[data-intro-el='scroll'] > *") ?? [];
    const portrait = about?.querySelector<HTMLElement>("[data-shift='portrait']");
    const photo = portrait?.querySelector<HTMLElement>("img");
    const sweep = about?.querySelector<HTMLElement>("[data-shift='sweep']");
    if (!about || !heroContent || !portrait || !photo || !sweep) return;
    const text = about.querySelectorAll("[data-shift='about-text']");
    const rows = about.querySelectorAll("[data-shift='about-row']");
    const rig = sceneRigs.hero;

    // The ring's diameter is the reveal's final circle (90% of the photo's
    // reference radius), so it rides the clip edge exactly. Re-measured on refresh.
    const sizeSweep = () => {
      const { width, height } = photo.getBoundingClientRect();
      sweep.style.width = `${1.8 * Math.sqrt((width * width + height * height) / 2)}px`;
    };

    const mm = gsap.matchMedia();
    mm.add(
      { ...MOTION_QUERIES, wide: "(width >= 48rem) and (orientation: landscape)" },
      (context) => {
        const { reduced } = readMotionConditions(context);
        if (reduced) return;
        const wide = Boolean((context.conditions as { wide?: boolean }).wide);
        // Mobile: face-led reveal higher in the (taller) crop, a shorter travel,
        // a quicker text handover; the sculpture stays centred.
        const c = wide
          ? {
              reveal: "50% 42%",
              textOut: 0.05,
              travel: [0.2, 0.55],
              mid: 0.62,
              shrinkAt: 0.3,
              stretch: 1,
            }
          : {
              reveal: "50% 34%",
              textOut: 0,
              travel: [0.15, 0.55],
              mid: 0.5,
              shrinkAt: 0.12,
              stretch: 0.6,
            };

        sizeSweep();
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: about,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              sizeSweep();
              resettleOnRefresh(self);
            },
          },
        });

        // A — the sculpture reacts; the hero text begins to leave.
        tl.fromTo(rig, { surge: 1 }, { surge: 1.6, duration: 0.25, ease: "power1.in" }, 0)
          .to(rig, { surge: 2.3, duration: 0.3, ease: "power1.inOut" }, 0.25)
          .to(rig, { surge: 0, duration: 0.3, ease: "power2.in" }, 0.55)
          .fromTo(rig, { spin: 0 }, { spin: 1.4, duration: 1, ease: "power1.inOut" }, 0)
          .fromTo(
            heroContent,
            { y: 0, opacity: 1 },
            { y: () => -0.12 * innerHeight, opacity: 0, duration: 0.4, ease: "power1.in" },
            c.textOut,
          )
          .fromTo(scrollHint, { opacity: 1 }, { opacity: 0, duration: 0.15 }, 0);

        // B — travel toward the portrait, trails stretching, growing smaller.
        tl.fromTo(
          rig,
          { travel: 0 },
          { travel: 1, duration: c.travel[1], ease: "power2.inOut" },
          c.travel[0],
        )
          .fromTo(
            rig,
            { stretch: 0 },
            { stretch: c.stretch, duration: 0.3, ease: "power2.out" },
            0.22,
          )
          .to(rig, { stretch: 0, duration: 0.3, ease: "power2.in" }, 0.55)
          .fromTo(
            rig,
            { presence: 1 },
            { presence: c.mid, duration: 0.72 - c.shrinkAt, ease: "power1.inOut" },
            c.shrinkAt,
          )
          .to(rig, { presence: 0, duration: 0.18, ease: "power2.in" }, 0.72);

        // C — the photo is uncovered from where the energy lands.
        tl.fromTo(
          photo,
          { clipPath: `circle(0% at ${c.reveal})` },
          { clipPath: `circle(90% at ${c.reveal})`, duration: 0.35, ease: "power2.out" },
          0.5,
        )
          .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power1.out" }, 0.5)
          .fromTo(sweep, { scale: 0 }, { scale: 1, duration: 0.35, ease: "power2.out" }, 0.5)
          .fromTo(sweep, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.5)
          .to(sweep, { opacity: 0, duration: 0.14, ease: "power1.in" }, 0.7);

        // D — the About content arrives and settles.
        tl.fromTo(
          text,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.16, ease: "power2.out", stagger: 0.03 },
          0.7,
        ).fromTo(
          rows,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.16, ease: "power2.out", stagger: 0.03 },
          0.78,
        );
        // Exactly 1 long, so scroll progress = timeline time (the stages above).
        tl.set({}, {}, 1);
      },
    );

    // Layout-dependent measurements (anchors, start/end) after fonts settle.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  });

  return <span ref={marker} hidden />;
}
