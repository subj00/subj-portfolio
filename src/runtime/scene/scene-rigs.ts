import type { SceneKey } from "./scene-keys";

/**
 * Rigs are the contract between authored animation (GSAP, in DOM code) and
 * scenes (R3F). A rig is a plain object of numbers:
 *
 *   DOM side:   gsap.to(sceneRigs.lab, { sync: 1, scrollTrigger: … })
 *   Scene side: useFrame(() => motionGroup.rotation.y = sceneRigs.lab.sync * …)
 *
 * GSAP never touches three.js objects owned by the scene, and scenes never
 * write rig values. Rig values drive the "motion" transform layer, which sits
 * inside the anchor layer, so authored motion composes with SceneAnchor
 * positioning instead of overwriting it.
 *
 * No three.js and no React here: importable from DOM and server-safe code.
 * Timelines created in useGSAP are reverted on unmount, which restores the
 * rig's starting values.
 */
export type Rig = Record<string, number>;

export const sceneRigs = {
  hero: {
    /**
     * Scroll-driven transformation of the sculpture (Step 4+). ScrollTrigger
     * timelines tween these; the hero scene applies them on its own layer, which
     * composes with anchor positioning, pointer tilt and ambient motion.
     */
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    turn: 0,
    /** 0 → 1 energy level (trail and crack intensity); 1 at rest. */
    energy: 1,
  },
  lab: {
    /** 0→1 scroll progress through the sync demo. */
    sync: 0,
    /** 0→1 pulse driven by a Director sequence. */
    emphasis: 0,
    /** 0→1 activation spin of the interaction demo object (Director sequence). */
    activate: 0,
  },
} satisfies Record<SceneKey, Rig>;
