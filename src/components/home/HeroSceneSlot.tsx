import { SceneAnchor } from "@/runtime/scene/SceneAnchor";

/**
 * The hero's 3D area. The persistent Stage renders the "hero" scene behind the
 * DOM; the SceneAnchor below is the box its sculpture core fills (energy trails
 * extend beyond it). The canvas sits behind the whole DOM, so anything here is
 * automatically behind the name. CSS alone decides the composition per layout:
 *
 *   wide   – right side, centred ≈ 74% across and 52% down the hero, core
 *            diameter = 27vw (the reference: 330px of a 1230px frame), capped
 *            by 62svh on unusually wide screens.
 *   mobile – the slot is the flexible space between header and content. The
 *            sculpture is centred horizontally and reaches down behind the name
 *            by --hero-overlap (set by the hero CSS from the name's own size),
 *            as large as that height allows (sized by height, a percentage of
 *            the slot; width from aspect-ratio), capped by the viewport width.
 *            Every phone height gets the same layered composition.
 *
 * The CSS glow stays as the atmosphere (and is the fallback without WebGL).
 * Purely decorative: aria-hidden, no pointer events.
 */
export function HeroSceneSlot() {
  return (
    <div
      aria-hidden
      data-hero-scene-slot
      className="pointer-events-none relative -z-10 flex-1 wide:absolute wide:inset-0 wide:overflow-hidden"
    >
      {/* CSS glow: the atmosphere without WebGL. The canvas renders BEHIND the DOM, so
          this would tint the sculpture; it fades out once the Stage is ready. */}
      <div className="absolute bottom-[calc(var(--hero-overlap)*-1)] left-1/2 aspect-square w-[min(150vw,46rem)] -translate-x-1/2 translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgb(170_10_20/0.24),rgb(110_0_10/0.10)_45%,transparent)] transition-opacity duration-700 in-data-[webgl=ready]:opacity-0 wide:top-[52%] wide:bottom-auto wide:left-[74%] wide:w-[min(62vw,95vh)] wide:-translate-1/2" />
      <SceneAnchor
        scene="hero"
        name="sculpture"
        className="absolute bottom-[calc(var(--hero-overlap)*-1)] left-1/2 aspect-square h-[min(100%+var(--hero-overlap),92vw,34rem)] -translate-x-1/2 wide:top-[52%] wide:bottom-auto wide:left-[74%] wide:h-auto wide:w-[min(27vw,62svh)] wide:-translate-1/2"
      />
    </div>
  );
}
