import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fx, expPan } from "./scrollFx";
import { stationActive } from "./stationVisibility";
import { cameraAt } from "./stations";
import { useJourneyProgress } from "./JourneyProgressContext";

const PARALLAX = 0.22;
const ARRIVE_DIST = 0.25;

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

  useFrame(({ camera, clock }, rawDelta) => {
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
    const ea = stationActive(progressRef.current, "experience");
    if (ea > 0) {
      desired.current.x += expPan.x * ea;
      desired.current.y += expPan.y * ea;
      desiredLook.current.x += expPan.x * ea * 1.6;
      desiredLook.current.y += expPan.y * ea * 1.6;
    }
    const ct = clock.elapsedTime;
    desired.current.x += Math.sin(ct * 0.31) * 0.09;
    desired.current.y += Math.cos(ct * 0.23) * 0.05;

    const k = 1 - Math.exp(-delta * 7);
    pos.current.lerp(desired.current, k);
    look.current.lerp(desiredLook.current, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return null;
}