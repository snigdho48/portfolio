import { useEffect, useMemo, useRef } from "react";
import { fx } from "./scrollFx";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRadialGlow } from "./glow";
import { TEAL_LIGHT } from "./layout";

/** Writes `count` xyz triples for time t into `pos` (no allocation allowed here). */
export type MotionUpdate = (t: number, pos: Float32Array, count: number) => void;

function hidden(o: THREE.Object3D | null) {
  for (let n: THREE.Object3D | null = o; n; n = n.parent) if (!n.visible) return true;
  return false;
}

/**
 * One draw call of glowing travelling points (light pulses, sparks).
 * Positions are written in place each frame; skipped while its station is hidden.
 */
export default function MotionPoints({
  count,
  update,
  size = 0.5,
  color = TEAL_LIGHT,
  opacity = 0.9,
}: {
  count: number;
  update: MotionUpdate;
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: getRadialGlow(),
        size,
        color,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        toneMapped: false,
      }),
    [size, color, opacity],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame(() => {
    if (hidden(ref.current)) return;
    const a = geo.attributes.position as THREE.BufferAttribute;
    update(fx.t, a.array as Float32Array, count);
    a.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={6} />;
}