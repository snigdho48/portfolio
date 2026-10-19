import { REF_ASPECT, SUN_NDC, SUN_D, halfH, halfW, clamp01 } from "./layout";
import { pathAt } from "./workPath";
import type { StationKey } from "./stationVisibility";

/** Narrowest aspect the portrait tuning is authored for (390x844 ~ 0.46). */
const MIN_ASPECT = 0.46;

/** 0 on landscape/desktop, 1 on a tall phone. */
export const portraitAmount = (aspect: number) => clamp01((REF_ASPECT - aspect) / (REF_ASPECT - MIN_ASPECT));

/**
 * Uniform scale for a station's 3D content. Landscape = 1. In portrait the old behaviour
 * (aspect / REF) shrank every scene into a thin middle strip, so we keep more of it.
 */
export const fitK = (aspect: number) => (aspect >= REF_ASPECT ? 1 : Math.pow(aspect / REF_ASPECT, 0.5));

/** fitK with a per-station trim (the Work chain and the Skills system read better a little smaller on a phone). */
export function stationScale(id: StationKey, aspect: number) {
  const k = fitK(aspect);
  const p = portraitAmount(aspect);
  if (id === "work") return k * (1 - 0.2 * p);
  if (id === "skills") return k * (1 - 0.34 * p);
  return k;
}

const _w = { nx: 0, ny: 0, rotY: 0 };

/**
 * Portrait-only offset (world units, applied to the station group) that recentres the scene in the
 * free area above the bottom text card. Returns [0,0] for landscape.
 */
export function stationShift(id: StationKey, aspect: number, out: [number, number] = [0, 0]): [number, number] {
  const p = portraitAmount(aspect);
  out[0] = 0;
  out[1] = 0;
  if (p <= 0) return out;
  const k = stationScale(id, aspect);
  switch (id) {
    case "hero":
      out[1] = 3.4 * p;
      break;
    case "work": {
      pathAt(8, _w);
      out[0] = -_w.nx * halfW(8) * k * p;
      out[1] = (0.13 - _w.ny * k) * halfH(8) * p;
      break;
    }
    case "skills": {
      out[0] = -SUN_NDC[0] * halfW(SUN_D) * k * p;
      out[1] = (-0.07 - SUN_NDC[1] * k) * halfH(SUN_D) * p;
      break;
    }
    case "about":
      out[1] = 0.8 * p;
      break;
    default:
      break;
  }
  return out;
}
