import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { getRadialGlow } from "./glow";
import { TEAL } from "./layout";

const _ndc = new THREE.Vector3();
const _dir = new THREE.Vector3();

/** Faint teal glow that follows the pointer in screen space (one sprite, no lights). */
export default function CursorGlow3D() {
  const ref = useRef<THREE.Sprite>(null);
  const { pointerRef, progressRef } = useJourneyProgress();
  const camera = useThree((s) => s.camera);
  const glow = getRadialGlow();
  const smooth = useRef(new THREE.Vector2());

  useFrame(() => {
    const sp = ref.current;
    if (!sp) return;
    smooth.current.x += (pointerRef.current.x - smooth.current.x) * 0.1;
    smooth.current.y += (pointerRef.current.y - smooth.current.y) * 0.1;
    _ndc.set(smooth.current.x, smooth.current.y, 0.5).unproject(camera);
    _dir.copy(_ndc).sub(camera.position).normalize();
    sp.position.copy(camera.position).addScaledVector(_dir, 9);
    sp.visible = progressRef.current < 0.93;
  });

  return (
    <sprite ref={ref} scale={[5, 5, 1]} renderOrder={0}>
      <spriteMaterial map={glow} color={TEAL} transparent opacity={0.07} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}