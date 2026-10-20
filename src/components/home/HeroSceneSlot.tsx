import { SceneAnchor } from "@/runtime/scene/SceneAnchor";

/**
 * The hero's 3D area. The persistent Stage renders the "hero" scene behind the
 * DOM; the SceneAnchor below is the box its sculpture core fills (energy trails
 * extend beyond it). CSS alone decides the composition per layout:
 *
 *   wide   – right side, centred ≈ 74% across and 52% down the hero, core
 *            diameter = 27vw (the reference: 330px of a 1230px frame), capped
 *            by 62svh on unusually wide screens.
 *   mobile – large and partly above the content, centred ≈ 55% across and
 *            30% down the hero, about 78% of the viewport width.
 *
 * The CSS glow stays as the atmosphere (and is the fallback without WebGL).
 * Purely decorative: aria-hidden, no pointer events.
 */
export function HeroSceneSlot() {
  return (
    <div
      aria-hidden
      data-hero-scene-slot
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* CSS glow: the atmosphere without WebGL. The canvas renders BEHIND the DOM, so
          this would tint the sculpture; it fades out once the Stage is ready. */}
      <div className="absolute top-[30%] left-[58%] aspect-square w-[min(120vw,46rem)] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(170_10_20/0.24),rgb(110_0_10/0.10)_45%,transparent)] transition-opacity duration-700 in-data-[webgl=ready]:opacity-0 wide:top-[52%] wide:left-[74%] wide:w-[min(62vw,95vh)]" />
      <SceneAnchor
        scene="hero"
        name="sculpture"
        className="absolute top-[30%] left-[55%] aspect-square w-[min(78vw,30rem)] -translate-1/2 wide:top-[52%] wide:left-[74%] wide:w-[min(27vw,62svh)]"
      />
    </div>
  );
}
