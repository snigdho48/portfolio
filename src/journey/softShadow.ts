import * as THREE from "three";

let tex: THREE.CanvasTexture | null = null;

/** Shared soft black radial blob used as a cheap "contact shadow" (never disposed: one tiny texture for the session). */
export function getSoftShadowTex(): THREE.CanvasTexture {
  if (tex) return tex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(0,0,0,0.85)");
    r.addColorStop(0.5, "rgba(0,0,0,0.35)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
