import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fx, expCam } from "./scrollFx";
import { stationActive } from "./stationVisibility";
import { warpAt, WARP_HOP } from "./warp";
import { STATION_Z, REF_ASPECT, SUN_NDC, SUN_D, halfW, halfH } from "./layout";
import { cameraAt } from "./stations";
import { useJourneyProgress } from "./JourneyProgressContext";

const PARALLAX = 0.22;
const ARRIVE_DIST = 0.25;
const tmpP = new THREE.Vector3();
const tmpL = new THREE.Vector3();
const sunW = new THREE.Vector3();
const tgtP = new THREE.Vector3();
const tgtL = new THREE.Vector3();
const easeIO = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * Glides the camera between station poses (dwell + smoothstep), or flies
 * toward a panel on click. All easing is time-based so it converges the same
 * at any frame rate.
 */
export default function CameraRig() {
  const {
    progressRef,
    targetProgressRef,
    pointerRef,
    flyTargetRef,
    flyActiveRef,
    flyArrivePendingRef,
    onFlyArriveRef,
  } = useJourneyProgress();
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ camera, clock, size }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.25);
    fx.update(delta);

    if (!initialized.current) {
      cameraAt(progressRef.current, pos.current, look.current);
      camera.position.copy(pos.current);
      camera.lookAt(look.current);
      initialized.current = true;
    }

    const fly = flyTargetRef.current;
    if (flyActiveRef.current && fly) {
      const k = 1 - Math.exp(-delta * 3.2);
      pos.current.lerp(fly.position, k);
      look.current.lerp(fly.lookAt, k);
      camera.position.copy(pos.current);
      camera.lookAt(look.current);
      if (
        flyArrivePendingRef.current &&
        pos.current.distanceTo(fly.position) < ARRIVE_DIST
      ) {
        flyArrivePendingRef.current = false;
        const slug = fly.slug;
        flyActiveRef.current = false;
        flyTargetRef.current = null;
        onFlyArriveRef.current?.(slug);
      }
      return;
    }

    const target = targetProgressRef.current;
    progressRef.current += (target - progressRef.current) * (1 - Math.exp(-delta * 4.5));
    if (Math.abs(target - progressRef.current) < 0.0004) progressRef.current = target;

    cameraAt(progressRef.current, desired.current, desiredLook.current);
    desired.current.x += pointerRef.current.x * PARALLAX;
    desired.current.y += pointerRef.current.y * PARALLAX * 0.6;
    const pNow = progressRef.current;
    const wp = warpAt(pNow);
    const ea = wp.active && pNow < WARP_HOP ? 1 : stationActive(pNow, "experience");
    if (ea > 0 && expCam.on > 0) {
      const w = ea * expCam.on;
      tmpP.set(expCam.px, expCam.py, expCam.pz);
      tmpL.set(expCam.lx, expCam.ly, expCam.lz);
      desired.current.lerp(tmpP, w);
      desiredLook.current.lerp(tmpL, w);
    }
    if (wp.active) {
      // Experience -> Skills warp: push into the light, hop under the bloom, pull back from the sun.
      const px = pointerRef.current.x * PARALLAX;
      const py = pointerRef.current.y * PARALLAX * 0.6;
      if (pNow < WARP_HOP) {
        tgtP.set(expCam.nx + px, expCam.ny + 0.25 + py, expCam.nz + 0.9);
        tgtL.set(expCam.nx, expCam.ny + 0.1, expCam.nz);
        desired.current.lerp(tgtP, wp.a);
        desiredLook.current.lerp(tgtL, wp.a);
      } else {
        const kS = Math.min(1, size.width / size.height / REF_ASPECT);
        sunW.set(SUN_NDC[0] * halfW(SUN_D) * kS, SUN_NDC[1] * halfH(SUN_D) * kS, STATION_Z.skills - SUN_D * kS);
        const e = easeIO(wp.b);
        tgtP.set(sunW.x, sunW.y + 0.1, sunW.z + 2.7 * kS);
        desired.current.set(px, py, STATION_Z.skills);
        desired.current.lerpVectors(tgtP, desired.current, e);
        tgtL.set(0, 0, STATION_Z.skills - 10);
        desiredLook.current.lerpVectors(sunW, tgtL, e);
      }
    }
    const ct = clock.elapsedTime;
    desired.current.x += Math.sin(ct * 0.31) * 0.09;
    desired.current.y += Math.cos(ct * 0.23) * 0.05;
    // Skills: slow camera drift so the planets and the backdrop shift against each other
    const sa = stationActive(pNow, "skills");
    if (sa > 0) {
      desired.current.x += Math.sin(ct * 0.17) * 0.5 * sa;
      desired.current.y += Math.sin(ct * 0.13 + 1.0) * 0.28 * sa;
      desiredLook.current.x += Math.sin(ct * 0.11) * 0.4 * sa;
    }

    const k = 1 - Math.exp(-delta * (wp.active ? 24 : 7));
    if (wp.flash > 0.97) {
      // fully under the bloom: hop is invisible
      pos.current.copy(desired.current);
      look.current.copy(desiredLook.current);
    } else {
      pos.current.lerp(desired.current, k);
      look.current.lerp(desiredLook.current, k);
    }
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    // Experience journey: fov change and gentle banking (weighted by station activity)
    const pc = camera as THREE.PerspectiveCamera;
    const w2 = stationActive(progressRef.current, "experience") * expCam.on;
    let fovT = 45 + (expCam.fov - 45) * w2;
    let rollT = w2 > 0.001 ? expCam.roll * w2 : 0;
    if (wp.active) {
      if (pNow < WARP_HOP) {
        fovT = expCam.fov + (22 - expCam.fov) * wp.a;
        rollT = expCam.roll * (1 - wp.a) + 0.3 * wp.a;
      } else {
        const e = easeIO(wp.b);
        fovT = 68 + (45 - 68) * e;
        rollT = -0.3 * (1 - e);
      }
    }
    if (Math.abs(pc.fov - fovT) > 0.01) {
      pc.fov = fovT;
      pc.updateProjectionMatrix();
    }
    if (Math.abs(rollT) > 0.0005) camera.rotateZ(rollT);
  });

  return null;
}