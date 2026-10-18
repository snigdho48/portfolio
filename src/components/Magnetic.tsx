import { useEffect } from "react";
import { isCoarsePointer, prefersReducedMotion } from "@/utils/heroCapabilities";

const SEL =
  ".btn-primary,.btn-ghost,.nav-link--cv,.theme-toggle,.sound-toggle,.contact-links a,.hero-cta a,.hero-cta button";

/** Buttons lean toward the pointer while hovered (delegated; no per-element listeners). */
export default function Magnetic() {
  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    let cur: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.transition = "transform .45s cubic-bezier(.2,.9,.3,1.35)";
      el.style.transform = "";
    };
    const onMove = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.(SEL) as HTMLElement | null;
      if (cur && cur !== t) {
        reset(cur);
        cur = null;
      }
      if (!t) return;
      cur = t;
      const r = t.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      t.style.transition = "transform .12s ease-out";
      t.style.transform = `translate3d(${(dx * 12).toFixed(1)}px, ${(dy * 9).toFixed(1)}px, 0)`;
    };
    const onLeave = () => {
      if (cur) reset(cur);
      cur = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, []);
  return null;
}
