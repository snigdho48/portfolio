import { useEffect, useRef } from "react";

const STORAGE_KEY = "snigdho-loader-seen-v2";
const MIN_MS = 1100; // shortest cinematic run (also the cached-assets path)
const CAP_MS = 3600; // hard cap: never wait longer than this
const SCENE_GIVE_UP_MS = 2400; // don't wait for the 3D canvas beyond this

function finishFlag() {
  const el = document.documentElement;
  if (el.dataset.loader) {
    delete el.dataset.loader;
    window.dispatchEvent(new Event("loader:done"));
  }
}

/** Real readiness 0..1 from fonts, window load, <img> decode and the 3D canvas. */
function readiness(t: number): number {
  const fonts = (window as unknown as { __ldFonts?: boolean }).__ldFonts ? 1 : 0;
  const load = document.readyState === "complete" ? 1 : 0;
  const imgs = Array.from(document.images);
  const imgDone = imgs.length ? imgs.filter((i) => i.complete).length / imgs.length : 1;
  const scene = document.querySelector("canvas") || t > SCENE_GIVE_UP_MS ? 1 : 0;
  return 0.2 * fonts + 0.3 * load + 0.2 * imgDone + 0.3 * scene;
}

/**
 * Cinematic first-load: a light ball draws the SNIGDHO wordmark while a counter
 * tracks real asset readiness, then the loader splits along the light ray and the
 * halves part to reveal the hero. Desktop only (mobile/reduced motion use a
 * pure-CSS fast fade defined in index.html/index.css). No three import.
 */
export default function Loader() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (document.documentElement.dataset.loader !== "on") {
      root.remove();
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    void document.fonts?.ready.then(() => {
      (window as unknown as { __ldFonts?: boolean }).__ldFonts = true;
    });
    if (!document.fonts) (window as unknown as { __ldFonts?: boolean }).__ldFonts = true;

    const fills = root.querySelectorAll<HTMLElement>(".ld-fill");
    const balls = root.querySelectorAll<HTMLElement>(".ld-ball");
    const counts = root.querySelectorAll<HTMLElement>(".ld-count");
    const rays = root.querySelectorAll<HTMLElement>(".ld-ray");
    const top = root.querySelector<HTMLElement>(".ld-top");
    const bot = root.querySelector<HTMLElement>(".ld-bot");
    const flash = root.querySelector<HTMLElement>(".ld-flash");

    const t0 = performance.now();
    let p = 0;
    let phase: "load" | "exit" = "load";
    let exitT0 = 0;
    let raf = 0;
    let fired = false;

    const paint = (v: number) => {
      const pct = Math.round(v * 100);
      const inset = (100 - v * 100).toFixed(2);
      fills.forEach((f) => (f.style.clipPath = `inset(0 ${inset}% 0 0)`));
      balls.forEach((b) => (b.style.left = `${(v * 100).toFixed(2)}%`));
      rays.forEach((r) => (r.style.transform = `scaleX(${(0.15 + v * 0.85).toFixed(3)})`));
      counts.forEach((c) => (c.textContent = String(pct).padStart(3, "0")));
    };
    paint(0);

    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const t = now - t0;
      if (phase === "load") {
        const real = t >= CAP_MS ? 1 : readiness(t);
        // time floor makes the draw feel intentional even when everything is cached
        const floor = Math.min(1, t / MIN_MS);
        const target = Math.min(real, 0.12 + 0.88 * floor);
        p += (target - p) * 0.12;
        if (target >= 1 && p > 0.995) p = 1;
        paint(p);
        if (p >= 1) {
          phase = "exit";
          exitT0 = now;
          root.classList.add("is-exit");
        }
      } else {
        const e = now - exitT0;
        // 0-260ms: ray flares; 260-1150ms: halves part. Hero entrance fires mid-part.
        if (flash) flash.style.opacity = String(Math.max(0, Math.min(1, e / 200)) * (1 - Math.max(0, (e - 380) / 420)));
        if (e > 260) {
          const k = ease(Math.min(1, (e - 260) / 900));
          if (top) top.style.transform = `translate3d(0,${(-k * 100).toFixed(2)}%,0)`;
          if (bot) bot.style.transform = `translate3d(0,${(k * 100).toFixed(2)}%,0)`;
          root.style.setProperty("--ld-k", k.toFixed(3));
        }
        if (e > 560 && !fired) {
          fired = true;
          finishFlag();
        }
        if (e > 1250) {
          root.remove();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // belt and braces if rAF is throttled (background tab)
    const hardStop = window.setTimeout(() => {
      finishFlag();
      root.remove();
    }, CAP_MS + 2200);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hardStop);
    };
  }, []);

  const mark = (
    <div className="ld-stage" aria-hidden="true">
      <div className="ld-word">
        <span className="ld-outline">SNIGDHO</span>
        <span className="ld-fill">SNIGDHO</span>
        <i className="ld-ball" />
        <i className="ld-ray" />
      </div>
      <div className="ld-meta">
        <span className="ld-count">000</span>
        <span className="ld-pct">%</span>
        <span className="ld-tag">Software Engineer</span>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="ld" role="status" aria-live="polite" aria-label="Loading">
      <div className="ld-panel ld-top">{mark}</div>
      <div className="ld-panel ld-bot">{mark}</div>
      <div className="ld-flash" />
    </div>
  );
}
