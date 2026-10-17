import { useEffect, useMemo, useRef } from "react";
import { fx } from "./scrollFx";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRadialGlow } from "./glow";
import { TEAL, TEAL_LIGHT } from "./layout";

/** Slowly rotating wireframe 3D accent with a soft teal glow. */
export default function WireAccent({
  kind,
  position,
  radius = 1.3,
  opacity = 0.4,
  speed = 0.12,
  glowScale = 7,
}: {
  kind: "ico" | "knot";
  position: [number, number, number];
  radius?: number;
  opacity?: number;
  speed?: number;
  glowScale?: number;
}) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);
  const glow = getRadialGlow();
  const geos = useMemo(
    () => ({
      outer:
        kind === "ico"
          ? new THREE.IcosahedronGeometry(radius, 1)
          : new THREE.TorusKnotGeometry(radius * 0.8, radius * 0.22, 110, 7, 2, 3),
      inner: new THREE.OctahedronGeometry(radius * 0.52, 0),
      gem: new THREE.IcosahedronGeometry(radius * 0.97, 0),
    }),
    [kind, radius],
  );
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  useFrame(() => {
    const g = grp.current;
    if (!g || !g.parent?.visible) return;
    const t = fx.t;
    g.position.y = position[1] + Math.sin(t * 0.5) * 0.18;
    if (outer.current) {
      outer.current.rotation.x = t * speed;
      outer.current.rotation.y = t * speed * 1.4;
    }
    if (inner.current) {
      inner.current.rotation.x = -t * speed * 1.8;
      inner.current.rotation.z = t * speed * 1.2;
    }
  });

  return (
    <group ref={grp} position={position}>
      <sprite scale={[glowScale, glowScale, 1]}>
        <spriteMaterial map={glow} color={TEAL} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <mesh ref={outer} geometry={geos.outer}>
        {kind === "ico" && (
          <mesh geometry={geos.gem}>
            <meshPhysicalMaterial color="#0e4a47" metalness={0.65} roughness={0.12} flatShading clearcoat={1} envMapIntensity={2.2} transparent opacity={0.6} depthWrite={false} />
          </mesh>
        )}
        <meshBasicMaterial color={TEAL} wireframe transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </mesh>
      <mesh ref={inner} geometry={geos.inner}>
        <meshBasicMaterial color={TEAL_LIGHT} wireframe transparent opacity={opacity * 1.6} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}