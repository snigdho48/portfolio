import * as THREE from "three";

function rrPath(shape: THREE.Shape | THREE.Path, w: number, h: number, r: number, ccw = true) {
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  if (ccw) {
    shape.moveTo(x + rr, y);
    shape.lineTo(x + w - rr, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + rr);
    shape.lineTo(x + w, y + h - rr);
    shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    shape.lineTo(x + rr, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - rr);
    shape.lineTo(x, y + rr);
    shape.quadraticCurveTo(x, y, x + rr, y);
  } else {
    shape.moveTo(x + rr, y);
    shape.quadraticCurveTo(x, y, x, y + rr);
    shape.lineTo(x, y + h - rr);
    shape.quadraticCurveTo(x, y + h, x + rr, y + h);
    shape.lineTo(x + w - rr, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - rr);
    shape.lineTo(x + w, y + rr);
    shape.quadraticCurveTo(x + w, y, x + w - rr, y);
    shape.lineTo(x + rr, y);
  }
}

function withUVs(g: THREE.BufferGeometry, w: number, h: number) {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / w + 0.5;
    uv[i * 2 + 1] = p.getY(i) / h + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Rounded rectangle plane (UV 0..1 across the rect). */
export function roundedRectGeometry(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  rrPath(s, w, h, r);
  return withUVs(new THREE.ShapeGeometry(s, 10), w, h);
}

/** Rounded rectangle outline (rim light). */
export function roundedBorderGeometry(w: number, h: number, r: number, bw: number) {
  const s = new THREE.Shape();
  rrPath(s, w + bw * 2, h + bw * 2, r + bw);
  const hole = new THREE.Path();
  rrPath(hole, w, h, r, false);
  s.holes.push(hole);
  return new THREE.ShapeGeometry(s, 10);
}