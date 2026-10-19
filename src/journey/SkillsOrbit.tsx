import { skillsFocus } from "./skillsFocus";
import { skillsTip } from "./skillsTip";
import { getSoftShadowTex } from "./softShadow";
import { isLowTier } from "@/utils/heroCapabilities";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fx } from "./scrollFx";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import MotionPoints from "./MotionPoints";
import { getRadialGlow, getStreak } from "./glow";
import { getCloud } from "./panelFx";
import { TEAL, TEAL_DEEP, TEAL_LIGHT, CYAN, ndcToLocal, SUN_NDC, SUN_D } from "./layout";
import { TECH_ICONS } from "./techIcons";
import { roundedRectGeometry } from "./shapes";
import { useJourneyProgress } from "./JourneyProgressContext";
import { warpAt } from "./warp";
import { saCollapse } from "./transitions";

/**
 * Skills as a solar system: a glass-crystal SUN (corona, glow, flares) and the CV tech tiles as
 * PLANETS on concentric tilted orbits with Kepler-like speeds (inner = faster), each tile
 * billboarded toward the camera and slowly swaying on its own axis, with moons orbiting planets.
 * Every angular speed runs on `fx.t`, so the scroll boost speeds it all up like the other stations.
 */

/** Sun centre (NDC at depth 12) - right half of the frame, like the reference. */
const CORE = ndcToLocal(SUN_NDC[0], SUN_NDC[1], SUN_D);
const DIST = SUN_D;
const SUN_R = 1.05;
/** Orbits are slightly squashed horizontally so the outer ones stay in frame. */
const SQ = 0.85;
const W0 = 0.3;

type OrbitDef = { r: number; tau: number; zeta: number };
/**
 * Round 15 declutter: three orbits with two planets each, opposite each other, and ONE angular speed for
 * every planet, so the relative geometry is rigid and never converges (checked numerically across a full turn:
 * min tile gap ~0.6 and clear of the sun). The moons stay small and close to their parents.
 */
const ORBITS: OrbitDef[] = [
  { r: 2.6, tau: 0.95, zeta: 0.05 },
  { r: 3.3, tau: 0.95, zeta: -0.08 },
  { r: 4.3, tau: 0.95, zeta: 0.08 },
];
const orbitQ = ORBITS.map((o) => new THREE.Quaternion().setFromEuler(new THREE.Euler(o.tau, 0, o.zeta)));
const moonQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.95, 0, 0.3));

type Item = {
  key?: string;
  label: string;
  size: number;
  /** orbit index (planets) */
  orbit: number;
  phase: number;
  glass?: boolean;
  ring?: boolean;
  /** moons: index of the parent item, orbit radius around it, angular speed */
  parent?: number;
  mr?: number;
  mw?: number;
};

const PLANETS: Item[] = [
  { key: "python", label: "Python", size: 1.0, orbit: 0, phase: 0, glass: true },
  { key: "django", label: "Django", size: 1.1, orbit: 0, phase: Math.PI, glass: true },
  { key: "react", label: "React", size: 1.1, orbit: 1, phase: 4.24, glass: true, ring: true },
  { key: "docker", label: "Docker", size: 1.1, orbit: 1, phase: 4.24 + Math.PI, glass: true },
  { key: "aws", label: "AWS", size: 1.1, orbit: 2, phase: 5.27, glass: true },
  { key: "flutter", label: "Flutter", size: 1.1, orbit: 2, phase: 5.27 + Math.PI, glass: true },
];
const MOONS: Item[] = [
  { key: "postgresql", label: "PostgreSQL", size: 0.65, orbit: -1, phase: 0.3, parent: 1, mr: 0.78, mw: 1.5 },
  { label: "Nginx", size: 0.65, orbit: -1, phase: 2.0, parent: 3, mr: 0.85, mw: 1.2 },
  { label: "Linux", size: 0.65, orbit: -1, phase: 4.0, parent: 4, mr: 1.0, mw: 1.0 },
  { label: "Firebase", size: 0.65, orbit: -1, phase: 1.0, parent: 5, mr: 1.0, mw: 0.85 },
];
const ITEMS: Item[] = [...PLANETS, ...MOONS];
const N = ITEMS.length;

/** Shared quaternions / vectors (module level => no per-frame allocation). */
const tv = new THREE.Vector3();
const qSway = new THREE.Quaternion();
const eSway = new THREE.Euler();
const sk = { e: 1, c: 0 };
const condR = (c: number) => Math.pow(1 - c, 1.4);
const condSpin = (c: number) => c * c * 7;
const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

function makeTileTexture(c: Item): THREE.CanvasTexture {
  const icon = c.key ? TECH_ICONS[c.key] : undefined;
  const S = c.size > 1 ? 512 : 384;
  const k = S / 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(k, k);
  const W = 512;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const M = 20;
  const R = 112;
  ctx.save();
  rr(M, M, W - 2 * M, W - 2 * M, R);
  ctx.clip();
  // frosted body: dark teal base + milky diagonal gradient
  ctx.fillStyle = "rgba(6,22,26,0.55)";
  ctx.fillRect(0, 0, W, W);
  const g = ctx.createLinearGradient(0, 0, W, W);
  g.addColorStop(0, "rgba(205,240,240,0.30)");
  g.addColorStop(0.55, "rgba(120,185,190,0.12)");
  g.addColorStop(1, "rgba(60,150,150,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);
  const sh = ctx.createRadialGradient(130, 90, 0, 130, 90, 300);
  sh.addColorStop(0, "rgba(255,255,255,0.38)");
  sh.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, W);
  const bt = ctx.createLinearGradient(0, W * 0.6, 0, W);
  bt.addColorStop(0, "rgba(31,227,194,0)");
  bt.addColorStop(1, "rgba(31,227,194,0.28)");
  ctx.fillStyle = bt;
  ctx.fillRect(0, 0, W, W);
  ctx.restore();
  const rim = ctx.createLinearGradient(0, 0, W, W);
  rim.addColorStop(0, "rgba(255,255,255,0.98)");
  rim.addColorStop(0.5, "rgba(190,240,236,0.45)");
  rim.addColorStop(1, "rgba(80,240,215,0.85)");
  rr(M, M, W - 2 * M, W - 2 * M, R);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 7;
  ctx.stroke();
  rr(M + 11, M + 11, W - 2 * M - 22, W - 2 * M - 22, R - 11);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "2px";
  if (icon) {
    const L = 214;
    ctx.save();
    ctx.translate(W / 2 - L / 2, 62);
    ctx.scale(L / 24, L / 24);
    ctx.fillStyle = "rgba(240,246,247,0.96)";
    ctx.shadowColor = "rgba(150,255,240,0.55)";
    ctx.shadowBlur = 18;
    ctx.fill(new Path2D(icon.path));
    ctx.restore();
    ctx.fillStyle = "rgba(244,248,249,0.96)";
    ctx.font = "700 52px 'IBM Plex Sans', Arial, sans-serif";
    ctx.fillText(icon.label.toUpperCase(), W / 2, 408, W - 90);
  } else {
    // text-only chip for CV skills without a bundled logo: label large and centred
    ctx.fillStyle = "rgba(244,248,249,0.97)";
    let fs = 118;
    ctx.font = `700 ${fs}px 'IBM Plex Sans', Arial, sans-serif`;
    const wmax = W - 110;
    const w = ctx.measureText(c.label.toUpperCase()).width;
    if (w > wmax) {
      fs = Math.floor((fs * wmax) / w);
      ctx.font = `700 ${fs}px 'IBM Plex Sans', Arial, sans-serif`;
    }
    ctx.shadowColor = "rgba(150,255,240,0.5)";
    ctx.shadowBlur = 16;
    ctx.fillText(c.label.toUpperCase(), W / 2, W / 2 + 6, wmax);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const CORE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/** Glass crystal: soft fresnel rim + faint internal haze. */
const CORE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uK;
varying vec3 vN;
varying vec3 vView;
void main(){
  vec3 V = normalize(-vView);
  float ndv = clamp(dot(normalize(vN), V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.6);
  float rim = pow(1.0 - ndv, 6.0);
  float pulse = 0.94 + 0.06 * sin(uTime * 1.1);
  vec3 deep = vec3(0.01, 0.2, 0.24);
  vec3 mid = vec3(0.14, 0.9, 0.78);
  vec3 col = deep * (0.5 + 0.5 * ndv) + mid * fres * 0.9 + vec3(0.8, 1.0, 0.97) * rim * 0.9;
  col += vec3(0.5, 0.95, 0.88) * (1.0 - uK) * 0.8;
  float a = (0.2 + 0.5 * fres + 0.5 * rim) * pulse;
  gl_FragColor = vec4(col, a * uFade);
}
`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Screen-space swirl: tight log-spiral arms + fine filaments + hot centre. */
const VORTEX_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uArms;
uniform float uDir;
uniform float uAlpha;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime * uDir;
  float warp = 0.7 * sin(a * 2.0 - t * 0.7) + 0.4 * sin(a * 3.0 + r * 5.0 + t * 0.4);
  float phase = a * uArms + 7.5 * sqrt(r) * 2.2 - t * 1.7 + warp;
  float arm = pow(0.5 + 0.5 * sin(phase), 5.0);
  float fine = pow(0.5 + 0.5 * sin(a * uArms * 2.0 + 17.0 * r - t * 2.6 + warp * 1.4), 16.0);
  float mask = (1.0 - smoothstep(0.62, 0.98, r)) * smoothstep(0.015, 0.2, r);
  float hot = exp(-r * r * 20.0) * 0.55;
  float halo = exp(-r * 3.2) * 0.22;
  float I = (arm * 0.8 + fine * 0.7) * mask + hot * 0.75 + halo;
  vec3 col = mix(vec3(0.1, 0.85, 0.74), vec3(0.7, 0.96, 0.9), clamp(hot * 1.4 + arm * 0.25, 0.0, 1.0));
  gl_FragColor = vec4(col * I, min(I, 1.0) * uAlpha * uFade);
}
`;

/** Corona: radial falloff beyond the sun's edge, modulated by slowly turning rays and flare spikes. */
const CORONA_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uK;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float r0 = 0.285;
  float rays = pow(0.5 + 0.5 * sin(a * 11.0 + uTime * 0.35 + sin(a * 4.0 - uTime * 0.6) * 1.4), 3.0) * 0.55
             + pow(0.5 + 0.5 * sin(a * 27.0 - uTime * 0.8 + sin(a * 7.0 + uTime * 0.5)), 7.0) * 0.45;
  float flare = pow(0.5 + 0.5 * sin(a * 3.0 + uTime * 0.22), 10.0) * 1.4;
  float d = max(r - r0, 0.0);
  float fall = exp(-d * 5.2);
  float outside = smoothstep(r0 - 0.03, r0 + 0.02, r);
  float I = (0.28 + rays * 0.55 + flare * 0.6 * exp(-d * 3.0)) * fall * outside * (1.0 - smoothstep(0.82, 1.0, r));
  I += exp(-d * 11.0) * 0.38 * outside;
  vec3 col = mix(vec3(0.1, 0.85, 0.74), vec3(0.62, 0.95, 0.88), clamp(exp(-d * 9.0), 0.0, 1.0));
  gl_FragColor = vec4(col * I, min(I, 1.0) * uFade * uK);
}
`;

function mkMat(frag: string, uniforms: Record<string, THREE.IUniform>, vert = PLANE_VERT) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, ...uniforms },
  });
}

function Sun() {
  const { progressRef } = useJourneyProgress();
  const root = useRef<THREE.Group>(null);
  const face = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const heart = useRef<THREE.Sprite>(null);
  const fl1 = useRef<THREE.Sprite>(null);
  const fl2 = useRef<THREE.Sprite>(null);
  const glow = getRadialGlow();
  const streak = getStreak();
  const mats = useMemo(
    () => ({
      shell: mkMat(CORE_FRAG, { uK: { value: 1 } }, CORE_VERT),
      v1: mkMat(VORTEX_FRAG, { uArms: { value: 5 }, uDir: { value: 1 }, uAlpha: { value: 1 } }),
      v2: mkMat(VORTEX_FRAG, { uArms: { value: 3 }, uDir: { value: -1.5 }, uAlpha: { value: 0.8 } }),
      corona: mkMat(CORONA_FRAG, { uK: { value: 1 } }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useFrame((state) => {
    const g = root.current;
    if (!g || !g.parent?.visible) return;
    const t = fx.t;
    const pn = progressRef.current;
    const em = warpAt(pn).emerge;
    const k = smooth01(em / 0.55);
    sk.e = em;
    for (const m of Object.values(mats)) m.uniforms.uTime.value = t;
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    mats.shell.uniforms.uK.value = k;
    mats.corona.uniforms.uK.value = k;
    sk.c = saCollapse(pn);
    g.scale.setScalar((0.4 + 0.6 * k) * (1 - 0.55 * smooth01(sk.c)));
    face.current?.quaternion.copy(state.camera.quaternion);
    const p = Math.sin(t * 1.1);
    halo.current?.scale.setScalar((9 + p * 0.5) * (1 + (1 - k) * 0.6));
    heart.current?.scale.setScalar((2.3 + p * 0.25) * (1 + (1 - k) * 1.4));
    if (fl1.current) fl1.current.material.rotation = t * 0.05;
    if (fl2.current) fl2.current.material.rotation = Math.PI / 2.6 - t * 0.04;
  });
  const D = SUN_R * 2 * 0.98;
  return (
    <group ref={root} position={CORE}>
      <sprite ref={halo} scale={[9, 9, 1]} renderOrder={1}>
        <spriteMaterial map={glow} color={TEAL} transparent opacity={0.38} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <group ref={face}>
        <mesh material={mats.corona} renderOrder={3}>
          <planeGeometry args={[SUN_R * 2 * 3.5, SUN_R * 2 * 3.5]} />
        </mesh>
        <mesh material={mats.v1} renderOrder={5} position={[0, 0, 0.05]}>
          <planeGeometry args={[D, D]} />
        </mesh>
        <mesh material={mats.v2} renderOrder={5} position={[0, 0, 0.1]} scale={0.72}>
          <planeGeometry args={[D, D]} />
        </mesh>
      </group>
      <mesh material={mats.shell} renderOrder={4}>
        <sphereGeometry args={[SUN_R, 64, 40]} />
      </mesh>
      <mesh renderOrder={6}>
        <sphereGeometry args={[SUN_R * 1.02, 64, 40]} />
        <meshPhysicalMaterial color="#7ffff0" roughness={0.02} metalness={0} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={2.8} transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <sprite ref={heart} scale={[2.3, 2.3, 1]} renderOrder={7}>
        <spriteMaterial map={glow} color={TEAL_LIGHT} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite ref={fl1} scale={[8, 0.55, 1]} renderOrder={7}>
        <spriteMaterial map={streak} color={TEAL_LIGHT} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite ref={fl2} scale={[5.5, 0.4, 1]} renderOrder={7}>
        <spriteMaterial map={streak} color={CYAN} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      {/* thin tilted ring hugging the sun */}
      <group rotation={[1.2, 0, -0.32]}>
        <mesh renderOrder={6}>
          <torusGeometry args={[SUN_R * 1.5, 0.011, 8, 200]} />
          <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Orbit paths: thin glowing ellipses on the tilted orbital planes. */
function OrbitLines() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const halos = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(() => {
    const e = 1 - Math.pow(1 - sk.e, 2.2);
    for (let i = 0; i < ORBITS.length; i++) {
      const g = groups.current[i];
      if (!g || !g.parent?.parent?.visible) continue;
      g.scale.setScalar(Math.max(1e-4, e * condR(sk.c)));
      g.rotation.z = ORBITS[i].zeta + condSpin(sk.c);
      const m = mats.current[i];
      const h = halos.current[i];
      if (m) m.userData.mul = e;
      if (h) h.userData.mul = e;
    }
  });
  return (
    <group position={CORE}>
      {ORBITS.map((o, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          rotation={[o.tau, 0, o.zeta]}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[SQ, 1, 1]} renderOrder={3}>
            <torusGeometry args={[o.r, 0.011, 6, 260]} />
            <meshBasicMaterial
              ref={(el) => {
                mats.current[i] = el;
              }}
              color={i % 2 ? TEAL_LIGHT : CYAN}
              transparent
              opacity={0.62 - i * 0.05}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              fog={false}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[SQ, 1, 1]} renderOrder={3}>
            <torusGeometry args={[o.r, 0.07, 6, 260]} />
            <meshBasicMaterial
              ref={(el) => {
                halos.current[i] = el;
              }}
              color={TEAL_DEEP}
              transparent
              opacity={0.13}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Asteroid-belt dust drifting on the same orbits (Kepler speeds). */
const DUST = 110;
function dustUpdate(t: number, pos: Float32Array) {
  const e = 1 - Math.pow(1 - sk.e, 2.2);
  for (let i = 0; i < DUST; i++) {
    const o = i % ORBITS.length;
    const r = ORBITS[o].r + (((i * 37) % 17) / 17 - 0.5) * 0.5;
    const th = i * 2.399 + W0 * t - (1 - e) * 2.4 + condSpin(sk.c);
    tv.set(Math.cos(th) * r * SQ, 0, Math.sin(th) * r).applyQuaternion(orbitQ[o]).multiplyScalar(e * condR(sk.c));
    const k = i * 3;
    pos[k] = CORE.x + tv.x;
    pos[k + 1] = CORE.y + tv.y;
    pos[k + 2] = CORE.z + tv.z;
  }
}

function Planets() {
  const root = useRef<THREE.Group>(null);
  const { progressRef } = useJourneyProgress();
  const grp = useRef<(THREE.Group | null)[]>([]);
  const pieces = useRef<(THREE.Object3D | null)[][]>(ITEMS.map(() => []));
  const P = useMemo(() => ITEMS.map(() => new THREE.Vector3()), []);
  const [fontsReady, setFontsReady] = useState(0);
  const glow = getRadialGlow();
  const hoverIdx = useRef(-1);
  const tipKey = useRef("");
  const ptr = useRef({ x: 0, y: 0 });
  const tipV = useRef(new THREE.Vector3());
  const hov = useRef<number[]>(ITEMS.map(() => 0));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skillsFocus.idx = -1;
    };
    const onClick = () => {
      if (skillsFocus.idx >= 0 && performance.now() - skillsFocus.setAt > 80) skillsFocus.idx = -1;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
      skillsFocus.idx = -1;
      skillsTip.hide();
      document.body.style.cursor = "";
    };
  }, []);

  useEffect(() => {
    let live = true;
    void document.fonts
      ?.load("700 52px 'IBM Plex Sans'")
      .then(() => live && setFontsReady(1))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  const textures = useMemo(() => {
    void fontsReady;
    return ITEMS.map(makeTileTexture);
  }, [fontsReady]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const face = useMemo(() => roundedRectGeometry(1, 1, 0.24), []);
  useEffect(() => () => face.dispose(), [face]);

  const fadeV = useMemo(() => new THREE.Vector3(), []);
  const tbRef = useRef({ v: 0, n: 0 });
  useFrame((state) => {
    const r = root.current;
    if (!r || !r.parent?.visible) {
      skillsFocus.idx = -1;
      if (tipKey.current) {
        tipKey.current = "";
        skillsTip.hide();
      }
      if (hoverIdx.current >= 0) {
        hoverIdx.current = -1;
        skillsTip.hide();
        document.body.style.cursor = "";
      }
      return;
    }
    const t = fx.t;
    const em = warpAt(progressRef.current).emerge;
    const cc = saCollapse(progressRef.current);
    sk.e = em;
    sk.c = cc;
    const eR = 1 - Math.pow(1 - em, 2.2);
    const eS = smooth01((em - 0.15) / 0.7) * (1 - 0.85 * smooth01(cc));
    const camQ = state.camera.quaternion;
    const tbs = tbRef.current;
    if (state.size.width / state.size.height < 0.9) {
      if (++tbs.n % 20 === 1) {
        const l = document.querySelector("#skills .skills-link") ?? document.querySelector("#skills .journey-lead");
        tbs.v = l ? l.getBoundingClientRect().bottom + 8 : 0;
      }
    } else tbs.v = 0;
    for (let i = 0; i < N; i++) {
      const it = ITEMS[i];
      const g = grp.current[i];
      if (!g) continue;
      const p = P[i];
      if (it.parent === undefined) {
        const o = ORBITS[it.orbit];
        const th = it.phase + W0 * t - (1 - eR) * 2.4 + condSpin(cc);
        p.set(Math.cos(th) * o.r * SQ, 0, Math.sin(th) * o.r).applyQuaternion(orbitQ[it.orbit]).multiplyScalar(eR * condR(cc));
        // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
        p.x += CORE.x;
        p.y += CORE.y;
        p.z += CORE.z;
      } else {
        const pp = P[it.parent];
        const th = it.phase + (it.mw ?? 1) * t;
        const mr = (it.mr ?? 1) * eR * condR(cc);
        tv.set(Math.cos(th) * mr, 0, Math.sin(th) * mr).applyQuaternion(moonQ);
        p.copy(pp).add(tv);
      }
      const persp = Math.pow(Math.min(1.6, Math.max(0.5, -p.z / DIST)), 0.6);
      const sc = Math.max(1e-4, it.size * persp * eS);
      const hTarget = hoverIdx.current === i || skillsFocus.idx === i ? 1 : 0;
      hov.current[i] += (hTarget - hov.current[i]) * 0.15;
      g.position.copy(p);
      let tf = 1;
      if (tbs.v > 0) {
        // phone: tiles dissolve (shrink) as they drift up under the heading / lead copy
        g.getWorldPosition(fadeV);
        fadeV.project(state.camera);
        const py = (1 - fadeV.y) * 0.5 * state.size.height;
        tf = smooth01((py - (tbs.v - 60)) / 90);
      }
      g.scale.setScalar(Math.max(1e-4, sc * tf * (1 + hov.current[i] * 0.14)));
      if (skillsFocus.idx === i) g.getWorldPosition(skillsFocus.pos);
      // billboard toward the camera, then a slow turntable-style sway so each tile "rotates" yet stays legible
      const ph = i * 1.7;
      eSway.set(0.18 * Math.sin(t * 0.37 + ph * 1.3), 0.5 * Math.sin(t * 0.45 + ph), 0.07 * Math.sin(t * 0.3 + ph));
      qSway.setFromEuler(eSway);
      g.quaternion.copy(camQ).multiply(qSway);
      const base = (p.z < CORE.z ? 2 : 8) + (p.z + 40) * 0.01;
      const ps = pieces.current[i];
      for (let j = 0; j < ps.length; j++) {
        const o = ps[j];
        if (o) o.renderOrder = base + j * 0.0001;
      }
    }
    // Tooltip follows the hovered planet (pointer) or, when none, the focused planet (projected); hidden otherwise.
    const hi = hoverIdx.current;
    const fi = skillsFocus.idx;
    const ti = hi >= 0 ? hi : fi;
    const key = hi >= 0 ? `h${hi}` : fi >= 0 ? `f${fi}` : "";
    if (key !== tipKey.current) {
      tipKey.current = key;
      if (ti >= 0) skillsTip.show(ITEMS[ti].label, ptr.current.x, ptr.current.y);
      else skillsTip.hide();
    }
    if (hi >= 0) {
      skillsTip.move(ptr.current.x, ptr.current.y);
    } else if (fi >= 0) {
      const gf = grp.current[fi];
      if (gf) {
        const v = tipV.current;
        gf.getWorldPosition(v);
        v.project(state.camera);
        const rc = state.gl.domElement.getBoundingClientRect();
        skillsTip.move(rc.left + (v.x * 0.5 + 0.5) * rc.width + 70, rc.top + (-v.y * 0.5 + 0.5) * rc.height - 30);
      }
    }
  });

  const reg = (i: number, j: number) => (el: THREE.Object3D | null) => {
    pieces.current[i][j] = el;
  };
  return (
    <group ref={root}>
      {ITEMS.map((it, i) => (
        <group
          key={it.label}
          ref={(el) => {
            grp.current[i] = el;
          }}
          onPointerOver={(e) => {
            if (!root.current?.parent?.visible || sk.e < 0.6) return;
            e.stopPropagation();
            hoverIdx.current = i;
            document.body.style.cursor = "pointer";
            ptr.current.x = e.nativeEvent.clientX;
            ptr.current.y = e.nativeEvent.clientY;
          }}
          onPointerMove={(e) => {
            if (hoverIdx.current === i) {ptr.current.x = e.nativeEvent.clientX; ptr.current.y = e.nativeEvent.clientY;}
          }}
          onPointerOut={() => {
            if (hoverIdx.current === i) {
              hoverIdx.current = -1;
              document.body.style.cursor = "";
              skillsTip.hide();
            }
          }}
          onClick={(e) => {
            if (!root.current?.parent?.visible || sk.e < 0.6) return;
            e.stopPropagation();
            hoverIdx.current = -1;
            document.body.style.cursor = "";
            skillsFocus.idx = skillsFocus.idx === i ? -1 : i;
            skillsFocus.setAt = performance.now();
          }}
        >
          <sprite position={[0, -0.6, -0.08]} scale={[1.55, 0.5, 1]} visible={!isLowTier()}>
            <spriteMaterial map={getSoftShadowTex()} transparent opacity={0.3} depthWrite={false} fog={false} />
          </sprite>
          <sprite ref={reg(i, 0)} position={[0, 0, -0.05]} scale={[2.1, 2.1, 1]}>
            <spriteMaterial map={glow} color={TEAL} transparent opacity={it.parent === undefined ? 0.2 : 0.14} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
          {it.ring && (
            <group rotation={[1.0, 0, 0.3]}>
              <mesh ref={reg(i, 1)}>
                <torusGeometry args={[0.92, 0.014, 8, 120, Math.PI]} />
                <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
              </mesh>
              <mesh ref={reg(i, 1)} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.92, 0.014, 8, 120, Math.PI]} />
                <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
              </mesh>
            </group>
          )}
          <mesh ref={reg(i, 2)}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={textures[i]} transparent depthWrite={false} fog={false} toneMapped={false} />
          </mesh>
          {it.glass && (
            <mesh ref={reg(i, 3)} geometry={face} position={[0, 0, 0.02]}>
              <meshPhysicalMaterial color="#c8fff6" roughness={0.04} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={2.6} transparent opacity={0.09} depthWrite={false} />
            </mesh>
          )}
          {it.ring && (
            <group rotation={[1.0, 0, 0.3]}>
              <mesh ref={reg(i, 4)}>
                <torusGeometry args={[0.92, 0.018, 8, 120, Math.PI]} />
                <meshBasicMaterial color="#d8fff8" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/** Faint nebula clouds far behind the system (parallax against the stars and planets as the camera drifts). */
const NEB: Array<{ p: [number, number, number]; s: number; c: string; o: number; k: number; w: number }> = [
  { p: [-3, 2.5, -30], s: 26, c: TEAL_DEEP, o: 0.26, k: 0, w: 0.012 },
  { p: [10, -2, -34], s: 30, c: "#1d4a9a", o: 0.2, k: 1, w: -0.009 },
  { p: [3, 5, -40], s: 38, c: "#3a2f8f", o: 0.15, k: 2, w: 0.007 },
  { p: [-9, -4, -27], s: 20, c: TEAL, o: 0.12, k: 1, w: -0.014 },
  { p: [13, 3.5, -27], s: 18, c: "#0a6e8f", o: 0.18, k: 0, w: 0.011 },
  { p: [4, -6, -36], s: 28, c: "#17607a", o: 0.14, k: 2, w: -0.008 },
];
function Nebula() {
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(() => {
    const t = fx.t;
    for (let i = 0; i < NEB.length; i++) {
      const s = refs.current[i];
      if (s && s.parent?.visible) s.material.rotation = t * NEB[i].w + i;
    }
  });
  return (
    <>
      {NEB.map((n, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={n.p}
          scale={[n.s, n.s, 1]}
          renderOrder={0}
        >
          <spriteMaterial map={getCloud(n.k)} color={n.c} transparent opacity={n.o} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      ))}
    </>
  );
}

export default function SkillsOrbit() {
  return (
    <StationGroup id="skills">
      <Nebula />
      {/* starfield layers at different depths => parallax */}
      <SoftPoints count={520} box={[26, 12, 12]} center={[2, 0, -13]} size={0.02} sizeVar={0.02} opacity={0.5} seed={51} />
      <SoftPoints count={1100} box={[70, 36, 30]} center={[3, 0, -26]} size={0.03} sizeVar={0.05} opacity={0.75} seed={61} colors={["#d6ecff", "#8fd8ff"]} depthFade={0.004} />
      <SoftPoints count={260} box={[16, 9, 6]} center={[CORE.x, CORE.y, CORE.z]} size={0.028} sizeVar={0.03} opacity={0.8} seed={57} />
      <SoftPoints count={10} box={[18, 9, 8]} center={[2, 0, -9]} size={0.55} sizeVar={0.7} opacity={0.12} bokeh seed={53} depthFade={0.004} />
      <OrbitLines />
      <Sun />
      <Planets />
      <MotionPoints count={DUST} update={dustUpdate} size={0.1} opacity={0.65} />
    </StationGroup>
  );
}
