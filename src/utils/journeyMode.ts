import {
  isCoarsePointer,
  isLowPowerDevice,
  isNarrowViewport,
  prefersReducedMotion,
  shouldUseHero3D,
} from "./heroCapabilities";

/** True when the scroll-driven 3D journey should run. */
export function shouldUseJourney3D(): boolean {
  return shouldUseHero3D();
}

/** Static layout for reduced-motion, mobile, low-power, or no-WebGL. */
export function shouldUseStaticLanding(): boolean {
  if (typeof window === "undefined") return true;
  if (prefersReducedMotion()) return true;
  if (isCoarsePointer()) return true;
  if (isNarrowViewport()) return true;
  if (isLowPowerDevice()) return true;
  return !shouldUseJourney3D();
}
