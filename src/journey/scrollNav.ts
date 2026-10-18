/**
 * Three-free scroll navigation + section/station snapping helpers.
 * JourneyScroll registers the Lenis instance; everything else (nav, palette,
 * arrow keys, dots) goes through `scrollNav.to*` so they all share one eased motion
 * and are cancelable by user input. Falls back to native scrolling without Lenis.
 */
import { expScroll } from "./expScroll";
import { EXP_PLATEAU } from "./expTimeline";
import { workScroll } from "./workScroll";

type LenisLike = {
  scroll: number;
  isScrolling: boolean | string;
  scrollTo: (
    target: number,
    opts?: {
      immediate?: boolean;
      duration?: number;
      easing?: (t: number) => number;
      lock?: boolean;
      force?: boolean;
      onComplete?: () => void;
    },
  ) => void;
};

export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export type SnapPoint = { y: number; id: string };

const maxScroll = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const topOf = (id: string) => {
  const el = document.getElementById(id);
  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
};

export const scrollNav = {
  lenis: null as LenisLike | null,
  /** true while a programmatic snap/nav animation is running */
  animating: false,

  /** Every focal point where the view is allowed to rest, ascending in y. */
  points(): SnapPoint[] {
    const pts: SnapPoint[] = [{ y: 0, id: "hero" }];
    const n = workScroll.count;
    for (let i = 0; i < n; i++) {
      pts.push({
        y: Math.round(workScroll.startY + (n > 1 ? i / (n - 1) : 0) * workScroll.length),
        id: `work:${i}`,
      });
    }
    EXP_PLATEAU.forEach((q, i) =>
      pts.push({ y: Math.round(expScroll.startY + q * expScroll.length), id: `exp:${i}` }),
    );
    for (const id of ["skills", "about", "contact"]) {
      const y = topOf(id);
      if (y != null) pts.push({ y: Math.min(y, maxScroll()), id });
    }
    return pts
      .map((p) => ({ ...p, y: Math.min(p.y, maxScroll()) }))
      .sort((a, b) => a.y - b.y);
  },

  nearest(y: number): SnapPoint {
    const pts = this.points();
    let best = pts[0];
    for (const p of pts) if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
    return best;
  },

  to(y: number, opts: { duration?: number; immediate?: boolean } = {}) {
    const l = this.lenis;
    const target = Math.min(Math.max(0, y), maxScroll());
    if (!l) {
      window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
      return;
    }
    const dist = Math.abs(target - l.scroll);
    const vh = window.innerHeight || 900;
    const duration =
      opts.duration ?? Math.min(1.6, Math.max(0.7, 0.55 + (dist / vh) * 0.22));
    this.animating = true;
    l.scrollTo(target, {
      immediate: opts.immediate,
      duration,
      easing: easeInOutQuad,
      lock: false,
      onComplete: () => {
        this.animating = false;
      },
    });
    if (opts.immediate) this.animating = false;
  },

  /** Stop an in-flight programmatic scroll where it is. */
  cancel() {
    const l = this.lenis;
    if (!l || !this.animating) return;
    this.animating = false;
    l.scrollTo(l.scroll, { immediate: true, force: true });
  },

  /** Nav/palette entry: scroll to the first focal point of a section id. */
  toSection(id: string): boolean {
    const pts = this.points();
    const first =
      id === "work"
        ? pts.find((p) => p.id === "work:0")
        : id === "experience"
          ? pts.find((p) => p.id === "exp:0")
          : pts.find((p) => p.id === id);
    if (!first && id !== "hero") return false;
    if (!this.lenis) return false;
    this.to(first ? first.y : 0);
    return true;
  },
};
