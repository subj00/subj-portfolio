/**
 * Device capability helpers. Deliberately free of three.js imports: these run
 * before the WebGL chunk is downloaded and decide whether it is downloaded at all.
 */

export type QualityTier = "low" | "medium" | "high";

export const QUALITY_TIERS: readonly QualityTier[] = ["low", "medium", "high"];

export interface DeviceProfile {
  coarsePointer: boolean;
  cores: number;
  /** GiB, only exposed by Chromium browsers. */
  memoryGb: number | undefined;
  saveData: boolean;
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function readDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & NavigatorHints;
  return {
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    cores: nav.hardwareConcurrency || 4,
    memoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData === true,
  };
}

/**
 * Starting tier only. The runtime performance monitor can step down from here,
 * and never steps above it.
 *
 * Touch devices start at "medium": iOS hides memory and reports few cores even on
 * fast GPUs, so core counts are only trusted on fine-pointer devices.
 */
export function initialQualityTier(profile: DeviceProfile): QualityTier {
  if (profile.saveData) return "low";
  if (profile.memoryGb !== undefined && profile.memoryGb <= 3) return "low";
  if (profile.coarsePointer) return "medium";
  if (profile.cores <= 2) return "low";
  return profile.cores >= 8 ? "high" : "medium";
}

/**
 * True when a hardware-accelerated WebGL2 context can be created. Software
 * renderers (failIfMajorPerformanceCaveat) count as unsupported, since they
 * would produce a slideshow rather than an experience.
 */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Subscribes to a media query; returns an unsubscribe function. */
export function watchMedia(query: string, onChange: (matches: boolean) => void): () => void {
  const list = window.matchMedia(query);
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  onChange(list.matches);
  list.addEventListener("change", listener);
  return () => list.removeEventListener("change", listener);
}
