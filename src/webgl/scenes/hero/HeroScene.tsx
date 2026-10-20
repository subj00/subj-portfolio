import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { type Group, MathUtils, type Mesh, PlaneGeometry } from "three";
import { sceneRigs } from "@/runtime/scene/scene-rigs";
import { stageStore } from "@/stores/stage-store";
import { createAnchorFrame, sampleAnchor } from "../../anchor-projection";
import { useDisposable } from "../../use-disposable";
import {
  createCoreMaterial,
  createEnergyUniforms,
  createHaloMaterial,
  createShellMaterial,
  createSparkMaterial,
  createTrailMaterial,
  updateEnergyUniforms,
} from "./materials";
import { createRedEnvironment } from "./red-environment";
import {
  createCoreGeometry,
  createShellGeometry,
  createSparkGeometry,
  createTrailGeometry,
  SCULPTURE_DETAIL,
  TRAILS,
} from "./sculpture-geometry";

/**
 * The hero centerpiece: a glossy black-and-red sculpture with energy trails.
 * A persistent scene (Scene Registry key "hero"), positioned by the
 * SceneAnchor "hero/sculpture" in the hero's scene slot.
 *
 * Transform layers, outermost first, each with exactly one writer:
 *   anchor   – SceneAnchor: where the CSS places the sculpture box (responsive)
 *   scroll   – sceneRigs.hero: ScrollTrigger-driven transformations (Step 4)
 *   pointer  – damped tilt toward the pointer (hover-capable devices only)
 *   ambient  – slow drift, float and breathing tilt
 *   pose     – fixed sculptural tilt matching the reference
 */

const POSE: [number, number, number] = [0.32, -0.42, -0.38];
const POINTER_TILT = { x: 0.16, y: 0.26 };

export default function HeroScene() {
  const gl = useThree((s) => s.gl);
  const [detail] = useState(() => SCULPTURE_DETAIL[stageStore.getState().tier]);
  const [canHover] = useState(() => window.matchMedia("(hover: hover)").matches);

  const environment = useDisposable(() => createRedEnvironment(gl));
  const [uniforms] = useState(createEnergyUniforms);

  const coreGeometry = useDisposable(() => createCoreGeometry(detail.coreDetail));
  const shellGeometry = useDisposable(() => createShellGeometry(detail));
  const trails = useDisposable(() => {
    const items = TRAILS.map((spec) => ({
      geometry: createTrailGeometry(spec, detail.trailSegments),
      material: createTrailMaterial(uniforms, spec),
    }));
    return {
      items,
      dispose: () =>
        items.forEach(({ geometry, material }) => (geometry.dispose(), material.dispose())),
    };
  });
  const coreMaterial = useDisposable(() => createCoreMaterial(environment.texture, uniforms));
  const shellMaterial = useDisposable(() => createShellMaterial(environment.texture, uniforms));
  const haloGeometry = useDisposable(() => new PlaneGeometry(1, 1));
  const haloMaterial = useDisposable(() => createHaloMaterial(uniforms));
  const sparkGeometry = useDisposable(() => createSparkGeometry(detail.sparks));
  const sparkMaterial = useDisposable(() => createSparkMaterial(uniforms, gl.getPixelRatio()));

  const anchorLayer = useRef<Group>(null);
  const scrollLayer = useRef<Group>(null);
  const pointerLayer = useRef<Group>(null);
  const ambientLayer = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const [frame] = useState(createAnchorFrame);
  const motion = useRef({ time: 0, pointerInside: true });

  // The pointer leaving the window eases the sculpture back to rest instead of
  // freezing it at the last tilt. Listener scoped to this scene's lifetime.
  useEffect(() => {
    const root = document.documentElement;
    const leave = () => (motion.current.pointerInside = false);
    const enter = () => (motion.current.pointerInside = true);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointerenter", enter);
    return () => {
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointerenter", enter);
    };
  }, []);

  useFrame((state, delta) => {
    const anchor = anchorLayer.current;
    if (!anchor) return;
    anchor.visible = sampleAnchor("hero", "sculpture", state.camera, state.size, frame);
    if (!anchor.visible) return;

    // Anchor layer: centre and size of the sculpture box (core radius ≈ 1).
    anchor.position.copy(frame.position);
    anchor.scale.setScalar(Math.min(frame.width, frame.height) / 2);

    // Scroll layer: rig values (all neutral until Step 4 timelines drive them).
    const rig = sceneRigs.hero;
    scrollLayer.current?.position.set(rig.offsetX, rig.offsetY, 0);
    scrollLayer.current?.scale.setScalar(rig.scale);
    if (scrollLayer.current) scrollLayer.current.rotation.y = rig.turn;

    const reduced = stageStore.getState().reducedMotion;
    const m = motion.current;

    // Pointer layer: damped tilt toward the pointer, back to rest when it leaves.
    const pointer = pointerLayer.current;
    if (pointer) {
      const active = canHover && !reduced && m.pointerInside;
      const tx = active ? -state.pointer.y * POINTER_TILT.x : 0;
      const ty = active ? state.pointer.x * POINTER_TILT.y : 0;
      pointer.rotation.x = MathUtils.damp(pointer.rotation.x, tx, 2.5, delta);
      pointer.rotation.y = MathUtils.damp(pointer.rotation.y, ty, 2.5, delta);
    }

    // Ambient layer: slow, continuous, never fast. Frozen with reduced motion.
    if (!reduced) m.time += delta;
    const t = m.time;
    const ambient = ambientLayer.current;
    if (ambient) {
      ambient.rotation.y = t * 0.07;
      ambient.rotation.z = Math.sin(t * 0.21) * 0.05;
      ambient.rotation.x = Math.sin(t * 0.17 + 1.3) * 0.04;
      ambient.position.y = Math.sin(t * 0.55) * 0.035;
    }
    updateEnergyUniforms(uniforms, t, rig.energy);

    halo.current?.quaternion.copy(state.camera.quaternion);
  });

  return (
    <>
      {/* Red key from upper left, crimson rim from behind, a whisper of dark ambient. */}
      <ambientLight color="#3a0000" intensity={0.35} />
      <directionalLight color="#ff1a1a" intensity={2.4} position={[-4, 5, 5]} />
      <pointLight color="#e00000" intensity={2.2} decay={0} position={[3.5, -1.5, -3]} />

      <group ref={anchorLayer}>
        <mesh
          ref={halo}
          geometry={haloGeometry}
          material={haloMaterial}
          position={[0, 0, -1.6]}
          scale={5.4}
          renderOrder={-1}
        />
        <group ref={scrollLayer}>
          <group ref={pointerLayer}>
            <group ref={ambientLayer}>
              <group rotation={POSE}>
                <mesh geometry={coreGeometry} material={coreMaterial} />
                <mesh geometry={shellGeometry} material={shellMaterial} />
                {trails.items.map(({ geometry, material }, i) => (
                  <mesh key={i} geometry={geometry} material={material} renderOrder={2} />
                ))}
              </group>
            </group>
          </group>
          {detail.sparks > 0 && <points geometry={sparkGeometry} material={sparkMaterial} />}
        </group>
      </group>
    </>
  );
}
