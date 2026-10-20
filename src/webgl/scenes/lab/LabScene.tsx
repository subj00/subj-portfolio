import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  BoxGeometry,
  Color,
  type Group,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { getAnchor } from "@/runtime/scene/anchors";
import { sceneRigs } from "@/runtime/scene/scene-rigs";
import { stageStore } from "@/stores/stage-store";
import { createAnchorFrame, sampleAnchor } from "../../anchor-projection";
import { useDisposable } from "../../use-disposable";

/**
 * TEMPORARY verification scene for /lab. Not a design: neutral greys, primitive
 * geometry. Proves anchors, pointer input, damping, reduced motion and
 * resource ownership. Delete together with src/app/lab once real scenes exist.
 *
 * Transform layers (one writer each):
 *   anchor group  – position/scale from the DOM anchor (layout layer)
 *   tilt group    – pointer-driven rotation (input layer)
 *   mesh          – idle spin (ambient layer)
 *
 * The sync object adds a "motion" layer between anchor and mesh, driven only
 * by sceneRigs.lab (written by GSAP in DOM code). Objects whose anchor is not
 * on the current page are hidden.
 */

const BASE_COLOR = new Color("#8a8a8a");
const HOVER_COLOR = new Color("#d0d0d0");
const ORIGIN = new Vector3();
const MARKER_COUNT = 3;
const MARKER_SPACING = 1.6;

export default function LabScene() {
  const anchorGroup = useRef<Group>(null);
  const tiltGroup = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const markers = useRef<Group>(null);
  const syncAnchor = useRef<Group>(null);
  const syncMotion = useRef<Group>(null);

  const [targetFrame] = useState(createAnchorFrame);
  const [markerFrame] = useState(createAnchorFrame);
  const [syncFrame] = useState(createAnchorFrame);
  const interaction = useRef({ hovered: false, detached: false, hover: 0, detach: 0 });

  // Shared by all marker cubes: one geometry, one material, released on unmount.
  const markerGeometry = useDisposable(() => new BoxGeometry(1, 1, 1));
  const markerMaterial = useDisposable(
    () => new MeshStandardMaterial({ color: BASE_COLOR, roughness: 0.7 }),
  );

  // Mirror interaction state onto the DOM anchor so it can be inspected/styled.
  const syncDiagnostics = () => {
    const element = getAnchor("lab", "target")?.element;
    if (!element) return;
    element.dataset.labHovered = String(interaction.current.hovered);
    element.dataset.labDetached = String(interaction.current.detached);
  };

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  useFrame((state, delta) => {
    const { camera, size, pointer, viewport } = state;
    const reducedMotion = stageStore.getState().reducedMotion;
    // Infinite damping = snap; reduced motion keeps every state change, minus the motion.
    const lambda = reducedMotion ? Infinity : 8;
    const it = interaction.current;
    it.hover = MathUtils.damp(it.hover, it.hovered ? 1 : 0, lambda, delta);
    it.detach = MathUtils.damp(it.detach, it.detached ? 1 : 0, lambda, delta);

    const group = anchorGroup.current;
    if (group) group.visible = sampleAnchor("lab", "target", camera, size, targetFrame);
    if (group?.visible) {
      // Interpolate between the anchored pose and a free pose (screen center);
      // future timelines drive the same blend instead of the click toggle.
      group.position.lerpVectors(targetFrame.position, ORIGIN, it.detach);
      const anchoredScale = Math.min(targetFrame.width, targetFrame.height) * 0.35;
      const freeScale = viewport.height * 0.18;
      group.scale.setScalar(
        MathUtils.lerp(anchoredScale, freeScale, it.detach) * (1 + 0.1 * it.hover),
      );
    }

    const tilt = tiltGroup.current;
    if (tilt) {
      tilt.rotation.x = MathUtils.damp(tilt.rotation.x, -pointer.y * 0.4, lambda, delta);
      tilt.rotation.y = MathUtils.damp(tilt.rotation.y, pointer.x * 0.6, lambda, delta);
    }

    if (mesh.current && !reducedMotion) mesh.current.rotation.y += delta * 0.4;
    material.current?.color.lerpColors(BASE_COLOR, HOVER_COLOR, it.hover);

    const markerGroup = markers.current;
    if (markerGroup) markerGroup.visible = sampleAnchor("lab", "marker", camera, size, markerFrame);
    if (markerGroup?.visible) {
      markerGroup.position.copy(markerFrame.position);
      const spanUnits = MARKER_COUNT * MARKER_SPACING;
      markerGroup.scale.setScalar(
        Math.min(markerFrame.height * 0.5, markerFrame.width / spanUnits),
      );
    }

    // Anchor layer: where the DOM box is. Motion layer: what the timeline says.
    const sync = syncAnchor.current;
    if (sync) sync.visible = sampleAnchor("lab", "sync", camera, size, syncFrame);
    if (sync?.visible) {
      sync.position.copy(syncFrame.position);
      sync.scale.setScalar(Math.min(syncFrame.width, syncFrame.height) * 0.3);
    }
    const motion = syncMotion.current;
    if (motion) {
      const { sync: progress, emphasis } = sceneRigs.lab;
      motion.rotation.set(progress * Math.PI, progress * Math.PI * 2, 0);
      motion.position.y = (0.5 - progress) * 1.2; // in anchor-relative units
      motion.scale.setScalar(1 + 0.35 * emphasis);
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />

      <group ref={anchorGroup}>
        <group ref={tiltGroup}>
          <mesh
            ref={mesh}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (!anchorGroup.current?.visible) return;
              interaction.current.hovered = true;
              document.body.style.cursor = "pointer";
              syncDiagnostics();
            }}
            onPointerOut={() => {
              interaction.current.hovered = false;
              document.body.style.cursor = "";
              syncDiagnostics();
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!anchorGroup.current?.visible) return;
              interaction.current.detached = !interaction.current.detached;
              syncDiagnostics();
            }}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial ref={material} color={BASE_COLOR} roughness={0.5} flatShading />
          </mesh>
        </group>
      </group>

      <group ref={markers}>
        {Array.from({ length: MARKER_COUNT }, (_, i) => (
          <mesh
            key={i}
            geometry={markerGeometry}
            material={markerMaterial}
            position={[(i - (MARKER_COUNT - 1) / 2) * MARKER_SPACING, 0, 0]}
          />
        ))}
      </group>

      <group ref={syncAnchor}>
        <group ref={syncMotion}>
          <mesh geometry={markerGeometry} material={markerMaterial} />
        </group>
      </group>
    </>
  );
}
