/** Shared (three-free) state for the pinned Work sequence. */
export const WORK_EVENT = "journey-work-index";

export const workScroll = {
  /** Absolute scrollY at which the Work pin starts. */
  startY: 0,
  /** Pin length in px. */
  length: 1,
  count: 7,
};

/** Plateau easing: each project dwells, then glides to the next. */
export function easeProject(f: number): number {
  const k = Math.floor(f);
  const fr = f - k;
  const t = Math.min(1, Math.max(0, (fr - 0.3) / 0.4));
  return k + t * t * (3 - 2 * t);
}

export function goToWorkIndex(i: number) {
  const n = Math.max(1, workScroll.count - 1);
  const y = workScroll.startY + (Math.min(Math.max(i, 0), n) / n) * workScroll.length;
  window.scrollTo({ top: y, behavior: "auto" });
}