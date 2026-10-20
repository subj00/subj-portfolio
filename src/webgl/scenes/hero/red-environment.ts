import {
  BackSide,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";

/**
 * A tiny HDR "studio" made only of red light and black, prefiltered once into an
 * environment map (PMREM) for the hero materials.
 *
 * Why: polished metal mostly shows what it reflects. With a neutral environment
 * it reads silver/grey no matter its color; reflecting this one, every highlight
 * and every reflection on the sculpture is red, and the rest falls to black.
 * Applied per material (not scene.environment) so nothing else is affected.
 */
interface Panel {
  size: [number, number];
  color: string;
  intensity: number;
  position: [number, number, number];
}

const PANELS: readonly Panel[] = [
  // Key: a long, hot red strip high on the left (the reference's main highlight).
  { size: [9, 1.1], color: "#ff1a1a", intensity: 9, position: [-5, 5, 4] },
  // A small, near-white-hot spot: crisp specular glints on the curved shells.
  { size: [1.2, 1.2], color: "#ff5a4a", intensity: 14, position: [-3, 6, 6] },
  // Secondary crimson strip on the right for edge definition.
  { size: [1.4, 8], color: "#e00000", intensity: 4, position: [7, 0, -2] },
  // Deep red wash behind: rim light around the silhouette.
  { size: [14, 6], color: "#900000", intensity: 1.4, position: [0, 1, -9] },
  // Dark crimson floor bounce, so lower surfaces are never neutral grey.
  { size: [16, 16], color: "#450000", intensity: 0.7, position: [0, -8, 0] },
];

export function createRedEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const scene = new Scene();
  scene.background = new Color("#000000");

  const disposables: { dispose: () => void }[] = [];

  // Black enclosure (backside sphere) so the room itself contributes nothing.
  const roomGeometry = new SphereGeometry(20, 16, 8);
  const roomMaterial = new MeshBasicMaterial({ color: "#000000", side: BackSide });
  scene.add(new Mesh(roomGeometry, roomMaterial));
  disposables.push(roomGeometry, roomMaterial);

  const planeGeometry = new PlaneGeometry(1, 1);
  disposables.push(planeGeometry);
  for (const panel of PANELS) {
    // HDR values (> 1) survive in PMREM's half-float targets: real light, not paint.
    const material = new MeshBasicMaterial({
      color: new Color(panel.color).multiplyScalar(panel.intensity),
      side: DoubleSide,
      toneMapped: false,
    });
    const mesh = new Mesh(planeGeometry, material);
    mesh.scale.set(panel.size[0], panel.size[1], 1);
    mesh.position.set(...panel.position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(material);
  }

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  for (const item of disposables) item.dispose();
  return target;
}
