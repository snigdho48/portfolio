import * as THREE from "three";
import { mulberry32 } from "./rng";

/** Procedural canvas textures for the Work station (cached, tiny). */

let vig: THREE.CanvasTexture | null = null;
/** Panel overlay: darker towards the edges (inner vignette) + a thin glass highlight on the top edge. */
export function getPanelVignette(): THREE.CanvasTexture {
  if (vig) return vig;
  const W = 512;
  const H = 320;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(1, H / W);
  const g = ctx.createRadialGradient(0, 0, W * 0.3, 0, 0, W * 0.62);
  g.addColorStop(0, "rgba(2,8,10,0)");
  g.addColorStop(0.65, "rgba(2,8,10,0.16)");
  g.addColorStop(1, "rgba(2,8,10,0.62)");
  ctx.fillStyle = g;
  ctx.fillRect(-W, -W, W * 2, W * 2);
  ctx.restore();
  // glass highlight along the top edge
  const t = ctx.createLinearGradient(0, 0, 0, 34);
  t.addColorStop(0, "rgba(220,255,250,0.30)");
  t.addColorStop(1, "rgba(220,255,250,0)");
  ctx.fillStyle = t;
  ctx.fillRect(0, 0, W, 34);
  // faint diagonal sheen
  const s = ctx.createLinearGradient(0, 0, W, H);
  s.addColorStop(0, "rgba(255,255,255,0.07)");
  s.addColorStop(0.35, "rgba(255,255,255,0)");
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, W, H);
  vig = new THREE.CanvasTexture(c);
  vig.colorSpace = THREE.SRGBColorSpace;
  return vig;
}

const clouds: THREE.CanvasTexture[] = [];
/** Soft, noisy cloud puff (many overlapping blobs under a radial mask) for layered volumetric fog. */
export function getCloud(i: number): THREE.CanvasTexture {
  const k = i % 3;
  if (clouds[k]) return clouds[k];
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const r = mulberry32(900 + k * 37);
  for (let n = 0; n < 70; n++) {
    const x = S * (0.15 + 0.7 * r());
    const y = S * (0.2 + 0.6 * r());
    const rad = S * (0.06 + 0.2 * r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.05 + 0.1 * r();
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  ctx.globalCompositeOperation = "destination-in";
  const m = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  m.addColorStop(0, "rgba(0,0,0,1)");
  m.addColorStop(0.55, "rgba(0,0,0,0.7)");
  m.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = m;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  clouds[k] = t;
  return t;
}

let beam: THREE.CanvasTexture | null = null;
/** Light cone: narrow at the top, widening and fading downwards. */
export function getBeam(): THREE.CanvasTexture {
  if (beam) return beam;
  const W = 128;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < H; y++) {
    const u = y / (H - 1);
    const half = W * (0.12 + 0.38 * u);
    const a = Math.pow(1 - u, 1.4) * 0.95;
    const g = ctx.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - half, y, half * 2, 1);
  }
  beam = new THREE.CanvasTexture(c);
  beam.colorSpace = THREE.SRGBColorSpace;
  return beam;
}