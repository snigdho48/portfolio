import * as THREE from "three";
import { projects } from "@/data/portfolio";
import { STATION_Z, ndcToLocal, halfH, halfW, smooth } from "./layout";

/**
 * Seven panels on a curved path receding to the back-left.
 * Authored in screen space (NDC at depth d) so the front panel reads
 * ~48% of a 1440x900 viewport and the chain stays right of the copy column.
 */
export const PANEL_W = 4.4;
export const PANEL_H = 2.75;

const DEPTH = [7, 9.2, 11.6, 14.4, 17.6, 21, 25];
const NX = [0.4, 0.17, 0.02, -0.07, -0.13, -0.18, -0.22];
const NY = [-0.1, 0.0, 0.08, 0.15, 0.2, 0.24, 0.27];
const ROTY = [-0.24, -0.21, -0.18, -0.15, -0.12, -0.09, -0.06];
export const BRIGHT = [1, 0.74, 0.55, 0.42, 0.33, 0.26, 0.2];

/** Real screenshots first so the nearest panels are always real captures. */
export function ordered() {
  return [...projects].sort(
    (a, b) =>
      Number(!!a.screenshots[0]?.isPlaceholder) -
      Number(!!b.screenshots[0]?.isPlaceholder),
  );
}

export type WorkPanelDatum = {
  slug: string;
  title: string;
  coverSrc: string;
  coverFramed: boolean;
  isPlaceholder: boolean;
  /** Station-local position. */
  position: THREE.Vector3;
  /** World-space (for fly-to). */
  flyPosition: THREE.Vector3;
  lookAt: THREE.Vector3;
  width: number;
  height: number;
  rotY: number;
  bright: number;
  index: number;
};

export function getWorkPanelData(): WorkPanelDatum[] {
  const list = ordered();
  return list.map((project, i) => {
    const k = Math.min(i, DEPTH.length - 1);
    const position = ndcToLocal(NX[k], NY[k], DEPTH[k]);
    const front = ndcToLocal(NX[0], NY[0], DEPTH[0]);
    const rotY = ROTY[k];
    const world = front.clone().add(new THREE.Vector3(0, 0, STATION_Z.work));
    const normal = new THREE.Vector3(Math.sin(ROTY[0]), 0, Math.cos(ROTY[0]));
    const cover = project.screenshots[0];
    return {
      slug: project.slug,
      title: project.title,
      coverSrc: cover?.src ?? `/projects/placeholders/${project.slug}-1.svg`,
      coverFramed: !!cover?.framed,
      isPlaceholder: cover?.isPlaceholder ?? true,
      position,
      flyPosition: world.clone().add(normal.multiplyScalar(4.4)),
      lookAt: world,
      width: PANEL_W,
      height: PANEL_H,
      rotY,
      bright: BRIGHT[k],
      index: i,
    };
  });
}

/** Ribbon path (NDC, depth) from back-left to front-bottom-right. */
export function createRibbonCurve(): THREE.CatmullRomCurve3 {
  const pts: Array<[number, number, number]> = [
    [-0.5, 0.02, 34],
    [-0.28, -0.1, 22],
    [-0.02, -0.3, 14],
    [0.28, -0.52, 9.6],
    [0.6, -0.7, 7.2],
    [0.8, -0.72, 6.0],
  ];
  return new THREE.CatmullRomCurve3(
    pts.map(([x, y, d]) => ndcToLocal(x, y, d)),
    false,
    "catmullrom",
    0.5,
  );
}
export type PanelPose = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  bright: number;
  /** 0 hidden .. 1 fully visible */
  fade: number;
  /** 1 when this panel is the active (front) one */
  front: number;
  scale: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Pose of a panel at queue offset s = index - activeIndex (continuous).
 * s = 0 front, s > 0 queued behind along the curved path, s < 0 exiting.
 * Writes into `o` (no allocation).
 */
export function panelPose(s: number, o: PanelPose): PanelPose {
  const last = DEPTH.length - 1;
  let nx: number;
  let ny: number;
  let d: number;
  if (s <= -1) {
    o.fade = 0;
    o.front = 0;
    return o;
  }
  if (s < 0) {
    const t = -s;
    const e = smooth(t);
    nx = lerp(NX[0], 1.25, e);
    ny = lerp(NY[0], 0.34, e);
    d = lerp(DEPTH[0], 5.2, e);
    o.rotY = lerp(ROTY[0], -0.62, e);
    o.bright = 1;
    o.fade = 1 - smooth((t - 0.1) / 0.8);
    o.front = 1 - t;
    o.scale = 1 - 0.08 * e;
  } else {
    const u = Math.min(s, last);
    const k = Math.floor(u);
    const k2 = Math.min(last, k + 1);
    const e = smooth(u - k);
    nx = lerp(NX[k], NX[k2], e);
    ny = lerp(NY[k], NY[k2], e);
    d = lerp(DEPTH[k], DEPTH[k2], e);
    o.rotY = lerp(ROTY[k], ROTY[k2], e);
    o.bright = lerp(BRIGHT[k], BRIGHT[k2], e);
    o.fade = Math.min(s > last ? Math.max(0, 1 - (s - last)) : 1, 1 - 0.75 * Math.min(1, Math.max(0, (s - 3.5) / 3)));
    o.front = Math.max(0, 1 - s);
    o.scale = 1 - 0.06 * Math.min(u, 6);
  }
  o.x = nx * halfW(d);
  o.y = ny * halfH(d);
  o.z = -d;
  return o;
}