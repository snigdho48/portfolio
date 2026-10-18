import { useEffect, useRef, type ReactNode } from "react";
import { loaderDone } from "@/utils/loaderGate";
import {
  afterEngagement,
  isCoarsePointer,
  isNarrowViewport,
  prefersReducedMotion,
} from "@/utils/heroCapabilities";

type KineticLinesProps = {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  delay?: number;
};

/**
 * Splits text into line wrappers. CSS handles the first-paint reveal;
 * GSAP upgrades the motion after user engagement.
 */
export default function KineticLines({
  children,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: KineticLinesProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const lines = root.querySelectorAll<HTMLElement>("[data-line]");

    if (prefersReducedMotion()) {
      lines.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.animation = "none";
      });
      return;
    }

    // Mobile / static path: keep CSS reveal — never pull GSAP/ScrollTrigger
    if (isCoarsePointer() || isNarrowViewport()) {
      return;
    }

    let revert: (() => void) | undefined;
    let cancelled = false;

    const cancel = afterEngagement(() => {
      void (async () => {
        const gsapMod = await import("gsap");
        const stMod = await import("gsap/ScrollTrigger");
        await loaderDone();
        if (cancelled || !rootRef.current) return;

        const gsap = gsapMod.default;
        const { ScrollTrigger } = stMod;
        gsap.registerPlugin(ScrollTrigger);

        const rect = root.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

        lines.forEach((el) => {
          el.style.animation = "none";
        });

        const ctx = gsap.context(() => {
          if (inView) {
            gsap.from(lines, {
              yPercent: 28,
              duration: 0.95,
              ease: "power3.out",
              stagger: 0.12,
              delay,
              clearProps: "transform",
            });
          } else {
            gsap.from(lines, {
              yPercent: 85,
              opacity: 0.15,
              duration: 1,
              ease: "power3.out",
              stagger: 0.12,
              delay,
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: root,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            });
          }
        }, root);

        revert = () => ctx.revert();
      })();
    });

    return () => {
      cancelled = true;
      cancel();
      revert?.();
    };
  }, [delay]);

  const text =
    typeof children === "string"
      ? children
      : Array.isArray(children)
        ? children.join("")
        : String(children ?? "");

  const parts = text.split(/\n/).filter(Boolean);

  return (
    <Tag
      ref={rootRef as never}
      className={`kinetic ${className}`}
      aria-label={parts.join(" ")}
    >
      {parts.map((line, i) => (
        <span key={i} className="kinetic__mask" aria-hidden>
          <span
            data-line
            className="kinetic__line"
            data-text={line}
            style={{ animationDelay: `${delay + i * 0.12}s` }}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
