import { useEffect, useRef } from "react";
import gsap from "gsap";

export type FadeDirection = "up" | "down" | "left" | "right" | null;

export function useFadeIn<T extends HTMLElement = HTMLDivElement>(
  direction: FadeDirection = null,
  delay = 0
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const distance = 55;
    const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
    const y = direction === "up"   ? distance : direction === "down"  ? -distance : 0;

    gsap.fromTo(
      el,
      { opacity: 0, x, y },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 1.2,
        delay,
        ease: "expo.out",
        clearProps: "transform",   // release GPU layer after animation
      }
    );
  }, [direction, delay]);

  return ref;
}
