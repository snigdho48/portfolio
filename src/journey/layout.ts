import * as THREE from "three";

/** Shared layout maths: every station is composed in station-local space. */
export const FOV = 45;
export const TAN_HALF = Math.tan((FOV * Math.PI) / 360);
/** Aspect the scenes are authored for (1440x900). */
export const REF_ASPECT = 1.6;

export const TEAL = "#1fe3c2";
export const TEAL_DEEP = "#0d8f86";
export const CYAN = "#22d3ee";
export const TEAL_LIGHT = "#8ff5e6";

/** Station origins along -Z; far plane is 80 so only one is ever in range. */
export const STATION_Z = {
  hero: 0,
  work: -40,
  experience: -80,
  skills: -120,
  about: -160,
  contact: -200,
} as const;

export const halfH = (d: number) => d * TAN_HALF;
export const halfW = (d: number) => d * TAN_HALF * REF_ASPECT;

/** NDC (-1..1) on a plane `d` in front of the station camera -> local xy. */
export function ndcXY(nx: number, ny: number, d: number): [number, number] {
  return [nx * halfW(d), ny * halfH(d)];
}

export function ndcToLocal(nx: number, ny: number, d: number, out = new THREE.Vector3()) {
  return out.set(nx * halfW(d), ny * halfH(d), -d);
}

/** Skills sun position (NDC at depth SUN_D): right half of the frame, like the reference. */
export const SUN_NDC: [number, number] = [0.35, 0.15];
export const SUN_D = 12;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};