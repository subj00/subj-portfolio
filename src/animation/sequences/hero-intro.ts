import { sceneRigs } from "@/runtime/scene/scene-rigs";

/**
 * The cinematic hero intro (≈2s), built on one timeline (Director channel
 * "intro"). DOM effects live in HeroIntro's overlay; the sculpture is the real
 * hero scene, driven only through its rig (energy, scale, turn, ignite), so it
 * composes with pointer tilt and ambient motion and never remounts.
 *
 *   A  0.04–0.40  darkness: a tiny red core charges
 *   B  0.24–0.54  ignition: a sharp crimson beam crosses the screen; impact
 *                 flash and shockwave at the core (≈0.40)
 *   C  0.52–1.32  the darkness lifts, the sculpture powers on: energy overshoot
 *                 then settle, scale and turn into the resting pose; an ignite
 *                 impact runs through its veins (0.58)
 *   D  1.00–1.66  the name is wiped in left → right behind a glowing red edge
 *   E  1.40–2.00  label, subtitle, CTA, header and scroll hint settle in
 *
 * A pause at HOLD gives a still-loading sculpture a brief chance (bounded by
 * the caller) to be ready for its reveal; nothing waits beyond that. HOLD sits
 * where nothing on screen is moving (the core has just lit, the ignition has not
 * started): the stage's first render (scene setup, shader compilation) blocks
 * the main thread for a few frames, and GSAP cannot animate during it, so that
 * work must land on a still frame, never mid-motion.
 *
 * Every tween is a fromTo or a to on a value the timeline itself set, so
 * reverting the timeline afterwards restores the exact resting state (rig
 * neutral, no inline styles left).
 */

export const INTRO_CHANNEL = "intro";
/** Where a late start (slow hydration) begins: skips the darkness, keeps the ignition. */
export const INTRO_LATE_START = 0.22;
const HOLD = 0.24;

/** Beam travel: wrapper 170vmax / beam 28vmax (HeroIntro's overlay). */
const BEAM_TRAVEL = (170 / 28) * 100;

export interface HeroIntroParts {
  shade: Element;
  core: Element;
  beam: Element;
  trail: Element;
  flash: Element;
  ring: Element;
  /** The name graphic (clipped) and the element moving with it. */
  name: Element;
  nameBox: HTMLElement;
  edge: Element;
  /** Settled in last, in order. */
  reveals: Element[];
}

export function buildHeroIntro(
  tl: gsap.core.Timeline,
  parts: HeroIntroParts,
  hold: (resume: () => void) => void,
) {
  const { shade, core, beam, trail, flash, ring, name, nameBox, edge, reveals } = parts;
  const rig = sceneRigs.hero;

  // A — darkness, a charging point of light.
  tl.fromTo(
    core,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" },
    0.04,
  ).to(core, { scale: 1.7, duration: 0.16, ease: "power2.in" }, 0.24);

  // B — ignition: beam across, faint trail drawn behind it, impact at the core.
  tl.fromTo(
    beam,
    { xPercent: -100, opacity: 1 },
    { xPercent: BEAM_TRAVEL, opacity: 1, duration: 0.3, ease: "power2.inOut" },
    0.24,
  )
    .fromTo(
      trail,
      { scaleX: 0, opacity: 0.85 },
      { scaleX: 1, duration: 0.28, ease: "power3.out" },
      0.24,
    )
    .to(trail, { opacity: 0, duration: 0.4, ease: "power1.out" }, 0.46)
    .to(core, { scale: 3.4, opacity: 0, duration: 0.24, ease: "power2.out" }, 0.4)
    // The flash expands in ONE tween (one ease, no seam); its opacity has its own
    // fade-in and fade-out, so no two tweens ever share a property.
    .fromTo(flash, { scale: 0.25 }, { scale: 1.35, duration: 0.65, ease: "power3.out" }, 0.4)
    .fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: "power2.out" }, 0.4)
    .to(flash, { opacity: 0, duration: 0.55, ease: "power2.out" }, 0.5)
    .fromTo(
      ring,
      { scale: 0.15, opacity: 0.9 },
      { scale: 2.8, opacity: 0, duration: 0.6, ease: "power2.out" },
      0.41,
    )
    .addPause(HOLD, () =>
      hold(() => {
        tl.resume();
      }),
    );

  // C — the sculpture powers on as the darkness lifts.
  tl.to(shade, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0.52)
    .fromTo(rig, { energy: 0.08 }, { energy: 2.4, duration: 0.25, ease: "power2.out" }, 0.52)
    .to(rig, { energy: 1, duration: 0.6, ease: "power2.inOut" }, 0.8)
    .fromTo(
      rig,
      { scale: 0.84, turn: -0.55 },
      { scale: 1, turn: 0, duration: 0.8, ease: "expo.out" },
      0.52,
    )
    .call(() => void (rig.ignite += 1), undefined, 0.58);

  // D — the name, wiped in behind a red edge that rides the clip.
  tl.fromTo(
    name,
    { clipPath: "inset(0 100% 0 0)" },
    { clipPath: "inset(0 0% 0 0)", duration: 0.62, ease: "power3.inOut" },
    1.0,
  )
    .fromTo(nameBox, { x: -14 }, { x: 0, duration: 0.7, ease: "power3.out" }, 1.0)
    .fromTo(
      edge,
      { x: 0 },
      { x: () => nameBox.clientWidth, duration: 0.62, ease: "power3.inOut" },
      1.0,
    )
    .fromTo(edge, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 1.0)
    .to(edge, { opacity: 0, duration: 0.18 }, 1.48);

  // E — the rest of the hero settles in.
  tl.fromTo(
    reveals,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 },
    1.4,
  );
}
