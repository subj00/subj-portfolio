import { sceneRigs } from "@/runtime/scene/scene-rigs";
import { interactionsLocked, toggleSelection } from "@/stores/ui-store";
import { isPlaying, play } from "../director";
import { MOTION_QUERIES } from "../gsap";

/** TEMPORARY (interaction lab). */
export const LAB_INTERACT_ID = "lab:interact";
const CHANNEL = "lab-activate";

/**
 * The essential interaction of the demo object, shared by the 3D click/tap and
 * the keyboard-accessible DOM button so both paths behave identically.
 * Returns false when ignored (locked, or the previous activation still running).
 */
export function activateLabObject(): boolean {
  if (interactionsLocked() || isPlaying(CHANNEL)) return false;
  toggleSelection(LAB_INTERACT_ID);
  const reduced = window.matchMedia(MOTION_QUERIES.reduced).matches;
  play(CHANNEL, (timeline) => {
    timeline
      .fromTo(
        sceneRigs.lab,
        { activate: 0 },
        { activate: 1, duration: reduced ? 0 : 0.8, ease: "power3.inOut" },
      )
      .set(sceneRigs.lab, { activate: 0 }); // one full turn: same pose, ready to repeat
  });
  return true;
}
