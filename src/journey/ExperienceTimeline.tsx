import { useEffect, useMemo, useRef, type RefObject } from "react";
import { warpAt } from "./warp";
import { fx, expCam } from "./scrollFx";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow } from "./glow";
import { TEAL, CYAN, TEAL_LIGHT, halfW } from "./layout";
import { useJourneyProgress } from "./JourneyProgressContext";
import { stationActive } from "./stationVisibility";
import { portraitAmount } from "./portrait";
import MotionPoints from "./MotionPoints";
import { expBall, expFall, expImpact, expZoom, expTravel, EXP_SIDES } from "./expTimeline";

const _p = new THREE.Vector3();
const _v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const PULSES = 8;
const TRAIL = 4;

/**
 * Long path in station-local space (camera looks down -Z). The ribbon is a flat road
 * strip: it starts where the ball lands, then snakes forward (left, right, left)
 * with a node at each milestone. Smooth wide curves, so the ribbon never folds.
 */
const NODES: Array<[number, number, number]> = [
  [-1.6, -1.0, -17],
  [3.4, -0.6, -33],
  [-2.4, 0.0, -49],
];
const PATH: Array<[number, number, number]> = [
  [0.0, -1.2, -6],
  [0.5, -1.2, -9.5],
  [-0.6, -1.1, -13.2],
  NODES[0],
  [-0.4, -0.9, -21.5],
  [1.9, -0.8, -27],
  NODES[1],
  [2.2, -0.4, -38],
  [-0.2, -0.2, -43.5],
  NODES[2],
  [-1.6, 0.2, -55],
  [0.4, 0.5, -62],
];

/** Runway behind the landing point (extends behind the camera) and continuation past Present to the horizon. Never visible as an end. */
const PRE: Array<[number, number, number]> = [
  [0.9, -1.3, 26],
  [0.2, -1.3, 15],
  [-0.4, -1.25, 6],
  [-0.1, -1.2, -1],
];
const POST: Array<[number, number, number]> = [
  [1.4, 0.8, -69],
  [0.6, 1.0, -77],
  [-0.9, 1.2, -86],
  [-0.2, 1.3, -97],
  [1.4, 1.4, -110],
  [0.6, 1.5, -125],
  [-0.6, 1.5, -142],
];
const PATH_EXT = [...PRE, ...PATH, ...POST];
const I0 = PRE.length;
const I1 = PRE.length + PATH.length - 1;

/** Ripple sits on the ground where the ball lands. */
const LAND: [number, number, number] = PATH[0];
const FALL_H = 2.8;
const SAMPLES = 900;

type Rig = {
  curve: THREE.CatmullRomCurve3;
  /** u range covered by pts: 0 = landing point, 1 = end of the milestone path; the rest is runway / continuation. */
  u0: number;
  u1: number;
  /** Arc-length spaced samples (xyz), index / SAMPLES = ribbon u. */
  pts: Float32Array;
  nodePos: THREE.Vector3[];
  nodeU: number[];
  /** Ball stops: landing point then each node (u along the ribbon). */
  uList: number[];
};
function makeRig(): Rig {
  const curve = new THREE.CatmullRomCurve3(
    PATH_EXT.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );
  const sp = curve.getSpacedPoints(SAMPLES);
  const nearest = (v: THREE.Vector3) => {
    let best = 0;
    let bd = Infinity;
    sp.forEach((q, i) => {
      const d = q.distanceToSquared(v);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const s0 = nearest(new THREE.Vector3(...PATH_EXT[I0]));
  const s1 = nearest(new THREE.Vector3(...PATH_EXT[I1]));
  const toU = (i: number) => (i - s0) / (s1 - s0);
  const pts = new Float32Array(sp.length * 3);
  sp.forEach((p, i) => {
    pts[i * 3] = p.x;
    pts[i * 3 + 1] = p.y;
    pts[i * 3 + 2] = p.z;
  });
  const nodePos = NODES.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  let from = s0;
  const nodeU = nodePos.map((np) => {
    let best = from;
    let bd = Infinity;
    for (let i = from; i < sp.length; i++) {
      const d = sp[i].distanceToSquared(np);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    from = best;
    return toU(best);
  });
  return { curve, u0: toU(0), u1: toU(SAMPLES), pts, nodePos, nodeU, uList: [0, ...nodeU] };
}

function sample(rig: Rig, u: number, out: THREE.Vector3) {
  const x = Math.min(SAMPLES - 0.001, Math.max(0, ((u - rig.u0) / (rig.u1 - rig.u0)) * SAMPLES));
  const i = Math.floor(x);
  const f = x - i;
  const a = i * 3;
  const p = rig.pts;
  return out.set(
    p[a] + (p[a + 3] - p[a]) * f,
    p[a + 1] + (p[a + 4] - p[a + 1]) * f,
    p[a + 2] + (p[a + 5] - p[a + 2]) * f,
  );
}
const _ta = new THREE.Vector3();
const _tb = new THREE.Vector3();
function tangentAt(rig: Rig, u: number, out: THREE.Vector3) {
  sample(rig, u + 0.012, _ta);
  sample(rig, u - 0.012, _tb);
  return out.subVectors(_ta, _tb).normalize();
}

/** Mutable animation state shared by the ball, trail, ribbon, nodes and effects (no React state). */
type Live = {
  q: number;
  f: number;
  u: number;
  prevU: number;
  vel: number;
  dir: number;
  lit: number[];
  burst: number[];
  arrived: boolean[];
  ball: THREE.Vector3;
  fall: number;
  age: number;
  travel: number;
  speed: number;
  /** 0..1 push-in toward the light at the end of the journey. */
  warp: number;
};
const nowS = () => performance.now() / 1000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Smooths the pinned scroll progress, then derives ball position, node ignition and the
 * follow-cam (written to expCam, applied by CameraRig). Zoom-ins, fov and banking are
 * pure functions of progress, so scrolling back rewinds the whole shot.
 */
function Driver({ rig, live, rigRef }: { rig: Rig; live: Live; rigRef: RefObject<THREE.Group | null> }) {
  const { expTargetRef, expIndexRef, progressRef } = useJourneyProgress();
  const cam = useRef({
    init: false,
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    fov: 45,
    roll: 0,
  });
  const tmp = useMemo(
    () => ({
      path: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      tan2: new THREE.Vector3(),
      side: new THREE.Vector3(),
      fp: new THREE.Vector3(),
      fl: new THREE.Vector3(),
      np: new THREE.Vector3(),
      nl: new THREE.Vector3(),
      w: new THREE.Vector3(),
    }),
    [],
  );
  useFrame(({ size }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const pa = portraitAmount(size.width / size.height);
    expIndexRef.current += (expTargetRef.current - expIndexRef.current) * (1 - Math.exp(-dt * 6));
    const q = expIndexRef.current;
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    live.q = q;
    const f = expBall(q) - 1;
    live.f = f;
    const n = rig.nodeU.length;
    const g = Math.min(n, Math.max(0, f + 1));
    const i = Math.min(n - 1, Math.floor(g));
    const t = g - i;
    live.u = rig.uList[i] + (rig.uList[i + 1] - rig.uList[i]) * t;
    live.fall = expFall(q);
    live.age = expImpact(q);
    live.travel = expTravel(q);
    const v = dt > 0 ? (live.u - live.prevU) / dt : 0;
    live.prevU = live.u;
    live.vel += (v - live.vel) * Math.min(1, dt * 8);
    if (Math.abs(live.vel) > 0.004) live.dir += (Math.sign(live.vel) - live.dir) * Math.min(1, dt * 10);
    live.warp = warpAt(progressRef.current).a;
    live.speed += (live.travel * (0.4 + 0.6 * fx.boost) - live.speed) * Math.min(1, dt * 4);
    sample(rig, live.u, tmp.path);
    live.ball.copy(tmp.path);
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    live.ball.y += FALL_H * (1 - live.fall * live.fall);

    const now = nowS();
    for (let j = 0; j < n; j++) {
      const target = f >= j - 0.03 ? 1 : 0;
      live.lit[j] += (target - live.lit[j]) * Math.min(1, dt * 5);
      const near = Math.abs(f - j);
      if (near < 0.045 && !live.arrived[j]) {
        live.arrived[j] = true;
        live.burst[j] = now;
      } else if (near > 0.3) {
        live.arrived[j] = false;
      }
    }

    // ---- follow-cam: behind, above and slightly offset, looking ahead along the path ----
    tangentAt(rig, live.u, tmp.tan);
    tmp.side.crossVectors(tmp.tan, UP).normalize();
    tmp.fp.copy(tmp.path).addScaledVector(tmp.tan, -6.4).addScaledVector(tmp.side, 1.1);
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    tmp.fp.y += 2.6;
    tmp.fl.copy(tmp.path).addScaledVector(tmp.tan, 5.2);
    tmp.fl.y += 0.15;
    const z = expZoom(q);
    let zs = 0;
    for (let k = 0; k < 3; k++) {
      if (z[k] < 0.0005) continue;
      const side = EXP_SIDES[k] === "right" ? 1 : -1; // node sits on the opposite screen side
      const shift = side * 0.4 * halfW(5.4) * (1 - 0.85 * pa);
      tmp.np.copy(rig.nodePos[k]);
      tmp.nl.copy(tmp.np);
      tmp.np.y += 0.9;
      tmp.np.z += 5.4 - 1.7 * pa;
      tmp.nl.x += shift;
      tmp.nl.y += 0.1;
      tmp.fp.lerp(tmp.np, z[k]);
      tmp.fl.lerp(tmp.nl, z[k]);
      zs += z[k];
    }
    // banking from how much the path turns ahead
    tangentAt(rig, live.u + 0.05, tmp.tan2);
    let dAng = Math.atan2(tmp.tan2.x, -tmp.tan2.z) - Math.atan2(tmp.tan.x, -tmp.tan.z);
    if (dAng > Math.PI) dAng -= 2 * Math.PI;
    if (dAng < -Math.PI) dAng += 2 * Math.PI;
    const rollT = Math.max(-0.2, Math.min(0.2, -dAng * 1.1)) * (1 - zs);
    const fovT = 45 - 8 * zs + (6 * live.travel + 3 * fx.boost * live.travel) * (1 - zs);
    const c = cam.current;
    if (!c.init) {
      c.init = true;
      c.pos.copy(tmp.fp);
      c.look.copy(tmp.fl);
      c.fov = fovT;
      c.roll = rollT;
    } else {
      const k = 1 - Math.exp(-dt * 3.6);
      c.pos.lerp(tmp.fp, k);
      c.look.lerp(tmp.fl, k);
      c.fov += (fovT - c.fov) * k;
      c.roll += (rollT - c.roll) * k;
    }
    const grp = rigRef.current;
    if (grp) {
      tmp.w.copy(c.pos).applyMatrix4(grp.matrixWorld);
      expCam.px = tmp.w.x;
      expCam.py = tmp.w.y;
      expCam.pz = tmp.w.z;
      tmp.w.copy(c.look).applyMatrix4(grp.matrixWorld);
      expCam.lx = tmp.w.x;
      expCam.ly = tmp.w.y;
      expCam.lz = tmp.w.z;
      tmp.w.copy(rig.nodePos[2]).applyMatrix4(grp.matrixWorld);
      expCam.nx = tmp.w.x;
      expCam.ny = tmp.w.y;
      expCam.nz = tmp.w.z;
    }
    expCam.fov = c.fov;
    expCam.roll = c.roll;
    expCam.zs = zs;
    expCam.on = 1;
  });
  return null;
}

/** Small light pulses flowing along the part of the path just ahead of the ball. */
function Pulses({ rig, live }: { rig: Rig; live: Live }) {
  const update = useMemo(
    () => (t: number, pos: Float32Array) => {
      for (let j = 0; j < PULSES; j++) {
        for (let k = 0; k < TRAIL; k++) {
          const fr = (((t * 0.045 + j / PULSES - k * 0.01) % 1) + 1) % 1;
          const u = live.u + fr * 0.2 - 0.02;
          sample(rig, u, _p);
          const i = (j * TRAIL + k) * 3;
          pos[i] = _p.x;
          pos[i + 1] = _p.y + 0.06;
          pos[i + 2] = _p.z;
        }
      }
    },
    [rig, live],
  );
  return <MotionPoints count={PULSES * TRAIL} update={update} size={0.16} opacity={0.7} />;
}

/** Flat road strip along the path (side = tangent x up). uv.x = across (-1.4..1.4, band edges at +-1), uv.y = along (0..1). */
function buildRibbon(rig: Rig) {
  const curve = rig.curve;
  const N = 900;
  const K = 25;
  const EXT = 1.4;
  const W = 0.62;
  const pos: number[] = [];
  const uvs: number[] = [];
  const ctr: number[] = [];
  const idx: number[] = [];
  const side = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const v = rig.u0 + s * (rig.u1 - rig.u0);
    curve.getPointAt(s, p);
    curve.getTangentAt(s, tan);
    side.crossVectors(tan, UP).normalize();
    for (let j = 0; j < K; j++) {
      const off = (j / (K - 1)) * 2 * EXT - EXT;
      pos.push(p.x + side.x * off * W, p.y + side.y * off * W + 0.01, p.z + side.z * off * W);
      uvs.push(off, v);
      ctr.push(p.x, p.y + 0.01, p.z);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < K - 1; j++) {
      const a = i * K + j;
      const b = a + K;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("aCtr", new THREE.Float32BufferAttribute(ctr, 3));
  g.setIndex(idx);
  return g;
}

const RIB_VERT = /* glsl */ `
attribute vec3 aCtr;
uniform float uHead;
varying vec2 vUv;
varying float vDist;
void main(){
  vUv = uv;
  // width taper toward the far end so the road narrows into the horizon instead of ending flat
  float tp = smoothstep(uHead - 0.2, uHead + 0.9, uv.y);
  vec3 pp = mix(position, aCtr, tp * 0.8);
  vec4 mv = modelViewMatrix * vec4(pp, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

/**
 * Crisp band that grows forward: only the part up to uHead is drawn, with a bright
 * leading edge. Behind the ball it recedes (dimmer), and everything fades with distance (fog).
 */
const RIB_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uBall;
uniform float uHead;
varying vec2 vUv;
varying float vDist;
void main(){
  float a = abs(vUv.x);
  float s = vUv.y;
  float inside = 1.0 - smoothstep(0.975, 1.0, a);
  float body = (0.27 + 0.18 * (1.0 - a * a)) * inside;
  float edge = exp(-pow((a - 0.95) / 0.04, 2.0)) * inside;
  float glow = (1.0 - inside) * 0.16 * exp(-pow((a - 1.0) / 0.13, 2.0));
  float flow = s * 120.0 - uTime * 2.4;
  float st1 = pow(0.5 + 0.5 * sin(vUv.x * 7.5 + sin(s * 50.0 - uTime * 1.1) * 1.6 + flow * 0.35), 5.0);
  float st2 = pow(0.5 + 0.5 * sin(vUv.x * 13.0 - sin(s * 36.0 + uTime * 0.8) * 1.2 + flow * 0.6), 8.0);
  float streak = (st1 * 0.34 + st2 * 0.24) * inside * (1.0 - a * a * 0.6);
  float p = fract(s * 9.0 - uTime * 0.16);
  float packet = exp(-pow((p - 0.5) / 0.04, 2.0)) * inside * (0.32 - 0.2 * a);
  float headFade = 1.0 - smoothstep(uHead - 0.3, uHead + 0.9, s);
  float behind = mix(0.16, 1.0, smoothstep(uBall - 0.24, uBall - 0.01, s));
  float ahead = mix(1.0, 0.5, smoothstep(uBall, uHead, s));
  float fog = exp(-vDist * 0.03);
  float near = exp(-pow((s - uBall) / 0.012, 2.0)) * inside;
  vec3 teal = vec3(0.1, 0.78, 0.68);
  vec3 hot = vec3(0.72, 1.0, 0.95);
  vec3 col = teal * body + hot * (edge * 0.75 + streak * 0.8 + packet) + teal * glow * 1.3 + hot * near * 0.4;
  col *= headFade * behind * ahead * fog * smoothstep(0.4, 3.2, vDist) * 0.82;
  gl_FragColor = vec4(col, uFade);
}
`;

/** Ribbon road that grows ahead of the ball. */
function Path({ rig, live }: { rig: Rig; live: Live }) {
  const geom = useMemo(() => buildRibbon(rig), [rig]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: RIB_VERT,
        fragmentShader: RIB_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uBall: { value: 0 }, uHead: { value: 0.2 } },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    mat.uniforms.uTime.value = fx.t;
    mat.uniforms.uBall.value = live.u;
    mat.uniforms.uHead.value = live.u + 0.4 + 0.12 * live.travel;
  });
  return <mesh geometry={geom} material={mat} renderOrder={2} frustumCulled={false} />;
}

const TRAIL_N = 44;
const TRAIL_VERT = /* glsl */ `
attribute float aK;
uniform float uPx;
uniform float uLen;
varying float vK;
void main(){
  vK = aK;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float sz = mix(1.0, 0.18, pow(aK, 0.7)) * 62.0 * (0.7 + uLen * 2.0);
  gl_PointSize = clamp(sz * uPx * (5.5 / max(1.0, -mv.z)), 1.0, 90.0 * uPx);
}
`;
const TRAIL_FRAG = /* glsl */ `
uniform float uFade;
uniform float uLen;
varying float vK;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float soft = pow(1.0 - d, 1.6);
  vec3 c = mix(vec3(0.85, 1.0, 0.97), vec3(0.08, 0.7, 0.62), pow(vK, 0.6));
  float a = soft * pow(1.0 - vK, 1.5) * (0.35 + uLen * 1.6);
  gl_FragColor = vec4(c, a * uFade);
}
`;

/** Bright orb with halo and a comet-like trail: vertical while falling, along the path while rolling. */
function Ball({ rig, live }: { rig: Rig; live: Live }) {
  const gl = useThree((s) => s.gl);
  const glow = getRadialGlow();
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const core = useRef<THREE.Sprite>(null);
  const ring = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    const k = new Float32Array(TRAIL_N);
    for (let i = 0; i < TRAIL_N; i++) k[i] = i / (TRAIL_N - 1);
    g.setAttribute("aK", new THREE.BufferAttribute(k, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TRAIL_VERT,
        fragmentShader: TRAIL_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uFade: { value: 1 }, uPx: { value: 1 }, uLen: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const t = fx.t;
    const g = group.current;
    if (!g || !g.parent?.visible) return;
    g.position.copy(live.ball);
    g.position.y += 0.12;
    const pulse = Math.sin(t * 3.1) * 0.5 + 0.5;
    halo.current?.scale.setScalar((1.5 + pulse * 0.3) * (1 + 2.5 * live.warp * live.warp));
    core.current?.scale.setScalar((0.4 + pulse * 0.05) * (1 + 4 * live.warp * live.warp));
    if (ring.current) ring.current.scale.setScalar(1 + ((t * 0.7) % 1) * 0.9);
    const falling = live.fall < 0.999;
    const len = 0.008 + Math.min(0.04, Math.abs(live.vel) * 0.05);
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    mat.uniforms.uPx.value = gl.getPixelRatio();
    mat.uniforms.uLen.value = falling ? 0.9 : Math.min(1, len / 0.048);
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < TRAIL_N; i++) {
      const k = i / (TRAIL_N - 1);
      if (falling) {
        arr[i * 3] = live.ball.x;
        arr[i * 3 + 1] = live.ball.y + 0.12 + k * 3.6 * (0.25 + 0.75 * (1 - live.fall));
        arr[i * 3 + 2] = live.ball.z;
      } else {
        const u = clamp01(live.u - live.dir * len * Math.pow(k, 1.15));
        sample(rig, u, _p);
        arr[i * 3] = _p.x;
        arr[i * 3 + 1] = _p.y + 0.12;
        arr[i * 3 + 2] = _p.z;
      }
    }
    attr.needsUpdate = true;
  });
  return (
    <>
      <points geometry={geom} material={mat} frustumCulled={false} renderOrder={6} />
      <group ref={group} renderOrder={7}>
        <sprite ref={halo} scale={[1.5, 1.5, 1]} renderOrder={7}>
          <spriteMaterial map={glow} color={TEAL} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
        <mesh ref={ring} renderOrder={7}>
          <torusGeometry args={[0.2, 0.008, 8, 64]} />
          <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
        <sprite ref={core} scale={[0.4, 0.4, 1]} renderOrder={8}>
          <spriteMaterial map={glow} color="#ffffff" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      </group>
    </>
  );
}

const SPARKS = 56;
const SPARK_VERT = /* glsl */ `
attribute vec4 aDir;
uniform float uAge;
uniform float uPx;
uniform vec3 uStart;
varying float vA;
void main(){
  float a = uAge;
  vec3 p = uStart + aDir.xyz * aDir.w * a;
  p.y -= 5.0 * a * a * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(34.0 * uPx * (5.5 / max(1.0, -mv.z)) * (1.0 - a * 0.55), 1.0, 60.0 * uPx);
  vA = pow(max(0.0, 1.0 - a), 1.6);
}
`;
const SPARK_FRAG = /* glsl */ `
uniform float uFade;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float s = pow(1.0 - d, 1.5);
  gl_FragColor = vec4(mix(vec3(0.1, 0.8, 0.7), vec3(0.9, 1.0, 0.97), s), s * vA * uFade);
}
`;

/** Landing: flash, two expanding ripples on the ground and a spray of sparks. All driven by scrubbed `live.age`. */
function Impact({ live }: { live: Live }) {
  const glow = getRadialGlow();
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const m1 = useRef<THREE.MeshBasicMaterial>(null);
  const m2 = useRef<THREE.MeshBasicMaterial>(null);
  const flash = useRef<THREE.Sprite>(null);
  const fm = useRef<THREE.SpriteMaterial>(null);
  const gl = useThree((s) => s.gl);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    const d = new Float32Array(SPARKS * 4);
    for (let i = 0; i < SPARKS; i++) {
      const a = (i / SPARKS) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.4;
      const up = 0.35 + 0.65 * Math.abs(Math.sin(i * 78.233));
      const sp = 1.4 + 3.2 * Math.abs(Math.sin(i * 37.719));
      d[i * 4] = Math.cos(a) * (1 - up * 0.5);
      d[i * 4 + 1] = up * 1.6;
      d[i * 4 + 2] = Math.sin(a) * (1 - up * 0.5);
      d[i * 4 + 3] = sp;
    }
    g.setAttribute("aDir", new THREE.BufferAttribute(d, 4));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPARK_VERT,
        fragmentShader: SPARK_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uFade: { value: 1 },
          uAge: { value: 0 },
          uPx: { value: 1 },
          uStart: { value: new THREE.Vector3(LAND[0], LAND[1] + 0.1, LAND[2]) },
        },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const landed = live.fall > 0.999;
    const a = landed ? live.age : 0;
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    mat.uniforms.uAge.value = landed ? a : 1;
    mat.uniforms.uPx.value = gl.getPixelRatio();
    const a2 = clamp01((a - 0.14) / 0.86);
    ring1.current?.scale.setScalar(0.2 + a * 1.7);
    ring2.current?.scale.setScalar(0.2 + a2 * 1.25);
    if (m1.current) m1.current.userData.mul = landed && a < 1 ? Math.pow(1 - a, 1.5) : 0;
    if (m2.current) m2.current.userData.mul = landed && a2 > 0 && a2 < 1 ? Math.pow(1 - a2, 1.5) * 0.8 : 0;
    flash.current?.scale.setScalar(2.6 * (1 - a * 0.5));
    if (fm.current) fm.current.userData.mul = landed ? Math.pow(Math.max(0, 1 - a * 3), 2) : 0;
  });
  const [lx, ly, lz] = LAND;
  return (
    <>
      <mesh ref={ring1} position={[lx, ly + 0.03, lz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[0.9, 1, 96]} />
        <meshBasicMaterial ref={m1} color={TEAL_LIGHT} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} position={[lx, ly + 0.03, lz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[0.93, 1, 96]} />
        <meshBasicMaterial ref={m2} color={TEAL} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <sprite ref={flash} position={[lx, ly + 0.2, lz]} scale={[2.6, 2.6, 1]} renderOrder={7}>
        <spriteMaterial ref={fm} map={glow} color="#d8fff8" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <points geometry={geom} material={mat} frustumCulled={false} renderOrder={7} />
    </>
  );
}

const LINES = 150;
/** Streaks flying past the camera on the fast travel segments; strength follows travel x scroll boost. */
/** Deterministic PRNG so render stays pure (same streak layout every mount). */
function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function SpeedLines({ live }: { live: Live }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const params = useMemo(() => {
    const a = new Float32Array(LINES * 4);
    const rnd = seededRandom(1337);
    for (let i = 0; i < LINES; i++) {
      a[i * 4] = rnd() * Math.PI * 2;
      a[i * 4 + 1] = 1.7 + Math.pow(rnd(), 0.7) * 7.5;
      a[i * 4 + 2] = rnd();
      a[i * 4 + 3] = 0.6 + rnd() * 0.8;
    }
    return a;
  }, []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LINES * 6), 3));
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  useFrame(({ camera }) => {
    const ls = lineRef.current;
    if (!ls || !ls.parent?.visible) return;
    const strength = live.speed;
    if (matRef.current) matRef.current.userData.mul = strength > 0.02 ? Math.min(1, strength * 1.2) : 0;
    if (strength <= 0.02) return;
    const e = camera.matrixWorld.elements;
    const rx = e[0], ry = e[1], rz = e[2];
    const ux = e[4], uy = e[5], uz = e[6];
    const fx_ = -e[8], fy = -e[9], fz = -e[10];
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const arr = geom.getAttribute("position") as THREE.BufferAttribute;
    const p = arr.array as Float32Array;
    const t = fx.t;
    for (let i = 0; i < LINES; i++) {
      const ang = params[i * 4], rad = params[i * 4 + 1], ph = params[i * 4 + 2], sp = params[i * 4 + 3];
      const d = 3 + (((ph + t * 0.55 * sp) % 1) + 1) % 1 * 30;
      const ca = Math.cos(ang) * rad, sa = Math.sin(ang) * rad;
      const bx = cx + fx_ * d + rx * ca + ux * sa;
      const by = cy + fy * d + ry * ca + uy * sa;
      const bz = cz + fz * d + rz * ca + uz * sa;
      const L = 0.5 + 5.5 * strength * sp;
      p[i * 6] = bx;
      p[i * 6 + 1] = by;
      p[i * 6 + 2] = bz;
      p[i * 6 + 3] = bx + fx_ * L;
      p[i * 6 + 4] = by + fy * L;
      p[i * 6 + 5] = bz + fz * L;
    }
    arr.needsUpdate = true;
  });
  return (
    <lineSegments ref={lineRef} geometry={geom} frustumCulled={false} renderOrder={5}>
      <lineBasicMaterial ref={matRef} color={TEAL_LIGHT} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
    </lineSegments>
  );
}

/** Milestone nodes: dim until reached, ignite (glow pulse + ring burst) on arrival, stay lit once passed. Billboarded to the camera. */
function Nodes({ rig, live }: { rig: Rig; live: Live }) {
  const n = rig.nodePos.length;
  const groups = useRef<(THREE.Group | null)[]>([]);
  const halo = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const haloS = useRef<(THREE.Sprite | null)[]>([]);
  const disc = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const ringM = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const ringMesh = useRef<(THREE.Mesh | null)[]>([]);
  const outer = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const burstM = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const burstMesh = useRef<(THREE.Mesh | null)[]>([]);
  const coreM = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const glow = getRadialGlow();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const { progressRef } = useJourneyProgress();
  const els = useRef<(HTMLElement | null)[]>([]);

  useFrame(() => {
    const t = fx.t;
    const now = nowS();
    for (let i = 0; i < n; i++) {
      const lit = live.lit[i];
      const act = 1 - clamp01(Math.abs(live.f - i) / 0.4);
      const age = (now - live.burst[i]) / 1.4;
      const pulse = age >= 0 && age < 1 ? Math.exp(-age * 3.2) : 0;
      const setMul = (m: THREE.Material | null, v: number) => {
        if (m) m.userData.mul = v;
      };
      setMul(halo.current[i], 0.1 + 0.9 * lit);
      setMul(disc.current[i], 0.22 + 0.78 * lit);
      setMul(ringM.current[i], 0.2 + 0.8 * lit);
      setMul(outer.current[i], 0.15 + 0.85 * lit);
      setMul(coreM.current[i], 0.15 + 0.85 * lit);
      const bm = burstMesh.current[i];
      if (bm) {
        const b = clamp01(age);
        bm.scale.setScalar(1 + b * 2.4);
        setMul(burstM.current[i], age >= 0 && age < 1 ? (1 - b) * (1 - b) : 0);
      }
      haloS.current[i]?.scale.setScalar(2.1 * (1 + 0.22 * act + 0.5 * pulse));
      ringMesh.current[i]?.scale.setScalar(1 + Math.sin(t * 1.6 + i * 1.3) * 0.05 + 0.15 * pulse);
      groups.current[i]?.quaternion.copy(camera.quaternion);
    }
    const zoomNow = expZoom(live.q);
    // project node anchors to the year labels (direct DOM writes, no React state)
    if (stationActive(progressRef.current, "experience") <= 0.001) return;
    for (let i = 0; i < n; i++) {
      const g = groups.current[i];
      if (!g) continue;
      let el = els.current[i];
      if (!el || !el.isConnected) {
        el = document.querySelector<HTMLElement>(`[data-exp-anchor="${i}"]`);
        els.current[i] = el;
      }
      if (!el) continue;
      g.getWorldPosition(_v);
      _v.project(camera);
      const x = (_v.x * 0.5 + 0.5) * size.width;
      const y = (-_v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.setProperty("--lit", live.lit[i].toFixed(3));
      el.style.setProperty("--act", ((1 - clamp01(Math.abs(live.f - i) / 0.4)) * (1 - zoomNow[i])).toFixed(3));
    }
  });

  return (
    <>
      {rig.nodePos.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={p}
          scale={0.55}
        >
          <sprite
            scale={[3.4, 3.4, 1]}
            renderOrder={4}
            ref={(el) => {
              haloS.current[i] = el;
            }}
          >
            <spriteMaterial ref={(el) => { halo.current[i] = el; }} map={glow} color={TEAL} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
          <mesh renderOrder={5}>
            <circleGeometry args={[0.3, 48]} />
            <meshBasicMaterial ref={(el) => { disc.current[i] = el; }} color={TEAL} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
          </mesh>
          <mesh renderOrder={5} ref={(el) => { ringMesh.current[i] = el; }}>
            <torusGeometry args={[0.37, 0.016, 10, 72]} />
            <meshBasicMaterial ref={(el) => { ringM.current[i] = el; }} color={TEAL_LIGHT} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
          </mesh>
          <mesh renderOrder={5}>
            <torusGeometry args={[0.62, 0.008, 8, 72]} />
            <meshBasicMaterial ref={(el) => { outer.current[i] = el; }} color={CYAN} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
          </mesh>
          <mesh renderOrder={5} ref={(el) => { burstMesh.current[i] = el; }}>
            <torusGeometry args={[0.45, 0.02, 8, 72]} />
            <meshBasicMaterial ref={(el) => { burstM.current[i] = el; }} color={TEAL_LIGHT} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
          </mesh>
          <sprite scale={[0.85, 0.85, 1]} renderOrder={6}>
            <spriteMaterial ref={(el) => { coreM.current[i] = el; }} map={glow} color="#e9fffb" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
        </group>
      ))}
    </>
  );
}

export default function ExperienceTimeline() {
  const rig = useMemo(() => makeRig(), []);
  const rigRef = useRef<THREE.Group>(null);
  const live = useMemo<Live>(
    () => ({
      q: 0,
      f: -1,
      u: 0,
      prevU: 0,
      vel: 0,
      dir: 1,
      lit: rig.nodeU.map(() => 0),
      burst: rig.nodeU.map(() => -10),
      arrived: rig.nodeU.map(() => false),
      ball: new THREE.Vector3(0, FALL_H, -6),
      fall: 0,
      age: 0,
      travel: 0,
      speed: 0,
      warp: 0,
    }),
    [rig],
  );
  const gen = useMemo(
    () => (r: () => number) => {
      const p = rig.curve.getPointAt(r());
      return [p.x + (r() - 0.5) * 6, p.y + (r() - 0.5) * 3.2 + 0.4, p.z + (r() - 0.5) * 3] as [number, number, number];
    },
    [rig],
  );
  return (
    <StationGroup id="experience">
      <group ref={rigRef}>
        <Driver rig={rig} live={live} rigRef={rigRef} />
        {/* parallax particles hugging the path, plus deep dust and bokeh along the whole journey */}
        <SoftPoints count={900} box={[1, 1, 1]} gen={gen} size={0.02} sizeVar={0.026} opacity={0.9} drift={1.3} depthFade={0.012} seed={31} />
        <SoftPoints count={700} box={[34, 14, 74]} center={[0, 1, -32]} size={0.03} sizeVar={0.04} opacity={0.65} seed={41} depthFade={0.01} />
        <SoftPoints count={36} box={[26, 11, 70]} center={[0, 1.5, -32]} size={0.55} sizeVar={0.8} opacity={0.1} bokeh seed={43} depthFade={0.006} />
        <SoftPoints count={40} box={[30, 13, 70]} center={[0, 2, -34]} size={0.4} sizeVar={0.5} opacity={0.12} bokeh seed={47} depthFade={0.006} colors={[CYAN, TEAL]} />
        <Path rig={rig} live={live} />
        <Pulses rig={rig} live={live} />
        <Nodes rig={rig} live={live} />
        <Ball rig={rig} live={live} />
        <Impact live={live} />
        <SpeedLines live={live} />
      </group>
    </StationGroup>
  );
}
