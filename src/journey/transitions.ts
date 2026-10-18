/**
 * Pure (three-free) timelines for the section-entry transitions, all functions of the smoothed
 * journey progress p (station k is centred at p = 0.2 k; hand-offs at 0.1, 0.3, 0.5, 0.7, 0.9).
 * Everything is reversible because it is a pure function of p.
 *
 *  Hero -> Work         0.00-0.09 wordmark parts, 0.05-0.15 light streak + camera dive, 0.10-0.17 panels fan in
 *  Work -> Experience   0.256-0.278 panels flip edge-on, 0.272-0.302 shards drawn into the ball,
 *                       0.27-0.30 iris closes onto the ball, 0.30-0.345 iris opens on the Experience path
 *  Experience -> Skills (Round 14 warp, warp.ts)
 *  Skills -> About      0.64-0.70 planets spiral in and condense, 0.70-0.78 dawn gradient reveal
 *  About -> Contact     0.865-0.90 shutter closes with a sweep of light, 0.90-0.935 it opens, 0.90-0.97 rings expand
 */
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  const t = c01(x);
  return t * t * (3 - 2 * t);
};

/** 0..1 hero wordmark parting. */
export const heroSplit = (p: number) => sm(p / 0.09);
/** Bell around 0.1: streak and camera dive. */
export const hwBell = (p: number) => sm((p - 0.05) / 0.05) * (1 - sm((p - 0.1) / 0.05));
/** 0..1 panels flying in from depth after the hand-off. */
export const hwFan = (p: number) => sm((p - 0.1) / 0.075);
/** 0..1 front panel flips edge-on. */
export const weFlip = (p: number) => sm((p - 0.256) / 0.022);
/** 0..1 shards drawn into the ball. */
export const weShard = (p: number) => sm((p - 0.272) / 0.03);
/** Iris openness: 1 = fully open, IRIS_MIN = a porthole around the ball. */
export const IRIS_MIN = 0.1;
export const weIris = (p: number) => {
  const a = p < 0.3 ? 1 - sm((p - 0.27) / 0.03) : sm((p - 0.3) / 0.045);
  return IRIS_MIN + (1 - IRIS_MIN) * a;
};
export const weActive = (p: number) => p > 0.25 && p < 0.35;
/** 0..1 planets condense into a single point. */
export const saCollapse = (p: number) => sm((p - 0.64) / 0.06);
/** 1 -> 0 dawn gradient cover. */
export const saDawn = (p: number) => (p < 0.7 ? 0 : 1 - sm((p - 0.7) / 0.08));
/** 0..1..0 shutter cover. */
export const acShutter = (p: number) => (p < 0.9 ? sm((p - 0.865) / 0.035) : 1 - sm((p - 0.9) / 0.035));
/** 0..1 contact rings expanding from the centre. */
export const acRings = (p: number) => sm((p - 0.9) / 0.07);