import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Color, type Group, MathUtils, type MeshStandardMaterial } from "three";
import { gsap } from "@/animation/gsap";
import { activateLabObject, LAB_INTERACT_ID } from "@/animation/sequences/lab-activate";
import { getAnchor } from "@/runtime/scene/anchors";
import { sceneRigs } from "@/runtime/scene/scene-rigs";
import { stageStore } from "@/stores/stage-store";
import { interactionsLocked, uiStore } from "@/stores/ui-store";
import { createAnchorFrame, pointerInAnchor, sampleAnchor } from "../../anchor-projection";
import { useObjectInteraction } from "../../interaction/use-object-interaction";

/**
 * TEMPORARY interaction demo object. Transform layers, one writer each:
 *   anchor  – SceneAnchor "interact" (position, scale)
 *   tilt    – pointer position inside the anchor box, damped (hover devices only)
 *   drag    – horizontal drag; a GSAP tween returns it to 0 on release
 *   spin    – sceneRigs.lab.activate (Director sequence, shared with the keyboard button)
 * Scroll-driven timelines never target this object, so nothing competes.
 */

const IDLE = new Color("#8a8a8a");
const HOVER = new Color("#b5b5b5");
const SELECTED = new Color("#e0e0e0");
const LOCKED = new Color("#555555");
const DRAG_RADIANS_PER_PX = 0.01;

export function InteractObject() {
  const anchorLayer = useRef<Group>(null);
  const tiltLayer = useRef<Group>(null);
  const dragLayer = useRef<Group>(null);
  const spinLayer = useRef<Group>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const [frame] = useState(createAnchorFrame);
  const [local] = useState(() => ({ x: 0, y: 0 }));
  const [canHover] = useState(() => window.matchMedia("(hover: hover)").matches);
  const dragStart = useRef(0);
  const returnTween = useRef<gsap.core.Tween | null>(null);

  const diagnostics = (key: string, value: boolean) => {
    const element = getAnchor("lab", "interact")?.element;
    if (element) element.dataset[key] = String(value);
  };

  const { state, handlers } = useObjectInteraction({
    enabled: () => anchorLayer.current?.visible ?? false,
    onActivate: () => void activateLabObject(),
    onHoverChange: (hovered) => diagnostics("hovered", hovered),
    drag: {
      onStart() {
        // The drag owns the layer now: stop a running return tween first.
        returnTween.current?.kill();
        dragStart.current = dragLayer.current?.rotation.y ?? 0;
        diagnostics("dragging", true);
      },
      onMove(dx) {
        if (dragLayer.current) {
          dragLayer.current.rotation.y = dragStart.current + dx * DRAG_RADIANS_PER_PX;
        }
      },
      onEnd(cancelled) {
        diagnostics("dragging", false);
        diagnostics("dragCancelled", cancelled);
        if (!dragLayer.current) return;
        const reduced = stageStore.getState().reducedMotion;
        returnTween.current = gsap.to(dragLayer.current.rotation, {
          y: 0,
          duration: reduced ? 0 : 0.6,
          ease: "power3.out",
        });
      },
    },
  });

  useEffect(() => () => void returnTween.current?.kill(), []);

  useFrame(({ camera, size, pointer }, delta) => {
    const anchor = anchorLayer.current;
    if (!anchor) return;
    anchor.visible = sampleAnchor("lab", "interact", camera, size, frame);
    if (!anchor.visible) return;
    anchor.position.copy(frame.position);
    anchor.scale.setScalar(Math.min(frame.width, frame.height) * 0.32);

    const reduced = stageStore.getState().reducedMotion;
    const lambda = reduced ? Infinity : 6;
    const tilt = tiltLayer.current;
    if (tilt) {
      // Pointer influence is bounded by the anchor box and fades out when the pointer leaves it.
      const inside =
        canHover && !reduced && pointerInAnchor("lab", "interact", pointer, size, local);
      tilt.rotation.x = MathUtils.damp(tilt.rotation.x, inside ? -local.y * 0.5 : 0, lambda, delta);
      tilt.rotation.z = MathUtils.damp(tilt.rotation.z, inside ? -local.x * 0.3 : 0, lambda, delta);
    }

    if (spinLayer.current) spinLayer.current.rotation.y = sceneRigs.lab.activate * Math.PI * 2;

    const selected = uiStore.getState().selection === LAB_INTERACT_ID;
    const target = interactionsLocked()
      ? LOCKED
      : selected
        ? SELECTED
        : state.current.hovered
          ? HOVER
          : IDLE;
    material.current?.color.lerp(target, reduced ? 1 : 1 - Math.exp(-10 * delta));
  });

  return (
    <group ref={anchorLayer}>
      <group ref={tiltLayer}>
        <group ref={dragLayer}>
          <group ref={spinLayer}>
            <mesh {...handlers}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial ref={material} color={IDLE} roughness={0.5} flatShading />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
