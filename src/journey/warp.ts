/**
 * Pure (three-free) timeline for the Experience -> Skills warp.
 * Driven by the smoothed journey progress p (0..1) around the Experience/Skills boundary (0.5):
 *
 *  0.42-0.50  camera dollies into the light (the Present ball), fov narrows        (a: 0 -> 1)
 *  0.44-0.485 white-teal iris grows to fill the screen; 0.485-0.515 full white
 *  0.50       hop under the bloom: Experience fades out, Skills fades in, camera starts at the sun
 *  0.515-0.56 iris shrinks back onto the sun
 *  0.50-0.585 camera pulls back / fov settles, the sun emerges and the system expands  (b: 0 -> 1)
 *
 * Everything is a function of p, so scrolling back rewinds the whole shot.
 */
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  const t = c01(x);
  return t * t * (3 - 2 * t);
};

export const WARP_START = 0.42;
export const WARP_HOP = 0.5;
export const WARP_END = 0.6;

export type Warp = {
  active: boolean;
  /** 0..1 push-in toward the Experience light. */
  a: number;
  /** 0..1 pull-back from the sun. */
  b: number;
  /** 0..1 iris / bloom amount. */
  flash: number;
  /** 0..1 sun emergence and orbit expansion. */
  emerge: number;
};

export function warpAt(p: number): Warp {
  return {
    active: p > WARP_START && p < WARP_END,
    a: sm((p - WARP_START) / 0.08),
    b: c01((p - WARP_HOP) / 0.085),
    flash: sm((p - 0.44) / 0.048) * (1 - sm((p - 0.508) / 0.047)),
    emerge: sm((p - WARP_HOP) / 0.09),
  };
}