"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, readMotionConditions, useGSAP } from "@/animation/gsap";

/**
 * The footer's one entrance: as it comes into view the name rises out of its
 * mask, then the role and the bottom row fade up. Plays on entry and reverses
 * when scrolled back above it. Reduced motion (or no JavaScript): nothing,
 * everything is simply visible.
 */
export function FooterReveal() {
  const marker = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const footer = marker.current?.closest("footer");
    const pick = (name: string) => footer?.querySelector(`[data-footer='${name}']`);
    const name = pick("name-inner");
    const role = pick("role");
    const bottom = pick("bottom");
    if (!footer || !name || !role || !bottom) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERIES, (context) => {
      if (readMotionConditions(context).reduced) return;
      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: footer,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        })
        .from(name, { yPercent: 105, duration: 0.9 })
        .from(role, { opacity: 0, y: 8, duration: 0.6 }, 0.35)
        .from(bottom, { opacity: 0, y: 10, duration: 0.6 }, 0.5);
    });
  });

  return <span ref={marker} hidden />;
}
