import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { experience } from "@/data/portfolio";
import { EXP_EVENT, goToExpIndex } from "./expScroll";
import { EXP_PLATEAU, EXP_SIDES, expVis } from "./expTimeline";
import { useJourneyProgress } from "./JourneyProgressContext";

/** Big label per role: the first year of the period, or "Present" for the current role. */
function yearLabel(period: string): string {
  if (/present/i.test(period)) return "Present";
  return period.match(/\d{4}/)?.[0] ?? period;
}

const dash = (s: string) => s.replace(/\s-\s/g, " \u2013 ");

/** Splits text into animatable fragments (letters or words). Each fragment carries data-x. */
function frag(text: string, letters: boolean): ReactNode {
  return text.split(" ").map((w, wi, arr) => (
    <span key={wi}>
      <span className="xw">
        {letters ? (
          Array.from(w).map((ch, ci) => (
            <span key={ci} className="xl" data-x="l">
              {ch}
            </span>
          ))
        ) : (
          <span className="xl" data-x="w">
            {w}
          </span>
        )}
      </span>
      {wi < arr.length - 1 ? " " : ""}
    </span>
  ));
}

type Piece = {
  el: HTMLElement;
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  rot: number;
  ph: number;
  dOut: number;
  dIn: number;
  leaf: number;
  hue: number;
};

const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const c01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Wind blows the text toward the side the light runs to; fragments assemble from the side the light came from. */
const X_OUT = [1, -1, 1];
const X_IN = [-1, 1, -1];
const LEAF_COLORS = ["#2fe3c2", "#8ff5df", "#c9fff3", "#d8c488"];

/**
 * Pinned Experience sequence. The glowing light zig-zags down a 3D path
 * (left, right, left); the company text sits on the opposite side. Scrolling
 * moves the light on while the current text dissolves into leaf-like fragments
 * that curl away on the wind, and the next role assembles from drifting
 * fragments on the other side. Everything is a pure function of scroll (see
 * expTimeline.ts), so scrolling back reverses it. All text comes from portfolio.ts.
 */
export default function StationExperience() {
  // CV lists newest first; the path runs from the earliest role to today.
  const list = useMemo(() => [...experience].reverse(), []);
  const [idx, setIdx] = useState(0);
  const { expIndexRef } = useJourneyProgress();
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const on = (e: Event) => setIdx((e as CustomEvent<number>).detail);
    window.addEventListener(EXP_EVENT, on);
    return () => window.removeEventListener(EXP_EVENT, on);
  }, []);

  // Scroll-scrubbed dissolve / assemble. No React state per frame; direct style writes.
  useEffect(() => {
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    if (!pin || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const blocks = Array.from(pin.querySelectorAll<HTMLElement>("[data-exp-block]"));
    const pieces: Piece[][] = [];
    let W = 0;
    let H = 0;
    let dpr = 1;

    const leafPath = new Path2D();
    leafPath.moveTo(0, -1);
    leafPath.quadraticCurveTo(0.85, -0.1, 0, 1);
    leafPath.quadraticCurveTo(-0.85, -0.1, 0, -1);

    const measure = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = pin.clientWidth;
      H = pin.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      blocks.forEach((b, r) => {
        const rand = rng(1000 + r * 97);
        const els = Array.from(b.querySelectorAll<HTMLElement>("[data-x]"));
        const raw = els.map((el) => {
          let x = 0;
          let y = 0;
          let e: HTMLElement | null = el;
          while (e && e !== pin) {
            x += e.offsetLeft;
            y += e.offsetTop;
            e = e.offsetParent as HTMLElement | null;
          }
          return { el, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
        });
        const minX = Math.min(...raw.map((p) => p.cx));
        const span = Math.max(1, Math.max(...raw.map((p) => p.cx)) - minX);
        pieces[r] = raw.map((p) => {
          const word = p.el.dataset.x === "w";
          const along = (p.cx - minX) / span; // 0 = left edge, 1 = right edge
          const outProj = X_OUT[r] > 0 ? along : 1 - along;
          const inProj = X_IN[r] > 0 ? along : 1 - along;
          return {
            ...p,
            ax: 90 + rand() * 230,
            ay: 30 + rand() * 150,
            rot: (rand() - 0.5) * 760,
            ph: rand() * 6.283,
            dOut: 0.72 * outProj + 0.28 * rand(),
            dIn: 0.72 * inProj + 0.28 * rand(),
            leaf: word ? 9 + rand() * 7 : 6 + rand() * 4.5,
            hue: Math.floor(rand() * LEAF_COLORS.length),
          };
        });
      });
      last = -1;
    };

    let last = -1;
    let visible = false;
    const full = [false, false, false];
    let stop = false;
    let tick: (() => void) | undefined;
    let gsapRef: typeof import("gsap").default | undefined;

    const frame = () => {
      if (!visible) return;
      const q = expIndexRef.current;
      if (Math.abs(q - last) < 1e-5) return;
      last = q;
      const vis = expVis(q);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < blocks.length; r++) {
        const v = vis[r];
        const b = blocks[r];
        if (v <= 0.002) {
          b.style.visibility = "hidden";
          full[r] = false;
          continue;
        }
        b.style.visibility = "visible";
        const ps = pieces[r];
        if (!ps) continue;
        if (v >= 0.999) {
          if (!full[r]) {
            for (const p of ps) {
              p.el.style.transform = "";
              p.el.style.opacity = "";
            }
            full[r] = true;
          }
          continue;
        }
        full[r] = false;
        const rising = q < EXP_PLATEAU[r];
        const D = 1 - v;
        const dirX = rising ? X_IN[r] : X_OUT[r];
        for (const p of ps) {
          const dl = rising ? 1 - p.dIn : p.dOut;
          const L = c01((D - dl * 0.55) / 0.45);
          const e = Math.pow(L, 1.15);
          const x = dirX * p.ax * e + Math.sin(p.ph + e * 4.5) * 20 * e;
          const y = (rising ? p.ay * 0.6 : -p.ay) * e + Math.cos(p.ph * 1.3 + e * 3.2) * 16 * e;
          const rot = p.rot * e * dirX;
          const s = 1 - 0.4 * e;
          const o = c01(1 - (L - 0.08) / 0.85);
          p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`;
          p.el.style.opacity = o.toFixed(3);
          if (L > 0.015 && L < 0.985) {
            const a = Math.pow(Math.sin(Math.PI * L), 0.6) * 0.95;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.translate(p.cx + x * 1.18 + dirX * 8 * e, p.cy + y * 1.25);
            ctx.rotate((rot * 1.9 * Math.PI) / 180 + p.ph);
            ctx.scale(p.leaf * 0.55, p.leaf * (1 - 0.3 * Math.abs(Math.sin(p.ph + e * 7))));
            ctx.fillStyle = LEAF_COLORS[p.hue];
            ctx.shadowColor = "#1fe3c2";
            ctx.shadowBlur = 6;
            ctx.fill(leafPath);
            ctx.restore();
          }
        }
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    void document.fonts?.ready.then(() => !stop && measure());
    const io = new IntersectionObserver((en) => {
      visible = en[0]?.isIntersecting ?? false;
      last = -1;
    });
    const sec = pin.closest("section");
    if (sec) io.observe(sec);
    void import("gsap").then(({ default: gsap }) => {
      if (stop) return;
      gsapRef = gsap;
      tick = frame;
      gsap.ticker.add(tick);
    });
    return () => {
      stop = true;
      ro.disconnect();
      io.disconnect();
      if (tick) gsapRef?.ticker.remove(tick);
    };
  }, [expIndexRef, list]);

  const total = String(list.length).padStart(2, "0");
  const n = String(idx + 1).padStart(2, "0");

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      goToExpIndex(Math.min(list.length - 1, idx + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      goToExpIndex(Math.max(0, idx - 1));
    }
  };

  return (
    <section
      id="experience"
      className="journey-station journey-station--experience"
      aria-label="Experience"
    >
      <div className="work-pin exp-pin" ref={pinRef}>
        {list.map((job, r) => (
          <div
            key={`${job.company}-${job.period}`}
            className={`exp-side exp-side--${EXP_SIDES[r]}`}
            aria-hidden
          >
            <div className="exp-block" data-exp-block={r}>
              <p className="exp-year-big">{frag(yearLabel(job.period), true)}</p>
              <h2 className="work-name exp-company">{frag(job.company, true)}</h2>
              <p className="exp-role">
                <span>{frag(job.role, false)}</span>
                <i aria-hidden />
                <span>{frag(dash(job.period), false)}</span>
              </p>
              <ul className="exp-bullets">
                {job.bullets.slice(0, 4).map((b) => (
                  <li key={b}>{frag(b, false)}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        <canvas ref={canvasRef} className="exp-leaves" aria-hidden />

        <div className="exp-hud">
          <p className="work-counter" aria-hidden>
            <span className="exp-hud__label">Experience</span>
            <b>{n}</b> / {total}
          </p>
          <div className="work-dots" role="group" aria-label="Roles" onKeyDown={onKey}>
            {list.map((q, i) => (
              <button
                key={`${q.company}-${q.period}`}
                type="button"
                className="work-dot"
                aria-label={`${yearLabel(q.period)} ${q.company}`}
                aria-current={i === idx}
                onClick={() => goToExpIndex(i)}
              />
            ))}
          </div>
          <p className="journey-scroll-hint">
            <span>Scroll to explore</span>
            <span aria-hidden>&darr;</span>
            <i aria-hidden />
          </p>
        </div>
      </div>

      <div className="journey-exp-layer" aria-hidden>
        {list.map((q, i) => (
          <div key={`${q.company}-${q.period}`} className="journey-exp-anchor" data-exp-anchor={i}>
            <p className="journey-exp-year">{yearLabel(q.period)}</p>
          </div>
        ))}
      </div>

      {/* every role stays available to assistive tech */}
      <ul className="journey-sr-only" aria-live="polite">
        {list.map((q) => (
          <li key={`${q.company}-${q.period}`}>
            {q.company}, {q.role}, {q.period}: {q.bullets.join(" ")}
          </li>
        ))}
      </ul>
    </section>
  );
}