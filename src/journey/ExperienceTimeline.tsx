import { useEffect, useMemo, useRef } from "react";
import { fx, expPan } from "./scrollFx";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow } from "./glow";
import { TEAL, CYAN, TEAL_LIGHT, ndcToLocal } from "./layout";
import { useJourneyProgress } from "./JourneyProgressContext";
import { stationActive } from "./stationVisibility";
import MotionPoints from "./MotionPoints";

const _p = new THREE.Vector3();
const PULSES = 9;
const TRAIL = 4;

/** Small light pulses flowing along the path (always moving). */
function Pulses({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const update = useMemo(
    () => (t: number, pos: Float32Array) => {
      for (let j = 0; j < PULSES; j++) {
        for (let k = 0; k < TRAIL; k++) {
          const u = (((t * 0.065 + j / PULSES - k * 0.007) % 1) + 1) % 1;
          curve.getPointAt(u, _p);
          const i = (j * TRAIL + k) * 3;
          pos[i] = _p.x;
          pos[i + 1] = _p.y;
          pos[i + 2] = _p.z + 0.08;
        }
      }
    },
    [curve],
  );
  return <MotionPoints count={PULSES * TRAIL} update={update} size={0.34} opacity={0.7} />;
}

/** Node anchors (NDC at depth ~12). Chronological: bottom-left -> top-right. */
export const EXP_NODES: Array<[number, number, number]> = [
  [-0.02, -0.3, 11.6],
  [0.2, 0.1, 12.2],
  [0.6, 0.47, 12.8],
];

const PATH: Array<[number, number, number]> = [
  [-0.36, -1.3, 10],
  [-0.2, -0.85, 10.8],
  [-0.05, -0.55, 11.4],
  EXP_NODES[0],
  EXP_NODES[1],
  [0.31, 0.28, 12.4],
  [0.45, 0.4, 12.6],
  EXP_NODES[2],
  [0.8, 0.72, 13.2],
  [1.1, 1.1, 13.8],
];

export function expPath() {
  return new THREE.CatmullRomCurve3(
    PATH.map(([x, y, d]) => ndcToLocal(x, y, d)),
    false,
    "centripetal",
  );
}

const SAMPLES = 600;
type Rig = {
  curve: THREE.CatmullRomCurve3;
  /** Arc-length spaced samples (xyz), index / SAMPLES = ribbon u. */
  pts: Float32Array;
  nodePos: THREE.Vector3[];
  nodeU: number[];
};
function makeRig(): Rig {
  const curve = expPath();
  const sp = curve.getSpacedPoints(SAMPLES);
  const pts = new Float32Array(sp.length * 3);
  sp.forEach((p, i) => {
    pts[i * 3] = p.x;
    pts[i * 3 + 1] = p.y;
    pts[i * 3 + 2] = p.z;
  });
  const nodePos = EXP_NODES.map(([x, y, d]) => ndcToLocal(x, y, d));
  const nodeU = nodePos.map((np) => {
    let best = 0;
    let bd = Infinity;
    sp.forEach((p, i) => {
      const d = p.distanceToSquared(np);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best / SAMPLES;
  });
  return { curve, pts, nodePos, nodeU };
}

function sample(rig: Rig, u: number, out: THREE.Vector3) {
  const x = Math.min(SAMPLES - 0.001, Math.max(0, u * SAMPLES));
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

/** Mutable animation state shared by the ball, trail, ribbon and nodes (no React state). */
type Live = {
  f: number;
  u: number;
  prevU: number;
  vel: number;
  dir: number;
  lit: number[];
  burst: number[];
  arrived: boolean[];
  ball: THREE.Vector3;
};
const nowS = () => performance.now() / 1000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Smooths the pinned scroll index and derives ball position, node ignition and the camera pan. */
function Driver({ rig, live }: { rig: Rig; live: Live }) {
  const { expTargetRef, expIndexRef } = useJourneyProgress();
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    expIndexRef.current += (expTargetRef.current - expIndexRef.current) * (1 - Math.exp(-dt * 4.2));
    const f = expIndexRef.current;
    live.f = f;
    const n = rig.nodeU.length;
    const i = Math.min(n - 2, Math.max(0, Math.floor(f)));
    const t = clamp01(f - i);
    live.u = rig.nodeU[i] + (rig.nodeU[i + 1] - rig.nodeU[i]) * t;
    const v = dt > 0 ? (live.u - live.prevU) / dt : 0;
    live.prevU = live.u;
    live.vel += (v - live.vel) * Math.min(1, dt * 8);
    if (Math.abs(live.vel) > 0.004) live.dir += (Math.sign(live.vel) - live.dir) * Math.min(1, dt * 10);
    sample(rig, live.u, live.ball);
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
    expPan.x = (live.ball.x - 1.6) * 0.1;
    expPan.y = live.ball.y * 0.08;
  });
  return null;
}

/** Camera-facing flat ribbon; uv.x = across (-1.4..1.4, band edges at +-1), uv.y = along (0..1). */
function buildRibbon(curve: THREE.CatmullRomCurve3) {
  const N = 260;
  const K = 29;
  const EXT = 1.4;
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const view = new THREE.Vector3(0, 0, 1);
  const side = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    curve.getPointAt(s, p);
    curve.getTangentAt(s, tan);
    side.crossVectors(tan, view).normalize();
    // widest at the bottom-left (nearest), narrowing up the path
    const w = 0.42 + 0.7 * Math.pow(1 - s, 1.25);
    for (let j = 0; j < K; j++) {
      const off = (j / (K - 1)) * 2 * EXT - EXT;
      pos.push(p.x + side.x * off * w, p.y + side.y * off * w, p.z);
      uvs.push(off, s);
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
  g.setIndex(idx);
  return g;
}

const RIB_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Crisp band; flowing streaks and light packets move along it; the part ahead of the ball is dimmer. */
const RIB_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uBall;
varying vec2 vUv;
void main(){
  float a = abs(vUv.x);
  float s = vUv.y;
  float inside = 1.0 - smoothstep(0.975, 1.0, a);
  float body = (0.27 + 0.18 * (1.0 - a * a)) * inside;
  float edge = exp(-pow((a - 0.95) / 0.04, 2.0)) * inside;
  float glow = (1.0 - inside) * 0.16 * exp(-pow((a - 1.0) / 0.13, 2.0));
  float flow = s * 38.0 - uTime * 2.4;
  float st1 = pow(0.5 + 0.5 * sin(vUv.x * 7.5 + sin(s * 16.0 - uTime * 1.1) * 1.6 + flow * 0.35), 5.0);
  float st2 = pow(0.5 + 0.5 * sin(vUv.x * 13.0 - sin(s * 11.0 + uTime * 0.8) * 1.2 + flow * 0.6), 8.0);
  float streak = (st1 * 0.34 + st2 * 0.24) * inside * (1.0 - a * a * 0.6);
  float p = fract(s * 3.2 - uTime * 0.16);
  float packet = exp(-pow((p - 0.5) / 0.035, 2.0)) * inside * (0.32 - 0.2 * a);
  float lum = mix(1.0, 0.7, smoothstep(0.0, 1.0, s)) * (1.0 - smoothstep(0.9, 1.0, s));
  float passed = 1.0 - smoothstep(uBall - 0.015, uBall + 0.07, s);
  float lit = mix(0.36, 1.0, passed);
  float near = exp(-pow((s - uBall) / 0.06, 2.0)) * inside;
  vec3 teal = vec3(0.1, 0.78, 0.68);
  vec3 hot = vec3(0.72, 1.0, 0.95);
  vec3 col = teal * body + hot * (edge * 0.75 + streak * 0.8 + packet) + teal * glow * 1.3 + hot * near * 0.35;
  gl_FragColor = vec4(col * lum * lit, uFade);
}
`;

/** One smooth wide S-curve ribbon. */
function Path({ rig, live }: { rig: Rig; live: Live }) {
  const geom = useMemo(() => buildRibbon(rig.curve), [rig]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: RIB_VERT,
        fragmentShader: RIB_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uBall: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    mat.uniforms.uTime.value = fx.t;
    mat.uniforms.uBall.value = live.u;
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
  gl_PointSize = clamp(sz * uPx * (11.0 / max(1.0, -mv.z)), 1.0, 90.0 * uPx);
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

/** Bright orb with halo and a comet-like trail that stretches with travel speed. */
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
    g.position.z += 0.15;
    const pulse = Math.sin(t * 3.1) * 0.5 + 0.5;
    halo.current?.scale.setScalar(2.6 + pulse * 0.5);
    core.current?.scale.setScalar(0.62 + pulse * 0.08);
    if (ring.current) ring.current.scale.setScalar(1 + ((t * 0.7) % 1) * 0.9);
    const len = 0.03 + Math.min(0.14, Math.abs(live.vel) * 0.22);
    mat.uniforms.uPx.value = gl.getPixelRatio();
    mat.uniforms.uLen.value = Math.min(1, len / 0.17);
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < TRAIL_N; i++) {
      const k = i / (TRAIL_N - 1);
      const u = clamp01(live.u - live.dir * len * Math.pow(k, 1.15));
      sample(rig, u, _p);
      arr[i * 3] = _p.x;
      arr[i * 3 + 1] = _p.y;
      arr[i * 3 + 2] = _p.z + 0.12;
    }
    attr.needsUpdate = true;
  });
  return (
    <>
      <points geometry={geom} material={mat} frustumCulled={false} renderOrder={6} />
      <group ref={group} renderOrder={7}>
        <sprite ref={halo} scale={[2.6, 2.6, 1]} renderOrder={7}>
          <spriteMaterial map={glow} color={TEAL} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
        <mesh ref={ring} renderOrder={7}>
          <torusGeometry args={[0.34, 0.012, 8, 64]} />
          <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
        <sprite ref={core} scale={[0.62, 0.62, 1]} renderOrder={8}>
          <spriteMaterial map={glow} color="#ffffff" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      </group>
    </>
  );
}

const _v = new THREE.Vector3();

/** Milestone nodes: dim until reached, ignite (glow pulse + ring burst) on arrival, stay lit once passed. */
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
      haloS.current[i]?.scale.setScalar(3.4 * (1 + 0.22 * act + 0.5 * pulse));
      ringMesh.current[i]?.scale.setScalar(1 + Math.sin(t * 1.6 + i * 1.3) * 0.05 + 0.15 * pulse);
    }
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
      el.style.setProperty("--act", (1 - clamp01(Math.abs(live.f - i) / 0.4)).toFixed(3));
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
  const rig = useMemo(makeRig, []);
  const live = useMemo<Live>(
    () => ({
      f: 0,
      u: rig.nodeU[0],
      prevU: rig.nodeU[0],
      vel: 0,
      dir: 1,
      lit: rig.nodeU.map((_, i) => (i === 0 ? 1 : 0)),
      burst: rig.nodeU.map(() => -10),
      arrived: rig.nodeU.map(() => false),
      ball: new THREE.Vector3(),
    }),
    [rig],
  );
  const gen = useMemo(
    () => (r: () => number) => {
      const p = rig.curve.getPointAt(r());
      return [p.x + (r() - 0.5) * 1.1, p.y + (r() - 0.5) * 1.1, p.z + (r() - 0.5) * 1.2] as [number, number, number];
    },
    [rig],
  );
  return (
    <StationGroup id="experience">
      <Driver rig={rig} live={live} />
      <SoftPoints count={420} box={[1, 1, 1]} gen={gen} size={0.026} sizeVar={0.03} opacity={0.95} drift={1.3} depthFade={0.01} seed={31} />
      <Path rig={rig} live={live} />
      <Pulses curve={rig.curve} />
      <Nodes rig={rig} live={live} />
      <Ball rig={rig} live={live} />
      <SoftPoints count={620} box={[22, 12, 12]} center={[0, 0, -12]} size={0.018} sizeVar={0.02} opacity={0.6} seed={41} />
      {/* bokeh: near = big & faint, far = small & soft (depth of field feel) */}
      <SoftPoints count={30} box={[20, 11, 8]} center={[0.5, 0, -8]} size={0.45} sizeVar={0.7} opacity={0.09} bokeh seed={43} depthFade={0.004} />
      <SoftPoints count={34} box={[24, 13, 10]} center={[0.5, 0, -19]} size={0.3} sizeVar={0.4} opacity={0.12} bokeh seed={47} depthFade={0.004} colors={[CYAN, TEAL]} />
    </StationGroup>
  );
}