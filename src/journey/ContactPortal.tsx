import { useRef } from "react";
import { fx } from "./scrollFx";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow } from "./glow";
import { TEAL, TEAL_DEEP, TEAL_LIGHT, CYAN, ndcToLocal } from "./layout";
import MotionPoints from "./MotionPoints";
import { useJourneyProgress } from "./JourneyProgressContext";
import { acRings } from "./transitions";
import { portraitAmount } from "./portrait";

const CENTER = ndcToLocal(0, -0.1, 11);

const RINGS = [
  { r: 1.1, t: 0.03, tilt: 0.0, c: TEAL_LIGHT, o: 0.95, s: 0.35 },
  { r: 1.7, t: 0.022, tilt: 0.28, c: TEAL, o: 0.85, s: -0.22 },
  { r: 2.35, t: 0.02, tilt: -0.4, c: CYAN, o: 0.7, s: 0.16 },
  { r: 3.05, t: 0.016, tilt: 0.55, c: TEAL, o: 0.55, s: -0.12 },
  { r: 3.8, t: 0.014, tilt: -0.2, c: TEAL_DEEP, o: 0.5, s: 0.08 },
  { r: 4.6, t: 0.012, tilt: 0.1, c: TEAL_DEEP, o: 0.35, s: -0.05 },
];

const SPARKS = 60;
function sparksUpdate(t: number, pos: Float32Array) {
  for (let i = 0; i < SPARKS; i++) {
    const r = RINGS[i % RINGS.length];
    const th = i * 2.399 + t * r.s * 2.2;
    const k = i * 3;
    pos[k] = CENTER.x + Math.cos(th) * r.r;
    pos[k + 1] = CENTER.y + Math.sin(th) * r.r * Math.cos(r.tilt);
    pos[k + 2] = CENTER.z + Math.sin(th) * r.r * Math.sin(r.tilt) * 0.6;
  }
}

/** Portal made of thin glowing rings and a soft core - never a full-frame wash. */
export default function ContactPortal() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const core = useRef<THREE.Sprite>(null);
  const metal = useRef<THREE.Mesh>(null);
  const glow = getRadialGlow();
  const { progressRef } = useJourneyProgress();

  const portalG = useRef<THREE.Group>(null);
  useFrame(({ size }) => {
    const t = fx.t;
    portalG.current?.scale.setScalar(1 + 0.3 * portraitAmount(size.width / size.height));
    const ex = acRings(progressRef.current);
    rings.current.forEach((m, i) => {
      if (!m) return;
      // About -> Contact: the rings expand from the centre, outer ones a beat later
      const e = Math.min(1, Math.max(0, (ex * 1.35 - i * 0.07) / 0.65));
      m.scale.setScalar(Math.max(1e-3, 1 - Math.pow(1 - e, 3)));
      m.rotation.z = t * RINGS[i].s;
      m.rotation.x = RINGS[i].tilt + Math.sin(t * 0.4 + i) * 0.05;
    });
    if (metal.current) {
      metal.current.scale.setScalar(Math.max(1e-3, 1 - Math.pow(1 - Math.min(1, ex * 2), 3)));
      metal.current.rotation.set(1.1 + Math.sin(t * 0.3) * 0.15, t * 0.35, 0);
    }
    core.current?.scale.setScalar(3.4 + Math.sin(t * 1.4) * 0.15);
  });

  return (
    <StationGroup id="contact">
      <group ref={portalG} position={CENTER}>
        <sprite scale={[9, 9, 1]}>
          <spriteMaterial map={glow} color={TEAL} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
        <sprite ref={core} scale={[3.4, 3.4, 1]}>
          <spriteMaterial map={glow} color={TEAL_LIGHT} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
        <mesh ref={metal} renderOrder={3}>
          <torusGeometry args={[1.45, 0.06, 20, 160]} />
          <meshPhysicalMaterial color="#9ff7ea" metalness={1} roughness={0.2} envMapIntensity={1.8} emissive="#0d8f86" emissiveIntensity={0.5} />
        </mesh>
        {RINGS.map((r, i) => (
          <mesh
            key={i}
            ref={(el) => {
              rings.current[i] = el;
            }}
          >
            <torusGeometry args={[r.r, r.t, 8, 160]} />
            <meshBasicMaterial color={r.c} transparent opacity={r.o} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <MotionPoints count={SPARKS} update={sparksUpdate} size={0.16} opacity={0.9} />
      <SoftPoints count={520} box={[22, 12, 12]} center={[0, 0, -11]} size={0.018} sizeVar={0.02} opacity={0.6} seed={71} drift={0.6} />
    </StationGroup>
  );
}