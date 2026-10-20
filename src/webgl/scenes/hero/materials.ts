import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  ShaderMaterial,
  type Texture,
  Vector4,
} from "three";

/**
 * Materials for the hero sculpture: physically based glossy surfaces reflecting
 * the red environment, plus small shader additions injected into the standard
 * program (so lighting, reflections and tone mapping stay three.js's own):
 *
 *   veins   – an object-space network of flowing luminous filaments on the core
 *   impacts – click/tap flash + an energy ripple spreading over the surface
 *   rim     – red fresnel glow at grazing angles
 *
 * All materials share one uniform object; the scene updates it once per frame.
 */

export const PALETTE = {
  luminous: new Color("#ff1a1a"),
  crimson: new Color("#e00000"),
  deep: new Color("#900000"),
  shadow: new Color("#450000"),
  black: new Color("#050505"),
} as const;

/** Simultaneous impacts kept alive (older ones are overwritten). */
export const MAX_IMPACTS = 3;

/**
 * The few knobs that shape the vein network. Object-space units (core radius ≈ 1).
 */
export const VEIN_PARAMS = {
  /** Channel density: higher = more, smaller channels. */
  scale: 2.7,
  /** Line half-width range (in noise units): thin filaments to broad channels. */
  widthMin: 0.006,
  widthMax: 0.019,
  /** Strength of the domain warp that makes lines twist, branch and reconnect. */
  warp: 0.6,
  /** Flow speed of the pattern and of the brightness pulses. */
  flow: 0.18,
  /** Overall vein brightness and hotspot strength. */
  intensity: 2.9,
  hotspots: 7,
  /** Ripple: propagation speed (units/s), ring width, lifetime (s). */
  rippleSpeed: 2.6,
  rippleWidth: 0.2,
  impactLife: 1.1,
} as const;

export interface EnergyUniforms {
  /** Flow time: drives ambient motion of the pattern; frozen with reduced motion. */
  uTime: { value: number };
  /** Real clock: impacts and sparks are timed against it (never frozen). */
  uClock: { value: number };
  /** 0+ overall energy (scroll rig, impact boost). */
  uEnergy: { value: number };
  /** xyz = impact point (sculpture space), w = start clock (-1000 = unused). */
  uImpacts: { value: Vector4[] };
  /** 1 = impacts ripple and travel; 0 = a static highlight only (reduced motion). */
  uImpactMotion: { value: number };
}

export function createEnergyUniforms(): EnergyUniforms {
  return {
    uTime: { value: 0 },
    uClock: { value: 0 },
    uEnergy: { value: 1 },
    uImpacts: { value: Array.from({ length: MAX_IMPACTS }, () => new Vector4(0, 0, 0, -1000)) },
    uImpactMotion: { value: 1 },
  };
}

/** Per-frame update of the shared uniforms (three.js uniforms are mutable by design). */
export function updateEnergyUniforms(
  uniforms: EnergyUniforms,
  frame: { time: number; clock: number; energy: number; impactMotion: boolean },
) {
  uniforms.uTime.value = frame.time;
  uniforms.uClock.value = frame.clock;
  uniforms.uEnergy.value = frame.energy;
  uniforms.uImpactMotion.value = frame.impactMotion ? 1 : 0;
}

/** Records an impact in the ring buffer; returns the slot used. */
export function recordImpact(
  uniforms: EnergyUniforms,
  slot: number,
  point: { x: number; y: number; z: number },
  clock: number,
) {
  const index = slot % MAX_IMPACTS;
  uniforms.uImpacts.value[index]!.set(point.x, point.y, point.z, clock);
  return index;
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

/**
 * Impact field at an object-space position: a short flash at the contact point
 * and a ring of energy expanding from it across the surface.
 */
const IMPACT_GLSL = /* glsl */ `
  uniform vec4 uImpacts[${MAX_IMPACTS}];
  uniform float uClock;
  uniform float uImpactMotion;
  void heroImpacts(vec3 p, out float ripple, out float flash) {
    ripple = 0.0;
    flash = 0.0;
    for (int i = 0; i < ${MAX_IMPACTS}; i++) {
      vec4 impact = uImpacts[i];
      float age = uClock - impact.w;
      if (age < 0.0 || age > ${VEIN_PARAMS.impactLife.toFixed(3)}) continue;
      float life = 1.0 - age / ${VEIN_PARAMS.impactLife.toFixed(3)};
      float d = distance(p, impact.xyz);
      float front = age * ${VEIN_PARAMS.rippleSpeed.toFixed(3)} * uImpactMotion;
      float ring = exp(-pow((d - front) / ${VEIN_PARAMS.rippleWidth.toFixed(3)}, 2.0));
      // Reduced motion: no travelling ring, a static local glow that only fades.
      float still = exp(-d * d * 5.0) * 0.7;
      ripple += mix(still, ring, uImpactMotion) * life * life;
      flash += exp(-d * d * 30.0) * exp(-age * (uImpactMotion > 0.5 ? 7.0 : 4.0));
    }
  }
`;

/**
 * Vein network: iso-lines of a domain-warped noise field. Warping bends the
 * lines into twisting, branching, reconnecting channels; a second noise varies
 * their thickness; a finer layer adds filaments; slow, large-scale variation
 * keeps density uneven; rare hotspots push toward white-hot. Object space, so
 * the pattern is part of the surface and stays attached under rotation.
 */
function veinGlsl(detailed: boolean) {
  const p = VEIN_PARAMS;
  return /* glsl */ `
    float heroLine(float n, float width) {
      return 1.0 - smoothstep(0.0, width, abs(n - 0.5));
    }
    vec3 heroVeins(vec3 objectPosition, float time, out float strength) {
      vec3 q = objectPosition * ${p.scale.toFixed(3)};
      float t = time * ${p.flow.toFixed(3)};
      vec3 warp = vec3(
        heroNoise(q * 0.8 + vec3(0.0, t, 0.0)),
        heroNoise(q * 0.8 + vec3(5.2, -t, 1.3)),
        heroNoise(q * 0.8 + vec3(-3.1, 2.7, t))
      ) - 0.5;
      vec3 w = q + warp * ${(p.warp * 2).toFixed(3)};

      float width = mix(${p.widthMin.toFixed(4)}, ${p.widthMax.toFixed(4)},
                        pow(heroNoise(q * 0.6 + 11.0), 2.0));
      float n = heroNoise(w) * 0.7 + heroNoise(w * 2.1 + 3.7) * 0.3;
      // Sharp core of the channel + a wide faint halo: reads as glow without bloom.
      float channels = heroLine(n, width) + heroLine(n, width * 5.0) * 0.22;
      ${
        detailed
          ? `float filaments = heroLine(heroNoise(w * 3.3 - 6.1), width * 0.5) * 0.85;`
          : `float filaments = 0.0;`
      }

      float density = mix(0.3, 1.0, smoothstep(0.2, 0.65, heroNoise(q * 0.4 - vec3(t * 0.5) + 2.0)));
      float pulse = 0.5 + 0.5 * heroNoise(q * 1.4 + vec3(t * 4.0, -t * 2.0, t * 3.0));
      ${
        detailed
          ? `float hot = pow(heroNoise(q * 0.7 + vec3(t * 1.5, 0.0, -t)), 5.0) * ${p.hotspots.toFixed(2)};`
          : `float hot = 0.0;`
      }

      strength = (channels + filaments) * density * (0.45 + 0.75 * pulse) * (1.0 + hot);
      return vec3(1.0) * strength;
    }
  `;
}

interface EnergyOptions {
  veins?: { color: Color; detailed: boolean };
  impacts?: { color: Color; strength: number };
  rim?: { color: Color; strength: number; power: number };
}

function addEnergy(
  material: MeshPhysicalMaterial,
  uniforms: EnergyUniforms,
  options: EnergyOptions,
) {
  const key = `hero-energy:${options.veins ? (options.veins.detailed ? "V" : "v") : ""}${options.impacts ? "i" : ""}${options.rim ? "r" : ""}`;
  material.customProgramCacheKey = () => key;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    if (options.veins) shader.uniforms.uVeinColor = { value: options.veins.color };
    if (options.impacts) {
      shader.uniforms.uImpactColor = { value: options.impacts.color };
      shader.uniforms.uImpactStrength = { value: options.impacts.strength };
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

    let emissive = "float ripple = 0.0; float flash = 0.0;";
    if (options.impacts) emissive += "heroImpacts(vHeroObjectPosition, ripple, flash);";
    if (options.veins) {
      emissive += /* glsl */ `
        float veinStrength;
        heroVeins(vHeroObjectPosition, uTime, veinStrength);
        veinStrength *= 1.0 + ripple * 3.5;
        vec3 vein = uVeinColor * veinStrength * ${VEIN_PARAMS.intensity.toFixed(2)};
        // The strongest points run white-hot; everything else stays saturated red.
        float whiteHot = smoothstep(1.6, 3.2, veinStrength);
        vein += vec3(1.0, 0.55, 0.45) * whiteHot * 1.6;
        totalEmissiveRadiance += vein * uEnergy;
      `;
    }
    if (options.impacts) {
      emissive += /* glsl */ `
        totalEmissiveRadiance += uImpactColor * ripple * uImpactStrength;
        // Flash: saturated red halo with a small near-white core (pow tightens it),
        // so the falloff never passes through pink.
        totalEmissiveRadiance += vec3(1.0, 0.04, 0.02) * flash * 3.5 * uImpactStrength;
        totalEmissiveRadiance += vec3(1.0, 0.85, 0.8) * pow(flash, 6.0) * 3.0 * uImpactStrength;
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
        ${options.veins ? "uniform vec3 uVeinColor;" : ""}
        ${options.impacts ? "uniform vec3 uImpactColor; uniform float uImpactStrength;" : ""}
        ${options.rim ? "uniform vec3 uRimColor; uniform float uRimStrength; uniform float uRimPower;" : ""}
        ${NOISE_GLSL}
        ${options.impacts ? IMPACT_GLSL : ""}
        ${options.veins ? veinGlsl(options.veins.detailed) : ""}`,
      )
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${emissive}`);
  };
}

/** Deep glossy black core: the canvas for the luminous vein network. */
export function createCoreMaterial(
  envMap: Texture,
  uniforms: EnergyUniforms,
  { detailed }: { detailed: boolean },
) {
  const material = new MeshPhysicalMaterial({
    color: "#030101",
    metalness: 0.4,
    roughness: 0.36,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 0.32,
  });
  addEnergy(material, uniforms, {
    veins: { color: PALETTE.luminous.clone(), detailed },
    impacts: { color: PALETTE.luminous.clone().multiplyScalar(1.4), strength: 1 },
    rim: { color: PALETTE.crimson.clone(), strength: 0.5, power: 5 },
  });
  return material;
}

/** Refined crimson metal blades with luminous edges; they catch impact ripples too. */
export function createShellMaterial(envMap: Texture, uniforms: EnergyUniforms) {
  const material = new MeshPhysicalMaterial({
    color: "#a00000",
    metalness: 1,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 2,
    emissive: "#200000",
    side: DoubleSide,
  });
  addEnergy(material, uniforms, {
    impacts: { color: PALETTE.luminous.clone(), strength: 0.6 },
    rim: { color: PALETTE.luminous.clone().multiplyScalar(1.6), strength: 1, power: 3.5 },
  });
  return material;
}

/**
 * Additive hairline light along a trail: uneven brightness along its length
 * plus a bright pulse travelling around it. Not tone mapped, so reds stay
 * saturated instead of shifting to orange.
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
        float base = 0.7 + 1.3 * pow(0.5 + 0.5 * sin((vAlong + uPhase) * tau * 2.0), 2.0);
        float head = fract(vAlong - uTime * uSpeed + uPhase);
        float pulse = pow(head, 10.0) * 3.0;
        gl_FragColor = vec4(uColor * (base + pulse) * uIntensity * uEnergy, 1.0);
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
    uniforms: { uEnergy: uniforms.uEnergy, uColor: { value: PALETTE.deep.clone() } },
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
        // Falloff in alpha (additive: color × alpha) so the canvas stays transparent
        // where the glow ends instead of turning opaque black over the page.
        gl_FragColor = vec4(uColor * 0.55 * min(uEnergy, 1.6), glow);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Ambient sparks that slowly brighten and fade. */
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
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (0.6 + phase);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uEnergy;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float falloff = pow(1.0 - smoothstep(0.0, 1.0, d), 3.0);
        gl_FragColor = vec4(uColor * vTwinkle * min(uEnergy, 1.4), falloff);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/**
 * Impact spark burst: a fixed pool of points, each with origin, velocity, start
 * clock and seed. Motion (drag-decelerated flight), fading and shrinking are all
 * computed in the vertex shader; the CPU only rewrites a few slots per impact.
 */
export function createBurstMaterial(uniforms: EnergyUniforms, pixelRatio: number) {
  return new ShaderMaterial({
    uniforms: {
      uClock: uniforms.uClock,
      uColor: { value: PALETTE.luminous.clone() },
      uSize: { value: 10 * pixelRatio },
      uLife: { value: 0.75 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOrigin;
      attribute vec3 aVelocity;
      attribute float aStart;
      attribute float aSeed;
      uniform float uClock, uSize, uLife;
      varying float vLife;
      void main() {
        float age = uClock - aStart;
        float life = uLife * (0.55 + 0.45 * aSeed);
        float k = clamp(age / life, 0.0, 1.0);
        vLife = (age >= 0.0 && age < life) ? 1.0 - k : 0.0;
        // Exponential drag: fast burst outward, then easing to a stop.
        vec3 p = aOrigin + aVelocity * (1.0 - exp(-age * 4.0)) / 4.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = vLife > 0.0 ? uSize * (0.45 + 0.55 * aSeed) * (0.4 + 0.6 * vLife) : 0.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vLife;
      void main() {
        if (vLife <= 0.0) discard;
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float falloff = pow(1.0 - smoothstep(0.0, 1.0, d), 2.5);
        // Young sparks burn white-hot, then cool to red.
        vec3 color = mix(uColor * 1.6, vec3(1.0, 0.9, 0.86) * 2.0, pow(vLife, 4.0) * 0.7);
        gl_FragColor = vec4(color * vLife, falloff);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}
