/** Shared (three-free) state for the pinned Experience sequence. */
export const EXP_EVENT = "journey-exp-index";

export const expScroll = {
  /** Absolute scrollY at which the Experience pin starts. */
  startY: 0,
  /** Pin length in px. */
  length: 1,
  count: 3,
};

export function goToExpIndex(i: number) {
  const n = Math.max(1, expScroll.count - 1);
  const y = expScroll.startY + (Math.min(Math.max(i, 0), n) / n) * expScroll.length;
  window.scrollTo({ top: y, behavior: "auto" });
}