/**
 * Shared scroll-reactive animation clock (module state, no React).
 * `t` advances faster while the user scrolls and eases back to real time when
 * scrolling stops, so every station can animate from `fx.t` and speed up
 * together without any jumps or per-frame setState.
 */
/** Subtle camera pan toward the Experience ball (station-local units), written by the 3D timeline. */
export const expPan = { x: 0, y: 0 };

/** Experience journey camera (world coords + fov + roll), written by ExperienceTimeline, applied by CameraRig. */
export const expCam = { on: 0, px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: -10, fov: 45, roll: 0 };

export const fx = {
  /** Animation time in seconds (speed-scaled). */
  t: 0,
  /** Smoothed 0..1 scroll energy. */
  boost: 0,
  /** Latest raw lenis velocity (px/frame-ish), written by JourneyScroll. */
  vel: 0,
  update(dt: number) {
    const d = Math.min(dt, 0.1);
    this.vel *= Math.exp(-d * 6);
    const target = Math.min(1, Math.abs(this.vel) / 28);
    const k = 1 - Math.exp(-d * (target > this.boost ? 7 : 1.6));
    this.boost += (target - this.boost) * k;
    this.t += d * (1 + this.boost * 4.5);
  },
};