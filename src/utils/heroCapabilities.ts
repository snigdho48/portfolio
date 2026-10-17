/** Decide whether the lazy Three.js hero should run. */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function isNarrowViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 900px)").matches;
}

/** Heuristic for low-power / constrained devices */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return true;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return true;
  if (
    nav.connection?.effectiveType === "slow-2g" ||
    nav.connection?.effectiveType === "2g"
  ) {
    return true;
  }
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) {
    return true;
  }

  return false;
}

export function shouldUseHero3D(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  if (isCoarsePointer()) return false;
  if (isNarrowViewport()) return false;
  if (isLowPowerDevice()) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** After first paint + idle — for non-critical enhancements. */
export function afterFirstPaint(cb: () => void): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const run = () => {
    if (cancelled) return;
    cb();
  };

  const scheduleIdle = () => {
    if (cancelled) return;
    const win = window as Window & {
      requestIdleCallback?: (
        fn: IdleRequestCallback,
        opts?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(() => run(), { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(run, 600);
    }
  };

  const afterPaint = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(scheduleIdle);
    });
  };

  if (document.readyState === "complete") {
    afterPaint();
  } else {
    window.addEventListener("load", afterPaint, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener("load", afterPaint);
    if (idleId != null) {
      (
        window as Window & { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback?.(idleId);
    }
    if (timeoutId != null) window.clearTimeout(timeoutId);
  };
}

/**
 * Run after first paint, but only once the user engages (scroll / pointer / key).
 * Keeps heavy animation code off the lab critical path without bot detection.
 */
export function afterEngagement(cb: () => void): () => void {
  let cancelled = false;
  let cancelPaint: (() => void) | undefined;
  let armed = false;

  const arm = () => {
    if (cancelled || armed) return;
    armed = true;
    detach();
    cancelPaint = afterFirstPaint(() => {
      if (!cancelled) cb();
    });
  };

  const detach = () => {
    window.removeEventListener("pointerdown", arm);
    window.removeEventListener("pointermove", arm);
    window.removeEventListener("wheel", arm);
    window.removeEventListener("scroll", arm);
    window.removeEventListener("keydown", arm);
    window.removeEventListener("touchstart", arm);
  };

  window.addEventListener("pointerdown", arm, { once: true, passive: true });
  window.addEventListener("pointermove", arm, { once: true, passive: true });
  window.addEventListener("wheel", arm, { once: true, passive: true });
  window.addEventListener("scroll", arm, { once: true, passive: true });
  window.addEventListener("keydown", arm, { once: true });
  window.addEventListener("touchstart", arm, { once: true, passive: true });

  return () => {
    cancelled = true;
    detach();
    cancelPaint?.();
  };
}
