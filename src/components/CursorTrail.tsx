import { useEffect, useRef } from "react";
import {
  isCoarsePointer,
  isLowPowerDevice,
  isNarrowViewport,
  prefersReducedMotion,
} from "@/utils/heroCapabilities";

type Pt = { x: number; y: number; t: number };
const LIFE = 520; // ms

/** Soft teal glow trail behind the pointer (2D canvas, idle = no rAF). Desktop, motion allowed, not low-power. */
export default function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer() || isNarrowViewport() || isLowPowerDevice()) return;
    const cv = ref.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const pts: Pt[] = [];
    let raf = 0;
    const draw = (now: number) => {
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (pts.length < 2) {
        raf = 0;
        return;
      }
      c.globalCompositeOperation = "lighter";
      c.lineCap = "round";
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const k = 1 - (now - b.t) / LIFE;
        c.strokeStyle = `rgba(45,212,191,${(0.38 * k * k).toFixed(3)})`;
        c.lineWidth = 1 + 5 * k;
        c.shadowColor = "rgba(34,211,238,0.7)";
        c.shadowBlur = 14 * k;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pts.length > 40) pts.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="cursor-trail" aria-hidden />;
}
