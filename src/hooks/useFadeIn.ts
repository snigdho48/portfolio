import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/** Delay before content animations start — after page transition curtain (last panel: 0.6 + 0.6 = 1.2s) */
export const POST_TRANSITION_DELAY = 1.15;

export type FadeDirection = "up" | "down" | "left" | "right" | null;

export function useFadeIn<T extends HTMLElement = HTMLDivElement>(
  direction: FadeDirection = null,
  delay = 0
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const distance = 80;
    const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
    const y = direction === "up"   ? distance : direction === "down"  ? -distance : 0;

    gsap.set(el, { opacity: 0, x, y });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, x: 0, y: 0 });
      return;
    }

    const totalDelay = POST_TRANSITION_DELAY + delay;

    gsap.to(el, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: 1.2,
      delay: totalDelay,
      ease: "expo.out",
      clearProps: "transform",
    });
  }, [direction, delay]);

  return ref;
}
