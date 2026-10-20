import { QUALITY_TIERS, type QualityTier } from "@/lib/device";

export interface QualitySettings {
  /** Upper DPR bound; the device ratio is used when lower. */
  maxDpr: number;
  /** Fixed when the renderer is created; a tier change does not re-create the context. */
  antialias: boolean;
}

/** Scenes read these instead of probing the device themselves. */
export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: { maxDpr: 1, antialias: false },
  medium: { maxDpr: 1.5, antialias: true },
  high: { maxDpr: 2, antialias: true },
};

/** Moves one tier down (-1) or up (+1), never above the device ceiling `max`. */
export function stepTier(current: QualityTier, max: QualityTier, direction: -1 | 1): QualityTier {
  const index = QUALITY_TIERS.indexOf(current) + direction;
  const ceiling = QUALITY_TIERS.indexOf(max);
  return QUALITY_TIERS[Math.max(0, Math.min(index, ceiling))] ?? current;
}
