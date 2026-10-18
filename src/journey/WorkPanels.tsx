import { useEffect, useMemo, useRef } from "react";
import { fx } from "./scrollFx";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRibbonCurve, getWorkPanelData } from "./workPath";
import { useJourneyProgress } from "./JourneyProgressContext";
import WorkPanel from "./WorkPanel";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow, getStreak } from "./glow";
import MotionPoints from "./MotionPoints";

const _rp = new THREE.Vector3();
const RIBBON_PULSES = 12;
function RibbonPulses() {
  const curve = useMemo(() => createRibbonCurve(), []);
  const update = useMemo(
    () => (t: number, pos: Float32Array) => {
      for (let j = 0; j < RIBBON_PULSES; j++) {
        const u = (t * 0.11 + j / RIBBON_PULSES) % 1;
        curve.getPointAt(u, _rp);
        pos[j * 3] = _rp.x;
        pos[j * 3 + 1] = _rp.y;
        pos[j * 3 + 2] = _rp.z + 0.05;
      }
    },
    [curve],
  );
  return <MotionPoints count={RIBBON_PULSES} update={update} size={0.34} opacity={0.9} />;
}
import { TEAL, CYAN, TEAL_LIGHT, ndcToLocal } from "./layout";
import { getCloud, getBeam } from "./panelFx";

/** Camera-facing light ribbon: bright core, soft edges, sweeping back-left -> front-bottom-right. */
function buildRibbon(widthK: number, gain: number) {
  const curve = createRibbonCurve();
  const N = 160;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const teal = new THREE.Color(TEAL);
  const cyan = new THREE.Color(CYAN);
  const white = new THREE.Color(TEAL_LIGHT);
  const view = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = curve.getPointAt(s);
    const tan = curve.getTangentAt(s);
    const side = new THREE.Vector3().crossVectors(tan, view).normalize();
    const w = (0.018 + 0.05 * Math.pow(s, 1.6)) * widthK * (0.6 + 0.4 * s + 0.6);
    const sst = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
    // constant-ish brightness along the path, fading smoothly only well beyond both screen edges
    const a = (0.4 + 0.6 * s) * sst(s / 0.1) * (1 - sst((s - 0.93) / 0.07)) * gain;
    const base = teal.clone().lerp(cyan, 0.4 * (1 - s));
    for (const [off, k] of [
      [-1, 0.0],
      [-0.4, 0.5],
      [0, 1.0],
      [0.4, 0.5],
      [1, 0.0],
    ] as const) {
      const v = p.clone().addScaledVector(side, off * w);
      pos.push(v.x, v.y, v.z);
      const c = k >= 1 ? base.clone().lerp(white, 0.55) : base;
      const m = a * k * (k >= 1 ? 1.8 : 1.2);
      col.push(c.r * m, c.g * m, c.b * m);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < 4; j++) {
      const a = i * 5 + j;
      const b = a + 5;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

function LightRibbon() {
  const geoms = useMemo(
    () => ({ core: buildRibbon(1, 0.75), glow: buildRibbon(5, 0.18), mid: buildRibbon(2.4, 0.4) }),
    [],
  );
  useEffect(() => () => Object.values(geoms).forEach((g) => g.dispose()), [geoms]);

  const end = useMemo(() => createRibbonCurve().getPointAt(0.985), []);
  const beam = useMemo(() => ndcToLocal(0.42, -0.6, 7.2), []);
  const glow = getRadialGlow();
  const streak = getStreak();
  const mat = (
    <meshBasicMaterial
      vertexColors
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      side={THREE.DoubleSide}
      fog={false}
      toneMapped={false}
    />
  );

  return (
    <group>
      <mesh geometry={geoms.glow} renderOrder={-4}>{mat}</mesh>
      <mesh geometry={geoms.mid} renderOrder={-4}>{mat}</mesh>
      <mesh geometry={geoms.core} renderOrder={-3}>{mat}</mesh>
      {/* soft blue beam under the front panel */}
      <mesh position={beam} renderOrder={1}>
        <planeGeometry args={[3.8, 2.6]} />
        <meshBasicMaterial map={getBeam()} color="#35b8ff" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </mesh>
      <sprite position={beam} scale={[3.6, 0.9, 1]} renderOrder={1}>
        <spriteMaterial map={glow} color="#6fd2ff" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      {/* bloom flare at the front end */}
      <sprite position={end} scale={[1.3, 1.3, 1]} renderOrder={3}>
        <spriteMaterial map={glow} color={TEAL} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite position={end} scale={[0.6, 0.6, 1]} renderOrder={4}>
        <spriteMaterial map={glow} color={TEAL_LIGHT} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite position={end} scale={[4.5, 0.35, 1]} renderOrder={3}>
        <spriteMaterial map={streak} color={TEAL_LIGHT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

const SMOKE: Array<[number, number, number, number, number]> = [
  // ndc x, ndc y, depth, size, opacity
  [0.1, -0.35, 16, 16, 0.16],
  [-0.25, 0.0, 22, 20, 0.14],
  [0.55, -0.5, 12, 12, 0.12],
  [-0.4, 0.3, 28, 24, 0.13],
  [0.3, 0.35, 20, 16, 0.1],
  [0.8, 0.1, 15, 11, 0.1],
  [0.35, 0.05, 26, 24, 0.14],
  [0.05, 0.4, 30, 22, 0.12],
  [-0.2, -0.3, 24, 20, 0.12],
  [0.7, 0.45, 24, 18, 0.1],
  [0.2, -0.6, 18, 16, 0.12],
];
const SMOKE_COL = ["#1d7f96", "#14606e", "#2a6fa0"];

/** Layered, noise-textured fog puffs drifting slowly behind and between the panels. */
function Smoke() {
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const items = useMemo(
    () => SMOKE.map(([x, y, d, s, o]) => ({ p: ndcToLocal(x, y, d), s, o })),
    [],
  );
  useFrame(() => {
    const t = fx.t;
    refs.current.forEach((sp, i) => {
      if (!sp) return;
      const b = items[i].p;
      sp.position.set(b.x + Math.sin(t * 0.08 + i) * 0.9, b.y + Math.cos(t * 0.07 + i * 2) * 0.4, b.z);
      (sp.material as THREE.SpriteMaterial).rotation = Math.sin(t * 0.04 + i * 1.7) * 0.7 + i;
    });
  });
  return (
    <>
      {items.map((it, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={it.p}
          scale={[it.s, it.s * 0.62, 1]}
        >
          <spriteMaterial map={getCloud(i)} color={SMOKE_COL[i % 3]} transparent opacity={it.o} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      ))}
    </>
  );
}
export default function WorkPanels() {
  const panels = useMemo(() => getWorkPanelData(), []);
  const { workTargetRef, workIndexRef } = useJourneyProgress();
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 5);
    workIndexRef.current += (workTargetRef.current - workIndexRef.current) * k;
  });
  return (
    <StationGroup id="work">
      <Smoke />
      <LightRibbon />
      <RibbonPulses />
      <SoftPoints count={700} box={[16, 8, 22]} center={[1.5, 0, -14]} size={0.02} sizeVar={0.02} opacity={0.7} seed={21} />
      <SoftPoints count={9} box={[14, 7, 12]} center={[1, 0, -10]} size={0.5} sizeVar={0.5} opacity={0.14} bokeh seed={5} depthFade={0.005} />
      {panels.map((data) => (
        <WorkPanel key={data.slug} data={data} />
      ))}
    </StationGroup>
  );
}