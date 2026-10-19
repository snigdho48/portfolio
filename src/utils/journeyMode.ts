import { hasWebGL } from "./heroCapabilities";

/** The scroll-driven 3D journey runs everywhere WebGL works (no device / motion / size conditions). */
export function shouldUseJourney3D(): boolean {
  return hasWebGL();
}

/**
 * Last-resort static layout: ONLY when WebGL is truly unavailable (or the canvas fails to
 * create a context at runtime - see JourneyCanvas / Landing). Everything else gets the journey.
 */
export function shouldUseStaticLanding(): boolean {
  if (typeof window === "undefined") return true;
  return !shouldUseJourney3D();
}
