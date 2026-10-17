/**
 * Mutually exclusive station ranges (progress 0-1), centred on the HTML
 * section centres (0, .2, .4 ... 1). Soft fade only at the edges *inside*
 * each range - never overlap.
 */
export const STATION_RANGE = {
  hero: [0, 0.1] as const,
  work: [0.1, 0.3] as const,
  experience: [0.3, 0.5] as const,
  skills: [0.5, 0.7] as const,
  about: [0.7, 0.9] as const,
  contact: [0.9, 1.001] as const,
} as const;

export type StationKey = keyof typeof STATION_RANGE;

export const STATION_PEAK: Record<StationKey, number> = {
  hero: 0,
  work: 0.2,
  experience: 0.4,
  skills: 0.6,
  about: 0.8,
  contact: 1,
};

/** Soft edge width inside each exclusive range. */
const EDGE = 0.035;

/**
 * 0 outside the station's exclusive range, 1 in the core.
 * Callers MUST set `visible = active > 0.001`.
 */
export function stationActive(progress: number, key: StationKey): number {
  const [a, b] = STATION_RANGE[key];
  if (progress < a || progress >= b) return 0;

  const into = progress - a;
  const outOf = b - progress;

  const edgeIn = a <= 0 ? 1 : Math.min(1, into / EDGE);
  const edgeOut = b >= 1 ? 1 : Math.min(1, outOf / EDGE);
  return Math.min(edgeIn, edgeOut);
}