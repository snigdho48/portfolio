import { useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { stationActive, type StationKey } from "./stationVisibility";
import { STATION_Z, REF_ASPECT } from "./layout";

type Fadeable = {
  mat: THREE.Material;
  base: number;
};

/**
 * Wraps one station's 3D content: exclusive visibility (visible=false outside
 * the range so scenes never overlap), cross-fade via cached material opacity /
 * `uFade` uniforms, and a responsive uniform scale for narrow aspect ratios.
 * Children must never write material.opacity themselves.
 */
export default function StationGroup({
  id,
  children,
}: {
  id: StationKey;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const { progressRef, flyActiveRef } = useJourneyProgress();
  const list = useRef<Fadeable[]>([]);
  const lights = useRef<{ l: THREE.Light; base: number }[]>([]);
  const frame = useRef(0);
  const last = useRef(-1);
  const size = useThree((s) => s.size);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    let active = stationActive(progressRef.current, id);
    if (id === "work" && flyActiveRef.current) active = 1;
    const vis = active > 0.001;
    if (g.visible !== vis) g.visible = vis;
    if (!vis) {
      last.current = -1;
      return;
    }

    const k = Math.min(1, size.width / size.height / REF_ASPECT);
    g.scale.setScalar(k);

    if (frame.current++ % 90 === 0 || list.current.length === 0) {
      const mats = new Set<THREE.Material>();
      const ls: { l: THREE.Light; base: number }[] = [];
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (m) (Array.isArray(m) ? m : [m]).forEach((x) => mats.add(x));
        if ((o as THREE.Light).isLight) {
          const l = o as THREE.Light;
          if (l.userData.baseI === undefined) l.userData.baseI = l.intensity;
          ls.push({ l, base: l.userData.baseI });
        }
      });
      list.current = [...mats].map((mat) => {
        if (mat.userData.baseOpacity === undefined) {
          mat.userData.baseOpacity = mat.opacity;
          if (!(mat as THREE.ShaderMaterial).uniforms) mat.transparent = true;
        }
        return { mat, base: mat.userData.baseOpacity as number };
      });
      lights.current = ls;
      last.current = -1;
    }

    {
      last.current = active;
      for (const f of list.current) {
        const u = (f.mat as THREE.ShaderMaterial).uniforms;
        if (u && u.uFade) u.uFade.value = active;
        else f.mat.opacity = f.base * active * ((f.mat.userData.mul as number | undefined) ?? 1);
      }
      for (const f of lights.current) f.l.intensity = f.base * active;
    }
  });

  return (
    <group ref={ref} position={[0, 0, STATION_Z[id]]} visible={id === "hero"}>
      {children}
    </group>
  );
}