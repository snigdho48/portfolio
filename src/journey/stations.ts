import * as THREE from "three";
import { STATION_Z, smooth, clamp01 } from "./layout";

/** Named scroll stations along the 3D journey (progress 0 -> 1). */
export const JOURNEY_STATIONS = [
  { id: "hero", label: "Home", t: 0 },
  { id: "work", label: "Work", t: 0.2 },
  { id: "experience", label: "Experience", t: 0.4 },
  { id: "skills", label: "Skills", t: 0.6 },
  { id: "about", label: "About", t: 0.8 },
  { id: "contact", label: "Contact", t: 1 },
] as const;

export type JourneyStationId = (typeof JOURNEY_STATIONS)[number]["id"];

type Pose = { z: number; pos: THREE.Vector3; look: THREE.Vector3 };

const zs = JOURNEY_STATIONS.map((s) => STATION_Z[s.id]);

/** Per-station camera pose in station-local space. */
const POSES: Pose[] = [
  { z: zs[0], pos: new THREE.Vector3(0, 2.1, 8.5), look: new THREE.Vector3(0, 0.5, 0) },
  ...zs.slice(1).map((z) => ({
    z,
    pos: new THREE.Vector3(0, 0, 0),
    look: new THREE.Vector3(0, 0, -10),
  })),
];

const tmpA = new THREE.Vector3();

/**
 * Camera dwells at every station (30% plateau each side) and glides between
 * them with smoothstep easing.
 */
export function cameraAt(
  progress: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
) {
  const idx = Math.min(4.9999, Math.max(0, progress / 0.2));
  const k = Math.floor(idx);
  const f = idx - k;
  const e = smooth(clamp01((f - 0.3) / 0.4));
  const a = POSES[k];
  const b = POSES[k + 1];
  outPos.set(a.pos.x, a.pos.y, a.z + a.pos.z);
  tmpA.set(b.pos.x, b.pos.y, b.z + b.pos.z);
  outPos.lerp(tmpA, e);
  outLook.set(a.look.x, a.look.y, a.z + a.look.z);
  tmpA.set(b.look.x, b.look.y, b.z + b.look.z);
  outLook.lerp(tmpA, e);
}