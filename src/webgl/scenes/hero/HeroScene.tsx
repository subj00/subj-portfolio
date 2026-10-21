import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  Euler,
  type Group,
  MathUtils,
  type Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { sceneRigs } from "@/runtime/scene/scene-rigs";
import { setScenePresented, stageStore } from "@/stores/stage-store";
import { createAnchorFrame, sampleAnchor } from "../../anchor-projection";
import { useObjectInteraction } from "../../interaction/use-object-interaction";
import { useDisposable } from "../../use-disposable";
import {
  createBurstMaterial,
  createCoreMaterial,
  createEnergyUniforms,
  createHaloMaterial,
  createShellMaterial,
  createSparkMaterial,
  createTrailMaterial,
  recordImpact,
  updateEnergyUniforms,
  VEIN_PARAMS,
} from "./materials";
import { createRedEnvironment } from "./red-environment";
import {
  createBurstGeometry,
  createCoreGeometry,
  createShellGeometry,
  createSparkGeometry,
  createTrailGeometry,
  emitBurst,
  SCULPTURE_DETAIL,
  seededRandom,
  TRAILS,
} from "./sculpture-geometry";

/**
 * The hero centerpiece: a glossy black sculpture threaded with luminous red
 * veins, a few refined crimson blades and energy trails. A persistent scene
 * (Scene Registry key "hero"), positioned by the SceneAnchor "hero/sculpture".
 *
 * Transform layers, outermost first, each with exactly one writer:
 *   anchor   – SceneAnchor: where the CSS places the sculpture box (responsive)
 *   scroll   – sceneRigs.hero: ScrollTrigger-driven transformations (Step 4)
 *   pointer  – damped tilt toward the pointer (hover-capable devices only)
 *   impact   – click/tap impulse: a small push away from the contact, recovering
 *   ambient  – slow drift, float and breathing tilt
 *   pose     – fixed sculptural tilt; impacts, veins and sparks live in this space
 *
 * Click/tap goes through useObjectInteraction on an invisible low-poly proxy
 * shell (R3F raycasting, tap-vs-drag, locks and touch rules all shared with the
 * rest of the app) and triggers, in the same frame: flash + ripple (shader
 * uniforms), a spark burst (GPU pool) and the impulse (impact layer). The intro
 * fires the same impact on the camera-facing side through sceneRigs.hero.ignite.
 *
 * Boot: the first ~0.7s after the scene first appears it powers on (energy and
 * a slight swell ramp in), so a late-loading scene never pops in at full glow.
 */

const POSE = new Euler(0.32, -0.42, -0.38);
const POINTER_TILT = { x: 0.16, y: 0.26 };
const IMPACT_DURATION = VEIN_PARAMS.impactLife;
const BOOT_SECONDS = 0.7;
/** Where the intro's ignite lands: toward the camera, nudged up and to the left. */
const IGNITE_NUDGE = new Vector3(-0.35, 0.3, 0);

const _local = new Vector3();
const _normal = new Vector3();
const _push = new Vector3();

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
  const coreMaterial = useDisposable(() =>
    createCoreMaterial(environment.texture, uniforms, { detailed: detail.detailedVeins }),
  );
  const shellMaterial = useDisposable(() => createShellMaterial(environment.texture, uniforms));
  const haloGeometry = useDisposable(() => new PlaneGeometry(1, 1));
  const haloMaterial = useDisposable(() => createHaloMaterial(uniforms));
  const sparkGeometry = useDisposable(() => createSparkGeometry(detail.sparks));
  const sparkMaterial = useDisposable(() => createSparkMaterial(uniforms, gl.getPixelRatio()));
  // Room for one burst per concurrent impact, so rapid clicks never cut a burst short.
  const burstGeometry = useDisposable(() => createBurstGeometry(detail.burst * 3));
  const burstMaterial = useDisposable(() => createBurstMaterial(uniforms, gl.getPixelRatio()));
  // Hit target: cheap, slightly larger than the core so taps on the blades count too.
  const proxyGeometry = useDisposable(() => new SphereGeometry(1.12, 20, 14));
  const proxyMaterial = useDisposable(() => new MeshBasicMaterial({ visible: false }));

  const anchorLayer = useRef<Group>(null);
  const scrollLayer = useRef<Group>(null);
  const pointerLayer = useRef<Group>(null);
  const impactLayer = useRef<Group>(null);
  const ambientLayer = useRef<Group>(null);
  const pose = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const [frame] = useState(createAnchorFrame);
  const motion = useRef({
    time: 0,
    clock: 0,
    pointerInside: true,
    hover: 0,
    impactSlot: 0,
    burstSlot: 0,
    lastImpact: -1000,
    impactReduced: false,
    impactNormal: new Vector3(0, 0, 1),
    random: seededRandom(29),
    ignite: sceneRigs.hero.ignite,
    boot: 0,
    visibleFrames: 0,
  });

  /** One energy impact at `normal` (sculpture space, unit length). */
  const strike = (normal: Vector3) => {
    const m = motion.current;
    const reduced = stageStore.getState().reducedMotion;
    _local.copy(normal).multiplyScalar(1.02); // settled onto the core's surface
    recordImpact(uniforms, m.impactSlot++, _local, m.clock);
    m.lastImpact = m.clock;
    m.impactReduced = reduced;
    m.impactNormal.copy(normal);
    if (!reduced && detail.burst > 0) {
      emitBurst(burstGeometry, m.burstSlot, detail.burst, _local, normal, m.clock, m.random);
      m.burstSlot = (m.burstSlot + detail.burst) % (detail.burst * 3);
    }
  };

  const { state: interaction, handlers } = useObjectInteraction({
    enabled: () => anchorLayer.current?.visible ?? false,
    onActivate: (event: ThreeEvent<MouseEvent>) => {
      const space = pose.current;
      if (!space) return;
      // Contact point in sculpture space.
      _normal.copy(event.point);
      space.worldToLocal(_normal);
      strike(_normal.normalize());
    },
  });

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

  useEffect(() => () => setScenePresented("hero", false), []);

  useFrame((state, delta) => {
    const anchor = anchorLayer.current;
    if (!anchor) return;
    anchor.visible = sampleAnchor("hero", "sculpture", state.camera, state.size, frame);
    if (!anchor.visible) return;

    // Anchor layer: centre and size of the sculpture box (core radius ≈ 1).
    anchor.position.copy(frame.position);
    anchor.scale.setScalar(Math.min(frame.width, frame.height) / 2);

    // Scroll layer: rig values (neutral until Step 4 timelines drive them).
    const rig = sceneRigs.hero;
    const scroll = scrollLayer.current;
    if (scroll) {
      scroll.position.set(rig.offsetX, rig.offsetY, 0);
      scroll.scale.setScalar(rig.scale);
      scroll.rotation.y = rig.turn;
    }

    const reduced = stageStore.getState().reducedMotion;
    const m = motion.current;
    m.clock += delta;
    if (!reduced) m.time += delta;
    m.boot = Math.min(1, m.boot + delta / BOOT_SECONDS);
    // Second visible frame: the first one has been rendered (and compiled).
    if (++m.visibleFrames === 2) setScenePresented("hero", true);
    const boot = reduced ? 1 : 1 - (1 - m.boot) ** 3;

    // Intro ignite: an impact on the side facing the camera (increments only).
    if (rig.ignite > m.ignite && pose.current) {
      _normal.copy(state.camera.position);
      pose.current.worldToLocal(_normal);
      strike(_normal.normalize().add(IGNITE_NUDGE).normalize());
    }
    m.ignite = rig.ignite;

    // Pointer layer: damped tilt toward the pointer, back to rest when it leaves.
    const pointer = pointerLayer.current;
    if (pointer) {
      const active = canHover && !reduced && m.pointerInside;
      const tx = active ? -state.pointer.y * POINTER_TILT.x : 0;
      const ty = active ? state.pointer.x * POINTER_TILT.y : 0;
      pointer.rotation.x = MathUtils.damp(pointer.rotation.x, tx, 2.5, delta);
      pointer.rotation.y = MathUtils.damp(pointer.rotation.y, ty, 2.5, delta);
    }

    // Impact layer: a quick push away from the contact point that recovers
    // smoothly (impulse curve), plus a brief swell. Skipped for reduced motion.
    const age = m.clock - m.lastImpact;
    const impact = impactLayer.current;
    const ambient = ambientLayer.current;
    if (impact && ambient) {
      if (age < IMPACT_DURATION && !m.impactReduced) {
        const k = age * 9;
        const push = -0.06 * k * Math.exp(1 - k);
        _push.copy(m.impactNormal).applyEuler(POSE).applyQuaternion(ambient.quaternion);
        impact.position.copy(_push).multiplyScalar(push);
        impact.scale.setScalar(1 + 0.025 * Math.sin(age * 15) * Math.exp(-age * 6));
      } else {
        impact.position.set(0, 0, 0);
        impact.scale.setScalar(1);
      }
    }

    // Ambient layer: slow, continuous, never fast. Frozen with reduced motion.
    const t = m.time;
    if (ambient) {
      ambient.rotation.y = t * 0.07;
      ambient.rotation.z = Math.sin(t * 0.21) * 0.05;
      ambient.rotation.x = Math.sin(t * 0.17 + 1.3) * 0.04;
      ambient.position.y = Math.sin(t * 0.55) * 0.035;
      ambient.scale.setScalar(0.94 + 0.06 * boot);
    }

    // Energy: boot × scroll/intro rig × hover lift × impact surge (decays over ~0.6s).
    m.hover = MathUtils.damp(m.hover, interaction.current.hovered ? 1 : 0, 6, delta);
    const surge = age < IMPACT_DURATION ? Math.exp(-age * 4) * (m.impactReduced ? 0.4 : 0.8) : 0;
    updateEnergyUniforms(uniforms, {
      time: t,
      clock: m.clock,
      energy: boot * rig.energy * (1 + 0.15 * m.hover + surge),
      impactMotion: !reduced,
    });

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
            <group ref={impactLayer}>
              <group ref={ambientLayer}>
                <group ref={pose} rotation={POSE}>
                  <mesh geometry={coreGeometry} material={coreMaterial} />
                  <mesh geometry={shellGeometry} material={shellMaterial} />
                  {trails.items.map(({ geometry, material }, i) => (
                    <mesh key={i} geometry={geometry} material={material} renderOrder={2} />
                  ))}
                  <points
                    geometry={burstGeometry}
                    material={burstMaterial}
                    frustumCulled={false}
                    renderOrder={3}
                  />
                  <mesh
                    geometry={proxyGeometry}
                    material={proxyMaterial}
                    scale={[0.98, 1.15, 1]}
                    {...handlers}
                  />
                </group>
              </group>
            </group>
          </group>
          {detail.sparks > 0 && <points geometry={sparkGeometry} material={sparkMaterial} />}
        </group>
      </group>
    </>
  );
}
