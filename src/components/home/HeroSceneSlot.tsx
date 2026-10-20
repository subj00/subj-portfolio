/**
 * Reserved area for the interactive 3D hero object (Step 3 places a
 * <SceneAnchor scene="hero"> here; the persistent Stage renders behind the DOM).
 *
 * Mobile: the top half of the hero. Wide: the right side, centred where the
 * reference places the object (≈75% across, 50% down).
 *
 * Until then it holds only the atmospheric red light from the reference, so the
 * composition reads correctly without a stand-in object. Purely decorative.
 */
export function HeroSceneSlot() {
  return (
    <div
      aria-hidden
      data-hero-scene-slot
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52%] wide:inset-y-0 wide:right-0 wide:left-[45%] wide:h-auto"
    >
      <div className="absolute top-[55%] left-[62%] aspect-square w-[min(120vw,46rem)] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(170_10_20/0.24),rgb(110_0_10/0.10)_45%,transparent)] wide:top-1/2 wide:left-[55%] wide:w-[min(62vw,95vh)]" />
    </div>
  );
}
