import { useEffect, useRef } from "react";
import { scrollNav } from "@/journey/scrollNav";
import { prefersReducedMotion } from "@/utils/heroCapabilities";

const R = 15;
const C = 2 * Math.PI * R;

/** Circular page-progress indicator (bottom-left). Click = back to top. Written via DOM, no React state. */
export default function ScrollRing() {
  const btn = useRef<HTMLButtonElement>(null);
  const arc = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (arc.current) arc.current.style.strokeDashoffset = String(C * (1 - p));
      btn.current?.classList.toggle("is-visible", window.scrollY > 40);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      ref={btn}
      type="button"
      className="scroll-ring"
      aria-label="Scroll progress - back to top"
      title="Back to top"
      onClick={() => {
        if (scrollNav.lenis) scrollNav.to(0);
        else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={R} className="scroll-ring__track" />
        <circle ref={arc} cx="20" cy="20" r={R} className="scroll-ring__arc" strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 20 20)" />
        <path d="M20 25v-9m-4 4 4-4 4 4" className="scroll-ring__arrow" />
      </svg>
    </button>
  );
}
