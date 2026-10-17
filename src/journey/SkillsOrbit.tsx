import { useEffect, useMemo, useRef, useState } from "react";
import { fx } from "./scrollFx";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import MotionPoints from "./MotionPoints";
import { getRadialGlow } from "./glow";
import { TEAL, TEAL_DEEP, TEAL_LIGHT, CYAN, ndcToLocal } from "./layout";
import { TECH_ICONS } from "./techIcons";
import { roundedRectGeometry } from "./shapes";

/** Sphere centre (NDC at depth 12) - right half of the frame, like the reference. */
const CORE = ndcToLocal(0.33, 0.07, 12);
const DIST = 12;
const SPHERE_R = 1.4;

/** Tile ring: loose ellipse around the sphere (units at depth 12). */
const A = 3.05;
const B = 2.6;
const TILE = 1.6;
type TileDef = { key: string; deg: number };
/** Clockwise from 12 o'clock: Django, React, AWS, Docker, Flutter, Python. */
const TILES: TileDef[] = [
  { key: "django", deg: 0 },
  { key: "react", deg: 60 },
  { key: "aws", deg: 120 },
  { key: "docker", deg: 180 },
  { key: "flutter", deg: 240 },
  { key: "python", deg: 300 },
];

/** Shared quaternions (module level => no per-frame allocation). */
const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.3, 0, 0));
const qWide = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.08, 0, 0.12));
const tv = new THREE.Vector3();

function makeTileTexture(c: TileDef): THREE.CanvasTexture {
  const icon = TECH_ICONS[c.key];
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
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
  rr(M, M, S - 2 * M, S - 2 * M, R);
  ctx.clip();
  // frosted body: dark teal base + milky diagonal gradient
  ctx.fillStyle = "rgba(6,22,26,0.5)";
  ctx.fillRect(0, 0, S, S);
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, "rgba(205,240,240,0.30)");
  g.addColorStop(0.55, "rgba(120,185,190,0.12)");
  g.addColorStop(1, "rgba(60,150,150,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // top-left specular sheen
  const sh = ctx.createRadialGradient(130, 90, 0, 130, 90, 300);
  sh.addColorStop(0, "rgba(255,255,255,0.38)");
  sh.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, S, S);
  // bottom teal bounce
  const bt = ctx.createLinearGradient(0, S * 0.6, 0, S);
  bt.addColorStop(0, "rgba(31,227,194,0)");
  bt.addColorStop(1, "rgba(31,227,194,0.28)");
  ctx.fillStyle = bt;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();
  // bright rim (white top-left -> teal bottom-right) + inner hairline
  const rim = ctx.createLinearGradient(0, 0, S, S);
  rim.addColorStop(0, "rgba(255,255,255,0.98)");
  rim.addColorStop(0.5, "rgba(190,240,236,0.45)");
  rim.addColorStop(1, "rgba(80,240,215,0.85)");
  rr(M, M, S - 2 * M, S - 2 * M, R);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 7;
  ctx.stroke();
  rr(M + 11, M + 11, S - 2 * M - 22, S - 2 * M - 22, R - 11);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // monochrome logo
  const L = 214;
  ctx.save();
  ctx.translate(S / 2 - L / 2, 62);
  ctx.scale(L / 24, L / 24);
  ctx.fillStyle = "rgba(240,246,247,0.96)";
  ctx.shadowColor = "rgba(150,255,240,0.55)";
  ctx.shadowBlur = 18;
  ctx.fill(new Path2D(icon.path));
  ctx.restore();
  // label
  ctx.fillStyle = "rgba(244,248,249,0.96)";
  ctx.font = "700 52px 'IBM Plex Sans', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "3px";
  ctx.fillText(icon.label.toUpperCase(), S / 2, 408, S - 90);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const CORE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
void main(){
  vP = position;
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
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
void main(){
  vec3 V = normalize(-vView);
  float ndv = clamp(dot(normalize(vN), V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.6);
  float rim = pow(1.0 - ndv, 6.0);
  float pulse = 0.94 + 0.06 * sin(uTime * 1.1);
  vec3 deep = vec3(0.01, 0.2, 0.24);
  vec3 mid = vec3(0.14, 0.9, 0.78);
  vec3 col = deep * (0.5 + 0.5 * ndv) + mid * fres * 0.9 + vec3(0.8, 1.0, 0.97) * rim * 0.9;
  float a = (0.16 + 0.5 * fres + 0.5 * rim) * pulse;
  gl_FragColor = vec4(col, a * uFade);
}
`;

const VORTEX_VERT = /* glsl */ `
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
  float hot = exp(-r * r * 20.0);
  float halo = exp(-r * 3.2) * 0.22;
  float I = (arm * 0.8 + fine * 0.7) * mask + hot * 1.1 + halo;
  vec3 col = mix(vec3(0.1, 0.85, 0.74), vec3(0.88, 1.0, 0.98), clamp(hot * 1.4 + arm * 0.25, 0.0, 1.0));
  gl_FragColor = vec4(col * I, min(I, 1.0) * uAlpha * uFade);
}
`;

function makeShellMat() {
  return new THREE.ShaderMaterial({
    vertexShader: CORE_VERT,
    fragmentShader: CORE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
  });
}
function makeVortexMat(arms: number, dir: number, alpha: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VORTEX_VERT,
    fragmentShader: VORTEX_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uArms: { value: arms },
      uDir: { value: dir },
      uAlpha: { value: alpha },
    },
  });
}

function EnergyCore() {
  const shell = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const heart = useRef<THREE.Sprite>(null);
  const glow = getRadialGlow();
  const mats = useMemo(
    () => ({ shell: makeShellMat(), v1: makeVortexMat(5, 1, 1), v2: makeVortexMat(3, -1.5, 0.8) }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useFrame(() => {
    const t = fx.t;
    mats.shell.uniforms.uTime.value = t;
    mats.v1.uniforms.uTime.value = t;
    mats.v2.uniforms.uTime.value = t;
    const p = Math.sin(t * 1.1);
    shell.current?.scale.setScalar(1 + p * 0.02);
    halo.current?.scale.setScalar(8 + p * 0.4);
    heart.current?.scale.setScalar(2 + p * 0.25);
  });
  return (
    <group position={CORE}>
      <sprite ref={halo} scale={[8, 8, 1]} renderOrder={1}>
        <spriteMaterial map={glow} color={TEAL} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <mesh ref={shell} material={mats.shell} renderOrder={4}>
        <sphereGeometry args={[SPHERE_R, 64, 40]} />
      </mesh>
      <mesh material={mats.v1} renderOrder={5} position={[0, 0, 0.05]}>
        <planeGeometry args={[SPHERE_R * 2 * 0.98, SPHERE_R * 2 * 0.98]} />
      </mesh>
      <mesh material={mats.v2} renderOrder={5} position={[0, 0, 0.1]} scale={0.72}>
        <planeGeometry args={[SPHERE_R * 2 * 0.98, SPHERE_R * 2 * 0.98]} />
      </mesh>
      <mesh renderOrder={6}>
        <sphereGeometry args={[SPHERE_R * 1.02, 64, 40]} />
        <meshPhysicalMaterial color="#7ffff0" roughness={0.02} metalness={0} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={2.8} transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <sprite ref={heart} scale={[2, 2, 1]} renderOrder={7}>
        <spriteMaterial map={glow} color={TEAL_LIGHT} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

const SPARKS = 64;
const SPARK_R = [1.9, 2.5, 3.1, 3.75];
function sparksUpdate(t: number, pos: Float32Array) {
  for (let i = 0; i < SPARKS; i++) {
    const wide = i % 3 === 0;
    const r = wide ? 3.75 : SPARK_R[i % 3];
    const dir = i % 2 ? 1 : -1;
    const th = i * 2.399 + t * dir * (0.16 + (i % 5) * 0.045);
    tv.set(Math.cos(th) * r, Math.sin(th) * r, 0).applyQuaternion(wide ? qWide : qFlat);
    const k = i * 3;
    pos[k] = CORE.x + tv.x;
    pos[k + 1] = CORE.y + tv.y - (wide ? 0.25 : 1.05);
    pos[k + 2] = CORE.z + tv.z;
  }
}

const RIPPLES = 4;

function Rings() {
  const ripples = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const halos = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const wide = useRef<THREE.Group>(null);
  const glow = getRadialGlow();
  useFrame(() => {
    const t = fx.t;
    for (let k = 0; k < RIPPLES; k++) {
      const g = ripples.current[k];
      if (!g) continue;
      const ph = (t * 0.085 + k / RIPPLES) % 1;
      const s = 1.35 + ph * 2.6;
      g.scale.set(s, s, 1);
      const f = Math.sin(Math.PI * ph);
      const m = mats.current[k];
      const h = halos.current[k];
      if (m) m.userData.mul = f;
      if (h) h.userData.mul = f;
    }
    if (wide.current) {
      wide.current.rotation.z = 0.12 + Math.sin(t * 0.19) * 0.03;
      wide.current.rotation.x = 1.08 + Math.sin(t * 0.23) * 0.025;
    }
  });
  return (
    <group position={CORE}>
      {/* soft light pool under the sphere */}
      <mesh position={[0, -1.1, 0]} rotation={[1.3, 0, 0]} renderOrder={1}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={glow} color={TEAL} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* flat horizontal ripple rings */}
      <group position={[0, -1.1, 0]} rotation={[1.3, 0, 0]}>
        {Array.from({ length: RIPPLES }, (_, k) => (
          <group key={k} ref={(el) => { ripples.current[k] = el; }}>
            <mesh renderOrder={2}>
              <torusGeometry args={[1, 0.0065, 6, 200]} />
              <meshBasicMaterial ref={(el) => { mats.current[k] = el; }} color={k % 2 ? TEAL_LIGHT : TEAL} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
            </mesh>
            <mesh renderOrder={2}>
              <torusGeometry args={[1, 0.04, 6, 200]} />
              <meshBasicMaterial ref={(el) => { halos.current[k] = el; }} color={TEAL} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      {/* ring wrapping the sphere */}
      <group rotation={[1.2, 0, -0.32]} position={[0, 0.05, 0]}>
        <mesh renderOrder={6}>
          <torusGeometry args={[SPHERE_R * 1.45, 0.012, 8, 200]} />
          <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={6}>
          <torusGeometry args={[SPHERE_R * 1.45, 0.07, 8, 200]} />
          <meshBasicMaterial color={TEAL} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
      </group>
      {/* thin wide tilted orbit ring */}
      <group ref={wide} rotation={[1.08, 0, 0.12]} position={[0, -0.25, 0]}>
        <mesh renderOrder={3}>
          <torusGeometry args={[3.75, 0.013, 8, 260]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.65} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={3}>
          <torusGeometry args={[3.75, 0.09, 8, 260]} />
          <meshBasicMaterial color={TEAL_DEEP} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Tiles() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const [fontsReady, setFontsReady] = useState(0);
  const glow = getRadialGlow();

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
    return TILES.map(makeTileTexture);
  }, [fontsReady]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const face = useMemo(() => roundedRectGeometry(TILE, TILE, 0.3), []);
  useEffect(() => () => face.dispose(), [face]);

  useFrame(() => {
    const t = fx.t;
    for (let i = 0; i < TILES.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      // loose float around the clock position (slow orbit sway + bob)
      const th = (TILES[i].deg * Math.PI) / 180 + 0.2 * Math.sin(t * 0.22 + i * 1.3);
      const sx = Math.sin(th);
      const cy = Math.cos(th);
      const x = A * sx;
      const y = B * cy + 0.1 * Math.sin(t * 0.55 + i * 2.1);
      const zo = -cy * 0.5; // front tiles come forward a little
      const z = CORE.z + zo;
      m.position.set(CORE.x + x, CORE.y + y, z);
      m.scale.setScalar(-z / DIST);
      m.rotation.set(-cy * 0.16 + Math.sin(t * 0.4 + i) * 0.04, sx * 0.24 + Math.cos(t * 0.33 + i) * 0.04, Math.sin(t * 0.3 + i * 0.7) * 0.025);
    }
  });

  return (
    <>
      {TILES.map((c, i) => (
        <mesh
          key={c.key}
          renderOrder={8}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <planeGeometry args={[TILE, TILE]} />
          <meshBasicMaterial map={textures[i]} transparent depthWrite={false} fog={false} toneMapped={false} />
          <mesh geometry={face} position={[0, 0, 0.02]}>
            <meshPhysicalMaterial color="#c8fff6" roughness={0.04} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={2.6} transparent opacity={0.09} depthWrite={false} />
          </mesh>
          <sprite position={[0, 0, -0.05]} scale={[2.6, 2.6, 1]}>
            <spriteMaterial map={glow} color={TEAL} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
        </mesh>
      ))}
    </>
  );
}

export default function SkillsOrbit() {
  return (
    <StationGroup id="skills">
      <SoftPoints count={520} box={[26, 12, 12]} center={[2, 0, -13]} size={0.02} sizeVar={0.02} opacity={0.55} seed={51} />
      <SoftPoints count={320} box={[8, 6.5, 4]} center={[CORE.x, CORE.y, CORE.z]} size={0.028} sizeVar={0.03} opacity={0.85} seed={57} />
      <SoftPoints count={10} box={[18, 9, 8]} center={[2, 0, -9]} size={0.55} sizeVar={0.7} opacity={0.12} bokeh seed={53} depthFade={0.004} />
      <EnergyCore />
      <Rings />
      <Tiles />
      <MotionPoints count={SPARKS} update={sparksUpdate} size={0.2} opacity={0.9} />
    </StationGroup>
  );
}