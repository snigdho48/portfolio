import { scrollNav } from "./scrollNav";
/** Shared (three-free) state for the pinned Experience sequence. */
import { EXP_PLATEAU } from "./expTimeline";

export const EXP_EVENT = "journey-exp-index";

export const expScroll = {
  /** Absolute scrollY at which the Experience pin starts. */
  startY: 0,
  /** Pin length in px. */
  length: 1,
  count: 3,
};

export function goToExpIndex(i: number) {
  const q = EXP_PLATEAU[Math.min(Math.max(i, 0), EXP_PLATEAU.length - 1)];
  scrollNav.to(expScroll.startY + q * expScroll.length);
}