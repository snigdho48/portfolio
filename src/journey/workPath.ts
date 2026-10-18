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

const DEPTH = [8, 10.2, 12.6, 15.4, 18.6, 22, 26, 30.5];
export const BRIGHT = [1, 0.74, 0.55, 0.45, 0.38, 0.32, 0.28, 0.25];

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
    pathAt(DEPTH[k], _p);
    const position = ndcToLocal(_p.nx, _p.ny, DEPTH[k]);
    const rotY = _p.rotY;
    pathAt(DEPTH[0], _p);
    const front = ndcToLocal(_p.nx, _p.ny, DEPTH[0]);
    const rot0 = _p.rotY;
    const world = front.clone().add(new THREE.Vector3(0, 0, STATION_Z.work));
    const normal = new THREE.Vector3(Math.sin(rot0), 0, Math.cos(rot0));
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

/**
 * The winding light path (the Round-14 curve, shifted up/left so the front panel sits mid-frame), as NDC + depth:
 * from far back-left it swoops down and across to the front-right. The ends are extended well past both screen
 * edges (and the wider dive field of view). The panels are positioned ON this curve.
 */
const PATH_DX = -0.05;
const PATH_DY = 0.4;
const PATH_NDC: Array<[number, number, number]> = [
  [-3.5, 0.35, 80],
  [-2.2, 0.3, 60],
  [-1.0, 0.2, 44],
  [-0.5, 0.02, 34],
  [-0.28, -0.1, 22],
  [-0.02, -0.3, 14],
  [0.28, -0.52, 9.6],
  [0.6, -0.7, 7.2],
  [0.8, -0.72, 6.0],
  [1.3, -0.76, 5.4],
  [2.2, -0.8, 4.8],
  [3.5, -0.82, 4.2],
].map(([x, y, d]) => [x + PATH_DX, y + PATH_DY, d] as [number, number, number]);

export function createRibbonCurve(): THREE.CatmullRomCurve3 {
  // pushed ~0.9 units behind the panels along each view ray (same screen position) so the panels hide it
  return new THREE.CatmullRomCurve3(
    PATH_NDC.map(([x, y, d]) => ndcToLocal(x, y, d).multiplyScalar((d + 0.9) / d).setZ(-(d + 0.9))),
    false,
    "centripetal",
  );
}

/** Lookup table of the path in (ndc x, ndc y, depth), depth strictly decreasing along it. */
const TBL = 600;
let tx: Float32Array | null = null;
let ty: Float32Array;
let td: Float32Array;
function ensureTable() {
  if (tx) return;
  const c = new THREE.CatmullRomCurve3(PATH_NDC.map(([x, y, d]) => new THREE.Vector3(x, y, d)), false, "centripetal");
  tx = new Float32Array(TBL + 1);
  ty = new Float32Array(TBL + 1);
  td = new Float32Array(TBL + 1);
  const v = new THREE.Vector3();
  let last = Infinity;
  for (let i = 0; i <= TBL; i++) {
    c.getPoint(i / TBL, v);
    // keep depth monotone (guards against tiny overshoot)
    const d = Math.min(v.z, last - 1e-4);
    last = d;
    tx[i] = v.x;
    ty[i] = v.y;
    td[i] = d;
  }
}
function lookup(d: number, out: number[]) {
  ensureTable();
  const dd = Math.min(td[0] - 0.01, Math.max(td[TBL] + 0.01, d));
  let lo = 0;
  let hi = TBL;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (td[m] > dd) lo = m;
    else hi = m;
  }
  const f = (td[lo] - dd) / Math.max(1e-6, td[lo] - td[hi]);
  out[0] = tx![lo] + (tx![hi] - tx![lo]) * f;
  out[1] = ty[lo] + (ty[hi] - ty[lo]) * f;
}
const _a = [0, 0];
const _b = [0, 0];
/** Panel centre (NDC) on the path at depth d, and the yaw that follows the path tangent (subtle). */
export function pathAt(d: number, out: { nx: number; ny: number; rotY: number }) {
  lookup(d, _a);
  lookup(d - 0.6, _b);
  out.nx = _a[0];
  out.ny = _a[1];
  const dx = _b[0] * halfW(d - 0.6) - _a[0] * halfW(d);
  const ang = Math.atan2(dx, 0.6);
  out.rotY = -0.35 * Math.min(1.2, Math.max(0, ang));
  return out;
}
const _p = { nx: 0, ny: 0, rotY: 0 };
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
  let d: number;
  if (s <= -1) {
    o.fade = 0;
    o.front = 0;
    return o;
  }
  if (s < 0) {
    // leaving: keep following the path toward the front-right, past the screen edge
    const t = -s;
    const e = smooth(t);
    d = lerp(DEPTH[0], 4.6, e);
    pathAt(d, _p);
    o.rotY = _p.rotY - 0.25 * e;
    o.bright = 1;
    o.fade = 1 - smooth((t - 0.1) / 0.8);
    o.front = 1 - t;
    o.scale = 1 - 0.08 * e;
  } else {
    const u = Math.min(s, last);
    const k = Math.floor(u);
    const k2 = Math.min(last, k + 1);
    const e = smooth(u - k);
    d = lerp(DEPTH[k], DEPTH[k2], e);
    pathAt(d, _p);
    o.rotY = _p.rotY;
    o.bright = lerp(BRIGHT[k], BRIGHT[k2], e);
    // queued panels never disappear: they stay visible (smaller, dimmer) stacked far back along the path
    o.fade = 1 - 0.5 * Math.min(1, Math.max(0, (s - 3) / 4));
    o.front = Math.max(0, 1 - s);
    o.scale = 1 - 0.06 * Math.min(u, 7);
  }
  const nx = _p.nx;
  const ny = _p.ny;
  o.x = nx * halfW(d);
  o.y = ny * halfH(d);
  o.z = -d;
  return o;
}