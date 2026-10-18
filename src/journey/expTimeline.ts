/**
 * Pure (three-free) timeline for the pinned Experience journey.
 * q = pin progress 0..1. Ball, camera, ribbon and text are all functions of q,
 * so scrolling back rewinds everything.
 *
 *  0.00-0.07  ball falls from above onto the start of the path (impact 0.07-0.15)
 *  0.07-0.18  ball rolls to the 2018 node, camera follows
 *  0.13-0.20  camera zooms in on the node   | 0.17-0.25 role 1 text assembles (RIGHT)
 *  0.25-0.33  plateau                       | 0.33-0.41 text dissolves, camera pulls back (0.34-0.42)
 *  0.34-0.55  fast travel to the 2023 node  | zoom in 0.50-0.58, role 2 text (LEFT) 0.55-0.63
 *  0.63-0.70  plateau                       | dissolve 0.70-0.77, pull back 0.71-0.79
 *  0.71-0.90  fast travel to Present        | zoom in 0.86-0.93, role 3 text (RIGHT) 0.89-0.96
 */
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  const t = c01(x);
  return t * t * (3 - 2 * t);
};
const seg = (q: number, a: number, b: number) => sm((q - a) / (b - a));
const bump = (q: number, a: number, b: number) => Math.sin(Math.PI * c01((q - a) / (b - a)));

/** Scroll position (q) where each role is fully shown; used by dots and arrow keys. */
export const EXP_PLATEAU = [0.29, 0.66, 0.985];
/** Sides the text sits on (the node is on the opposite side of the screen). */
export const EXP_SIDES: Array<"right" | "left"> = ["right", "left", "right"];

/** Ball progress 0..3: 0 = landing point, 1 = 2018 node, 2 = 2023 node, 3 = Present node. */
export function expBall(q: number): number {
  return seg(q, 0.07, 0.18) + seg(q, 0.34, 0.55) + seg(q, 0.71, 0.9);
}

/** 0 = high above the path, 1 = landed. */
export function expFall(q: number): number {
  return c01(q / 0.07);
}

/** 0 at the moment of impact, 1 when the ripple has faded. */
export function expImpact(q: number): number {
  return c01((q - 0.07) / 0.08);
}

/** Camera zoom-in weight per node (0 = follow cam, 1 = close on the node). */
export function expZoom(q: number): [number, number, number] {
  return [
    seg(q, 0.13, 0.2) * (1 - seg(q, 0.34, 0.42)),
    seg(q, 0.5, 0.58) * (1 - seg(q, 0.71, 0.79)),
    seg(q, 0.86, 0.93),
  ];
}

/** 0..1 while the ball is on a fast travel segment. */
export function expTravel(q: number): number {
  return Math.max(bump(q, 0.07, 0.18) * 0.5, bump(q, 0.34, 0.55), bump(q, 0.71, 0.9));
}

/** Visibility 0..1 of each role's text. */
export function expVis(q: number): [number, number, number] {
  return [
    seg(q, 0.17, 0.25) * (1 - seg(q, 0.33, 0.41)),
    seg(q, 0.55, 0.63) * (1 - seg(q, 0.7, 0.77)),
    seg(q, 0.89, 0.96),
  ];
}

/** Which role the counter and dots show. */
export function expIndexAt(q: number): number {
  return q < 0.46 ? 0 : q < 0.78 ? 1 : 2;
}