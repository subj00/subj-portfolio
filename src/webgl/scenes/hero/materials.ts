import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  ShaderMaterial,
  type Texture,
} from "three";

/**
 * Materials for the hero sculpture. Physically based where possible (glossy red
 * metal reflecting the red environment), with two small shader additions
 * injected into the standard program rather than custom shaders:
 *   - veins: thin, slowly flowing red cracks of light on the dark core
 *   - rim:   a red fresnel glow on grazing angles (the luminous shell edges)
 *
 * Time and energy are shared uniform objects: the scene updates them once per
 * frame and every material sees the change (no per-material bookkeeping).
 */

export const PALETTE = {
  luminous: new Color("#ff1a1a"),
  crimson: new Color("#e00000"),
  deep: new Color("#900000"),
  shadow: new Color("#450000"),
  black: new Color("#050505"),
} as const;

export interface EnergyUniforms {
  uTime: { value: number };
  /** 0–1 overall energy (Step 4 scroll transitions can dim or flare it). */
  uEnergy: { value: number };
}

export function createEnergyUniforms(): EnergyUniforms {
  return { uTime: { value: 0 }, uEnergy: { value: 1 } };
}

/** Per-frame update of the shared uniforms (three.js uniforms are mutable by design). */
export function updateEnergyUniforms(uniforms: EnergyUniforms, time: number, energy: number) {
  uniforms.uTime.value = time;
  uniforms.uEnergy.value = energy;
}

const NOISE_GLSL = /* glsl */ `
  float heroHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float heroNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(heroHash(i), heroHash(i + vec3(1, 0, 0)), f.x),
          mix(heroHash(i + vec3(0, 1, 0)), heroHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(heroHash(i + vec3(0, 0, 1)), heroHash(i + vec3(1, 0, 1)), f.x),
          mix(heroHash(i + vec3(0, 1, 1)), heroHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

interface EnergyOptions {
  /** Flowing crack veins (object-space noise iso-lines). */
  veins?: { color: Color; strength: number; scale: number };
  /** Fresnel rim glow. */
  rim?: { color: Color; strength: number; power: number };
}

function addEnergy(
  material: MeshPhysicalMaterial,
  uniforms: EnergyUniforms,
  options: EnergyOptions,
) {
  const key = `hero-energy:${options.veins ? "v" : ""}${options.rim ? "r" : ""}`;
  material.customProgramCacheKey = () => key;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uEnergy = uniforms.uEnergy;
    if (options.veins) {
      shader.uniforms.uVeinColor = { value: options.veins.color };
      shader.uniforms.uVeinStrength = { value: options.veins.strength };
      shader.uniforms.uVeinScale = { value: options.veins.scale };
    }
    if (options.rim) {
      shader.uniforms.uRimColor = { value: options.rim.color };
      shader.uniforms.uRimStrength = { value: options.rim.strength };
      shader.uniforms.uRimPower = { value: options.rim.power };
    }

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHeroObjectPosition;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvHeroObjectPosition = position;",
      );

    let emissive = "";
    if (options.veins) {
      emissive += /* glsl */ `
        vec3 q = vHeroObjectPosition * uVeinScale;
        float n = heroNoise(q + vec3(0.0, uTime * 0.06, 0.0)) * 0.65
                + heroNoise(q * 2.3 - vec3(uTime * 0.04)) * 0.35;
        float crack = 1.0 - smoothstep(0.0, 0.012, abs(n - 0.5));
        float flow = 0.35 + 0.65 * heroNoise(vHeroObjectPosition * 1.3 + vec3(uTime * 0.25));
        // Only a few regions crack open; most of the core stays dark rock.
        crack *= smoothstep(0.42, 0.66, heroNoise(vHeroObjectPosition * 0.85 + vec3(4.0, 1.0, 2.0)));
        totalEmissiveRadiance += uVeinColor * crack * flow * uVeinStrength * uEnergy;
      `;
    }
    if (options.rim) {
      emissive += /* glsl */ `
        float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
        totalEmissiveRadiance += uRimColor * pow(1.0 - facing, uRimPower) * uRimStrength * uEnergy;
      `;
    }

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vHeroObjectPosition;
        uniform float uTime;
        uniform float uEnergy;
        ${options.veins ? "uniform vec3 uVeinColor; uniform float uVeinStrength; uniform float uVeinScale;" : ""}
        ${options.rim ? "uniform vec3 uRimColor; uniform float uRimStrength; uniform float uRimPower;" : ""}
        ${NOISE_GLSL}`,
      )
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${emissive}`);
  };
}

/** Dark, glossy, faintly rocky core with flowing red cracks. */
export function createCoreMaterial(envMap: Texture, uniforms: EnergyUniforms) {
  const material = new MeshPhysicalMaterial({
    color: "#040101",
    metalness: 0.35,
    roughness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMap,
    envMapIntensity: 0.28,
  });
  addEnergy(material, uniforms, {
    veins: { color: PALETTE.luminous.clone().multiplyScalar(3), strength: 1, scale: 3.1 },
    rim: { color: PALETTE.crimson.clone(), strength: 0.55, power: 5 },
  });
  return material;
}

/** Polished crimson metal shells with luminous red edges. */
export function createShellMaterial(envMap: Texture, uniforms: EnergyUniforms) {
  const material = new MeshPhysicalMaterial({
    color: "#b30000",
    metalness: 1,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 2.2,
    emissive: "#300000",
    side: DoubleSide,
  });
  addEnergy(material, uniforms, {
    rim: { color: PALETTE.luminous.clone().multiplyScalar(1.6), strength: 1, power: 3.5 },
  });
  return material;
}

/**
 * Additive hairline light along a trail. Varying intensity along its length plus
 * a bright pulse travelling around it: energy in motion, not a static ring.
 * Not tone mapped, so the reds stay saturated instead of shifting to orange.
 */
export function createTrailMaterial(
  uniforms: EnergyUniforms,
  { speed, intensity, phase }: { speed: number; intensity: number; phase: number },
) {
  return new ShaderMaterial({
    uniforms: {
      uTime: uniforms.uTime,
      uEnergy: uniforms.uEnergy,
      uColor: { value: PALETTE.luminous.clone() },
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uPhase: { value: phase },
    },
    vertexShader: /* glsl */ `
      varying float vAlong;
      void main() {
        vAlong = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime, uEnergy, uSpeed, uIntensity, uPhase;
      varying float vAlong;
      void main() {
        float tau = 6.2831853;
        // Uneven brightness along the path: some stretches glow, others nearly vanish.
        float base = 0.7 + 1.3 * pow(0.5 + 0.5 * sin((vAlong + uPhase) * tau * 2.0), 2.0);
        // A travelling pulse with a long fading tail.
        float head = fract(vAlong - uTime * uSpeed + uPhase);
        float pulse = pow(head, 10.0) * 3.0;
        float a = (base + pulse) * uIntensity * uEnergy;
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Soft red haze behind the sculpture (a cheap stand-in for bloom). */
export function createHaloMaterial(uniforms: EnergyUniforms) {
  return new ShaderMaterial({
    uniforms: {
      uEnergy: uniforms.uEnergy,
      uColor: { value: PALETTE.deep.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uEnergy;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float glow = pow(1.0 - smoothstep(0.0, 1.0, r), 2.4);
        gl_FragColor = vec4(uColor * glow * 0.55 * uEnergy, 1.0);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Tiny round sparks that slowly brighten and fade. */
export function createSparkMaterial(uniforms: EnergyUniforms, pixelRatio: number) {
  return new ShaderMaterial({
    uniforms: {
      uTime: uniforms.uTime,
      uEnergy: uniforms.uEnergy,
      uColor: { value: PALETTE.luminous.clone() },
      uSize: { value: 5 * pixelRatio },
    },
    vertexShader: /* glsl */ `
      attribute float phase;
      uniform float uTime, uSize;
      varying float vTwinkle;
      void main() {
        vTwinkle = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * 0.7 + phase * 6.2831853), 3.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.6 + phase);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uEnergy;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = pow(1.0 - smoothstep(0.0, 1.0, d), 3.0) * vTwinkle * uEnergy;
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}
